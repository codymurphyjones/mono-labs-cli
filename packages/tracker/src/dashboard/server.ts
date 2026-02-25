import fs from 'fs'
import http from 'http'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { WebSocketServer, WebSocket } from 'ws'
import type { DashboardConfig, DashboardServer } from './types'
import { NotationManager } from '../manager'
import { scanFiles } from '../scanner'
import { serializeActions } from '../scanner/action-serializer'
import type { NotationQuery, NotationAction, Notation } from '../types'
import { createFileWatcher } from './watcher'
import { SnapshotStorage, type Snapshot } from '../storage/snapshot-storage'
import { loadSecrets } from '../storage/config-loader'
import { computeHealthScore } from '../manager/health-score'
import { evaluateSecurityGate, type GateResult } from '../governance/security-gate'
import { computeDeprecationSummary, type DeprecationSummary } from '../governance/deprecation-tracker'
import { computeBurnDown, type BurnDownData } from '../manager/projection'
import { batchBlame } from '../scanner/git-blame'
import { executeAction } from '../executor'
import { createGitHubIssue } from '../integrations/github-issues'
import { createJiraIssue } from '../integrations/jira-issues'
import { suggestFix } from '../integrations/ai-suggest'

export async function startDashboard(opts: DashboardConfig): Promise<DashboardServer> {
	const { projectRoot, config, port = 4321 } = opts
	const secrets = loadSecrets()

	const manager = new NotationManager(config)

	// Snapshot storage
	const snapshotPath = path.isAbsolute(config.snapshotPath)
		? config.snapshotPath
		: path.join(projectRoot, config.snapshotPath)
	const snapshotStorage = new SnapshotStorage(snapshotPath)

	// Initial scan
	const notations = await scanFiles(config, projectRoot)
	manager.setAll(notations)

	// Take initial snapshot
	await takeSnapshotIfNewDay(manager, snapshotStorage)

	// Optionally run git blame
	if (config.gitBlame) {
		runBlameAsync(projectRoot, manager, () => broadcastUpdate())
	}

	const app = express()
	app.use(cors())
	app.use(express.json())

	// --- Helper to compute current gate result ---
	function currentGateResult(): GateResult {
		return evaluateSecurityGate(manager.getAll(), config)
	}

	function currentHealthScore(): number {
		return computeHealthScore(manager.getAll())
	}

	// --- API Routes ---

	app.get('/api/notations', (req, res) => {
		const query: NotationQuery = {}

		if (req.query.type) query.type = req.query.type as any
		if (req.query.status) query.status = req.query.status as any
		if (req.query.priority) query.priority = req.query.priority as any
		if (req.query.tags) query.tags = (req.query.tags as string).split(',')
		if (req.query.search) query.search = req.query.search as string
		if (req.query.file) query.file = req.query.file as string
		if (req.query.assignee) query.assignee = req.query.assignee as string
		if (req.query.overdue === 'true') query.overdue = true
		if (req.query.blocked === 'true') query.blocked = true
		if (req.query.dueBefore) query.dueBefore = req.query.dueBefore as string
		if (req.query.dueAfter) query.dueAfter = req.query.dueAfter as string

		res.json(manager.query(query))
	})

	app.get('/api/notations/:id', (req, res) => {
		const notation = manager.getById(req.params.id)
		if (!notation) {
			res.status(404).json({ error: 'Notation not found' })
			return
		}
		res.json(notation)
	})

	app.get('/api/stats', (_req, res) => {
		res.json(manager.stats())
	})

	app.get('/api/config', (_req, res) => {
		// Strip secrets — never expose tokens
		const safeConfig = { ...config }
		res.json({
			config: safeConfig,
			projectRoot,
			integrations: {
				github: !!config.integrations.github && !!secrets.githubToken,
				jira: !!config.integrations.jira && !!secrets.jiraToken,
				ai: !!secrets.aiKey,
			},
		})
	})

	app.post('/api/scan', async (_req, res) => {
		try {
			const fresh = await scanFiles(config, projectRoot)
			manager.setAll(fresh)
			await takeSnapshotIfNewDay(manager, snapshotStorage)
			if (config.gitBlame) {
				runBlameAsync(projectRoot, manager, () => broadcastUpdate())
			}
			broadcastUpdate()
			res.json({ count: fresh.length })
		} catch (err) {
			res.status(500).json({ error: 'Scan failed' })
		}
	})

	app.get('/api/notations/:id/source', (req, res) => {
		const notation = manager.getById(req.params.id)
		if (!notation) {
			res.status(404).json({ error: 'Notation not found' })
			return
		}
		try {
			const filePath = path.resolve(projectRoot, notation.location.file)
			const content = fs.readFileSync(filePath, 'utf-8')
			const lines = content.split('\n')
			const startLine = notation.location.line - 1
			const endLine = (notation.location.endLine ?? notation.location.line) - 1
			const source = lines.slice(startLine, endLine + 1).join('\n')
			res.json({
				source,
				file: notation.location.file,
				line: notation.location.line,
				endLine: notation.location.endLine ?? notation.location.line,
			})
		} catch (err) {
			res.status(500).json({ error: 'Failed to read source file' })
		}
	})

	app.put('/api/notations/:id/source', async (req, res) => {
		const notation = manager.getById(req.params.id)
		if (!notation) {
			res.status(404).json({ error: 'Notation not found' })
			return
		}
		try {
			const { source } = req.body as { source: string }
			const filePath = path.resolve(projectRoot, notation.location.file)
			const content = fs.readFileSync(filePath, 'utf-8')
			const lines = content.split('\n')
			const startLine = notation.location.line - 1
			const endLine = (notation.location.endLine ?? notation.location.line) - 1
			const newLines = source.split('\n')
			lines.splice(startLine, endLine - startLine + 1, ...newLines)
			fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
			const fresh = await scanFiles(config, projectRoot)
			manager.setAll(fresh)
			broadcastUpdate()
			res.json({ ok: true })
		} catch (err) {
			res.status(500).json({ error: 'Failed to write source file' })
		}
	})

	app.put('/api/notations/:id/actions', async (req, res) => {
		const notation = manager.getById(req.params.id)
		if (!notation) {
			res.status(404).json({ error: 'Notation not found' })
			return
		}
		try {
			const { actions } = req.body as { actions: NotationAction[] }
			const filePath = path.resolve(projectRoot, notation.location.file)
			const content = fs.readFileSync(filePath, 'utf-8')
			const lines = content.split('\n')
			const startLine = notation.location.line - 1
			const endLine = (notation.location.endLine ?? notation.location.line) - 1
			const blockLines = lines.slice(startLine, endLine + 1)

			// Remove existing Action: lines
			const filtered = blockLines.filter((l) => !l.trim().match(/^\/\/\s*Action:\s*/i))

			// Find where to insert new action lines (after last comment line, before code)
			let insertIdx = 0
			for (let i = 0; i < filtered.length; i++) {
				if (filtered[i].trim().startsWith('//')) {
					insertIdx = i + 1
				} else {
					break
				}
			}

			const serialized = serializeActions(actions)
			filtered.splice(insertIdx, 0, ...serialized)

			lines.splice(startLine, endLine - startLine + 1, ...filtered)
			fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
			const fresh = await scanFiles(config, projectRoot)
			manager.setAll(fresh)
			broadcastUpdate()
			res.json({ ok: true })
		} catch (err) {
			res.status(500).json({ error: 'Failed to update actions' })
		}
	})

	// --- Snapshot endpoints ---

	app.get('/api/snapshots', async (req, res) => {
		try {
			const days = parseInt(req.query.days as string) || 30
			const snapshots = await snapshotStorage.readRange(days)
			res.json(snapshots)
		} catch (err) {
			res.status(500).json({ error: 'Failed to read snapshots' })
		}
	})

	app.get('/api/health', (_req, res) => {
		res.json({
			score: currentHealthScore(),
			deductions: computeHealthScoreDetails(manager.getAll()),
		})
	})

	// --- Governance endpoints ---

	app.get('/api/governance/gate', (_req, res) => {
		res.json(currentGateResult())
	})

	app.get('/api/governance/deprecations', (_req, res) => {
		res.json(computeDeprecationSummary(manager.getAll()))
	})

	// --- Action execution endpoints ---

	app.post('/api/notations/:id/execute-action', async (req, res) => {
		const notation = manager.getById(req.params.id)
		if (!notation) {
			res.status(404).json({ error: 'Notation not found' })
			return
		}
		try {
			const { actionIndex } = req.body as { actionIndex: number }
			const action = notation.actions[actionIndex]
			if (!action) {
				res.status(400).json({ error: 'Action not found at index' })
				return
			}
			const result = await executeAction(action, notation, projectRoot)
			// Rescan after execution
			const fresh = await scanFiles(config, projectRoot)
			manager.setAll(fresh)
			broadcastUpdate()
			res.json(result)
		} catch (err) {
			res.status(500).json({ error: 'Action execution failed' })
		}
	})

	app.put('/api/notations/:id/metadata', async (req, res) => {
		const notation = manager.getById(req.params.id)
		if (!notation) {
			res.status(404).json({ error: 'Notation not found' })
			return
		}
		try {
			const updates = req.body as { status?: string; priority?: string; assignee?: string; tags?: string[] }
			updateNotationMetadataInSource(notation, updates, projectRoot)
			const fresh = await scanFiles(config, projectRoot)
			manager.setAll(fresh)
			broadcastUpdate()
			res.json({ ok: true })
		} catch (err) {
			res.status(500).json({ error: 'Failed to update metadata' })
		}
	})

	app.post('/api/notations/batch', async (req, res) => {
		try {
			const { ids, operation, payload } = req.body as {
				ids: string[]
				operation: 'updateStatus' | 'updatePriority' | 'updateAssignee' | 'executeAction'
				payload: any
			}
			const results: any[] = []
			for (const id of ids) {
				const notation = manager.getById(id)
				if (!notation) continue
				if (operation === 'executeAction') {
					const action = notation.actions[payload.actionIndex]
					if (action) {
						results.push(await executeAction(action, notation, projectRoot))
					}
				} else {
					const updates: Record<string, any> = {}
					if (operation === 'updateStatus') updates.status = payload.value
					if (operation === 'updatePriority') updates.priority = payload.value
					if (operation === 'updateAssignee') updates.assignee = payload.value
					updateNotationMetadataInSource(notation, updates, projectRoot)
					results.push({ ok: true, id })
				}
			}
			const fresh = await scanFiles(config, projectRoot)
			manager.setAll(fresh)
			broadcastUpdate()
			res.json({ results })
		} catch (err) {
			res.status(500).json({ error: 'Batch operation failed' })
		}
	})

	// --- Git blame endpoint ---

	app.get('/api/notations/:id/blame', (req, res) => {
		const notation = manager.getById(req.params.id)
		if (!notation) {
			res.status(404).json({ error: 'Notation not found' })
			return
		}
		res.json({ blame: notation.blame || null })
	})

	// --- Issue tracker endpoints ---

	app.post('/api/notations/:id/create-issue', async (req, res) => {
		const notation = manager.getById(req.params.id)
		if (!notation) {
			res.status(404).json({ error: 'Notation not found' })
			return
		}
		try {
			const { provider } = req.body as { provider: 'github' | 'jira' }
			let issueUrl: string

			if (provider === 'github') {
				if (!config.integrations.github || !secrets.githubToken) {
					res.status(400).json({ error: 'GitHub integration not configured' })
					return
				}
				issueUrl = await createGitHubIssue(
					config.integrations.github,
					secrets.githubToken,
					notation
				)
			} else if (provider === 'jira') {
				if (!config.integrations.jira || !secrets.jiraToken) {
					res.status(400).json({ error: 'Jira integration not configured' })
					return
				}
				issueUrl = await createJiraIssue(
					config.integrations.jira,
					secrets.jiraToken,
					notation
				)
			} else {
				res.status(400).json({ error: 'Unknown provider' })
				return
			}

			// Store the linked issue on the notation
			manager.update(notation.id, { linkedIssue: issueUrl })
			broadcastUpdate()
			res.json({ url: issueUrl })
		} catch (err: any) {
			res.status(500).json({ error: err.message || 'Failed to create issue' })
		}
	})

	// --- AI suggest fix endpoint ---

	app.post('/api/notations/:id/suggest-fix', async (req, res) => {
		const notation = manager.getById(req.params.id)
		if (!notation) {
			res.status(404).json({ error: 'Notation not found' })
			return
		}
		if (!secrets.aiKey) {
			res.status(400).json({ error: 'AI integration not configured (TRACKER_AI_KEY not set)' })
			return
		}
		if (notation.type !== 'BUG' && notation.type !== 'OPTIMIZE') {
			res.status(400).json({ error: 'AI fix suggestions only available for BUG and OPTIMIZE notations' })
			return
		}
		try {
			// Read surrounding source context
			const filePath = path.resolve(projectRoot, notation.location.file)
			const content = fs.readFileSync(filePath, 'utf-8')
			const lines = content.split('\n')
			const startLine = Math.max(0, notation.location.line - 26)
			const endLine = Math.min(lines.length, (notation.location.endLine ?? notation.location.line) + 25)
			const sourceContext = lines.slice(startLine, endLine).join('\n')

			const model = config.integrations.ai?.model || 'claude-sonnet-4-5'
			const result = await suggestFix(secrets.aiKey, model, notation, sourceContext)
			res.json(result)
		} catch (err: any) {
			res.status(500).json({ error: err.message || 'AI suggestion failed' })
		}
	})

	// --- Burn-down projection ---

	app.get('/api/projection/burndown', async (_req, res) => {
		try {
			const snapshots = await snapshotStorage.readAll()
			const burndown = computeBurnDown(snapshots, manager.getAll())
			res.json(burndown)
		} catch (err) {
			res.status(500).json({ error: 'Failed to compute burn-down' })
		}
	})

	// --- Static SPA ---

	const distDashboard = path.join(__dirname, '..', '..', 'dist-dashboard')
	app.use(express.static(distDashboard))

	// SPA fallback: all non-API routes serve index.html
	app.get('*', (_req, res) => {
		res.sendFile(path.join(distDashboard, 'index.html'))
	})

	// --- HTTP + WebSocket ---

	const server = http.createServer(app)
	const wss = new WebSocketServer({ server, path: '/ws' })

	const clients = new Set<WebSocket>()

	wss.on('connection', (ws) => {
		clients.add(ws)

		// Send full state on connect
		ws.send(JSON.stringify({
			type: 'init',
			notations: manager.getAll(),
			stats: manager.stats(),
			healthScore: currentHealthScore(),
			gateResult: currentGateResult(),
		}))

		ws.on('close', () => {
			clients.delete(ws)
		})
	})

	function broadcastUpdate() {
		const message = JSON.stringify({
			type: 'update',
			notations: manager.getAll(),
			stats: manager.stats(),
			healthScore: currentHealthScore(),
			gateResult: currentGateResult(),
		})

		for (const client of clients) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message)
			}
		}
	}

	// --- File Watcher ---

	const watcher = createFileWatcher(config, projectRoot, manager, async () => {
		await takeSnapshotIfNewDay(manager, snapshotStorage)
		if (config.gitBlame) {
			runBlameAsync(projectRoot, manager, () => broadcastUpdate())
		}
		broadcastUpdate()
	})

	// --- Start ---

	await new Promise<void>((resolve) => {
		server.listen(port, () => resolve())
	})

	return {
		server,
		manager,
		close: async () => {
			await watcher.close()
			for (const client of clients) {
				client.close()
			}
			await new Promise<void>((resolve, reject) => {
				server.close((err) => (err ? reject(err) : resolve()))
			})
		},
	}
}

