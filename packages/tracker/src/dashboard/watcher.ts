import chokidar from 'chokidar'
import type { TrackerConfig } from '../types'
import type { NotationManager } from '../manager'
import { scanFiles } from '../scanner'

export interface FileWatcher {
	close: () => Promise<void>
}

export function createFileWatcher(
	config: TrackerConfig,
	projectRoot: string,
	manager: NotationManager,
	onUpdate: () => void
): FileWatcher {
	let debounceTimer: ReturnType<typeof setTimeout> | null = null

	const handleChange = () => {
		if (debounceTimer) clearTimeout(debounceTimer)

		debounceTimer = setTimeout(async () => {
			try {
				const notations = await scanFiles(config, projectRoot)
				manager.setAll(notations)
				onUpdate()
			} catch (err) {
				console.error('[tracker] Re-scan failed:', err)
			}
		}, 300)
	}

	const watcher = chokidar.watch(config.include, {
		cwd: projectRoot,
		ignored: config.exclude,
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 50,
		},
	})

	watcher.on('add', handleChange)
	watcher.on('change', handleChange)
	watcher.on('unlink', handleChange)

	return {
		close: async () => {
			if (debounceTimer) clearTimeout(debounceTimer)
			await watcher.close()
		},
	}
}
