import * as fs from 'fs'
import * as path from 'path'
import type { TrackerConfig } from '../types'
import { DEFAULT_CONFIG } from '../types'

export function loadConfig(projectRoot: string): TrackerConfig {
	const configPath = path.join(projectRoot, 'tracker.config.json')
	let userConfig: Partial<TrackerConfig> = {}

	try {
		const raw = fs.readFileSync(configPath, 'utf-8')
		userConfig = JSON.parse(raw)
	} catch {
		// No config file or invalid JSON — use defaults
	}

	return {
		...DEFAULT_CONFIG,
		...userConfig,
		rootDir: projectRoot,
	}
}