// --- Helpers ---

async function takeSnapshotIfNewDay(manager: NotationManager, snapshotStorage: SnapshotStorage): Promise<void> {
	const today = new Date().toISOString().slice(0, 10)
	try {
		const latestDate = await snapshotStorage.getLatestDate()
		if (latestDate === today) return
		const stats = manager.stats()
		const healthScore = computeHealthScore(manager.getAll())
		await snapshotStorage.append({ date: today, stats, healthScore })
	} catch (err) {
		console.error('[tracker] Failed to take snapshot:', err)
	}
}

function runBlameAsync(projectRoot: string, manager: NotationManager, onComplete: () => void): void {
	const notations = manager.getAll()
	batchBlame(projectRoot, notations)
		.then((blamed) => {
			for (const n of blamed) {
				if (n.blame) {
					manager.update(n.id, { blame: n.blame })
				}
			}
			onComplete()
		})
		.catch((err) => {
			console.error('[tracker] Git blame failed:', err)
		})
}

function computeHealthScoreDetails(notations: Notation[]): { reason: string; deduction: number }[] {
	const deductions: { reason: string; deduction: number }[] = []
	let unresolvedHacks = 0
	let unresolvedBugs = 0
	let criticalSecurity = 0
	let highSecurity = 0
	let overdueCount = 0
	let blockedCount = 0
	let pastEol = 0
	let totalDebt = 0

	for (const n of notations) {
		if (n.status === 'resolved') continue
		if (n.type === 'HACK') unresolvedHacks++
		if (n.type === 'BUG') unresolvedBugs++
		if (n.type === 'SECURITY' && n.priority === 'critical') criticalSecurity++
		if (n.type === 'SECURITY' && n.priority === 'high') highSecurity++
		if (n.dueDate && new Date(n.dueDate + 'T23:59:59') < new Date()) overdueCount++
		if (n.relationships.length > 0) blockedCount++
		if (n.type === 'DEPRECATION' && n.eolDate && new Date(n.eolDate) < new Date()) pastEol++
		if (n.debt) totalDebt += n.debt.hours
	}

	if (unresolvedHacks > 0) deductions.push({ reason: `${unresolvedHacks} unresolved HACK(s)`, deduction: unresolvedHacks * 3 })
	if (unresolvedBugs > 0) deductions.push({ reason: `${unresolvedBugs} unresolved BUG(s)`, deduction: unresolvedBugs * 4 })
	if (criticalSecurity > 0) deductions.push({ reason: `${criticalSecurity} critical SECURITY issue(s)`, deduction: criticalSecurity * 10 })
	if (highSecurity > 0) deductions.push({ reason: `${highSecurity} high SECURITY issue(s)`, deduction: highSecurity * 5 })
	if (overdueCount > 0) deductions.push({ reason: `${overdueCount} overdue notation(s)`, deduction: overdueCount * 2 })
	if (blockedCount > 0) deductions.push({ reason: `${blockedCount} blocked notation(s)`, deduction: blockedCount * 1 })
	if (totalDebt > 40) deductions.push({ reason: `${totalDebt}h debt (>${40}h threshold)`, deduction: Math.floor((totalDebt - 40) / 10) })
	if (pastEol > 0) deductions.push({ reason: `${pastEol} past-EOL deprecation(s)`, deduction: pastEol * 3 })

	return deductions
}

