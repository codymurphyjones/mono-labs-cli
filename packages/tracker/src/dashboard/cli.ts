import { findWorkspaceRoot } from '@mono-labs/shared'
import { loadConfig } from '../storage'
import { startDashboard } from './server'
import { scanFiles } from '../scanner'
import { evaluateSecurityGate } from '../governance/security-gate'

async function main() {
	const args = process.argv.slice(2)

	// Check for subcommand
	if (args[0] === 'gate') {
		return runGate(args.slice(1))
	}

	let port = 4321
	let rootOverride: string | undefined

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--port' && args[i + 1]) {
			port = parseInt(args[i + 1], 10)
			i++
		} else if (args[i] === '--root' && args[i + 1]) {
			rootOverride = args[i + 1]
			i++
		}
	}

	// Auto-detect monorepo/project root
	const { root: detectedRoot, isWorkspace } = findWorkspaceRoot(rootOverride)
	const projectRoot = rootOverride ?? detectedRoot

	console.log(`[tracker] Project root: ${projectRoot}${isWorkspace ? ' (workspace)' : ''}`)

	const config = loadConfig(projectRoot)
	const server = await startDashboard({ projectRoot, config, port })

	console.log(`[tracker] Dashboard running at http://localhost:${port}`)

	const shutdown = async () => {
		console.log('\n[tracker] Shutting down...')
		await server.close()
		process.exit(0)
	}

	process.on('SIGINT', shutdown)
	process.on('SIGTERM', shutdown)
}

async function runGate(args: string[]) {
	let rootOverride: string | undefined
	let format: 'text' | 'json' = 'text'

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--root' && args[i + 1]) {
			rootOverride = args[i + 1]
			i++
		} else if (args[i] === '--format' && args[i + 1]) {
			format = args[i + 1] as 'text' | 'json'
			i++
		}
	}

	const { root: detectedRoot } = findWorkspaceRoot(rootOverride)
	const projectRoot = rootOverride ?? detectedRoot
	const config = loadConfig(projectRoot)

	const notations = await scanFiles(config, projectRoot)
	const result = evaluateSecurityGate(notations, config)

	if (format === 'json') {
		console.log(JSON.stringify(result, null, 2))
	} else {
		if (result.passed) {
			console.log(`[tracker] Security gate: PASSED`)
			console.log(`  ${result.summary}`)
		} else {
			console.log(`[tracker] Security gate: FAILED`)
			console.log(`  ${result.summary}`)
			for (const v of result.violations) {
				console.log(`  - [${v.priority}] ${v.notationId}: ${v.description}`)
			}
		}
	}

	process.exit(result.passed ? 0 : 1)
}

main().catch((err) => {
	console.error('[tracker] Failed to start:', err)
	process.exit(1)
})
