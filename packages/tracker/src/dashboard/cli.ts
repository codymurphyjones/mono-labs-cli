import { findWorkspaceRoot } from '@mono-labs/shared'
import { loadConfig } from '../storage'
import { startDashboard } from './server'

async function main() {
	const args = process.argv.slice(2)

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

main().catch((err) => {
	console.error('[tracker] Failed to start:', err)
	process.exit(1)
})
