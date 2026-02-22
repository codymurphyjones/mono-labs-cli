import http from 'http'
import path from 'path'
import express from 'express'
import cors from 'cors'
import { WebSocketServer, WebSocket } from 'ws'
import type { DashboardConfig, DashboardServer } from './types'
import { NotationManager } from '../manager'
import { scanFiles } from '../scanner'
import type { NotationQuery } from '../types'
import { createFileWatcher } from './watcher'

export async function startDashboard(opts: DashboardConfig): Promise<DashboardServer> {
	const { projectRoot, config, port = 4321 } = opts

	const manager = new NotationManager(config)

	// Initial scan
	const notations = await scanFiles(config, projectRoot)
	manager.setAll(notations)

	const app = express()
	app.use(cors())
	app.use(express.json())

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
		res.json({ config, projectRoot })
	})

	app.post('/api/scan', async (_req, res) => {
		try {
			const fresh = await scanFiles(config, projectRoot)
			manager.setAll(fresh)
			broadcastUpdate()
			res.json({ count: fresh.length })
		} catch (err) {
			res.status(500).json({ error: 'Scan failed' })
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
	const wss = new WebSocketServer({ server })

	const clients = new Set<WebSocket>()

	wss.on('connection', (ws) => {
		clients.add(ws)

		// Send full state on connect
		ws.send(JSON.stringify({
			type: 'init',
			notations: manager.getAll(),
			stats: manager.stats(),
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
		})

		for (const client of clients) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message)
			}
		}
	}

	// --- File Watcher ---

	const watcher = createFileWatcher(config, projectRoot, manager, broadcastUpdate)

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