function updateNotationMetadataInSource(notation: Notation, updates: Record<string, any>, projectRoot: string): void {
	const filePath = path.resolve(projectRoot, notation.location.file)
	const content = fs.readFileSync(filePath, 'utf-8')
	const lines = content.split('\n')
	const startLine = notation.location.line - 1
	const endLine = (notation.location.endLine ?? notation.location.line) - 1
	const blockLines = lines.slice(startLine, endLine + 1)

	// Find existing attribute lines or add new ones
	const attrLines: string[] = []
	if (updates.status) attrLines.push(`// @status: ${updates.status}`)
	if (updates.priority) attrLines.push(`// @priority: ${updates.priority}`)
	if (updates.assignee !== undefined) attrLines.push(`// @assignee: ${updates.assignee}`)

	// Find insertion point (after marker line, before code)
	let insertIdx = 1 // After the marker line
	for (let i = 1; i < blockLines.length; i++) {
		if (blockLines[i].trim().startsWith('//')) {
			insertIdx = i + 1
		} else {
			break
		}
	}

	// Remove existing attribute lines that we're replacing
	const keysToReplace = Object.keys(updates)
	const filtered = blockLines.filter((l, idx) => {
		if (idx === 0) return true // Keep marker line
		for (const key of keysToReplace) {
			const pattern = new RegExp(`^\\s*\\/\\/\\s*@${key}:`, 'i')
			if (pattern.test(l)) return false
		}
		return true
	})

	// Re-find insertion point after filtering
	insertIdx = 1
	for (let i = 1; i < filtered.length; i++) {
		if (filtered[i].trim().startsWith('//')) {
			insertIdx = i + 1
		} else {
			break
		}
	}

	filtered.splice(insertIdx, 0, ...attrLines)
	lines.splice(startLine, endLine - startLine + 1, ...filtered)
	fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
}
