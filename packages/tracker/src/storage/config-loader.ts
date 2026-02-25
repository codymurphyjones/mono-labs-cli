import * as fs from 'fs'
import * as path from 'path'
import type { TrackerConfig } from '../types'
import { DEFAULT_CONFIG } from '../types'

export interface ResolvedSecrets {
	githubToken?: string
	jiraToken?: string
	aiKey?: string
}

export function loadSecrets(): ResolvedSecrets {
	return {
		githubToken: process.env.TRACKER_GITHUB_TOKEN || undefined,
		jiraToken: process.env.TRACKER_JIRA_TOKEN || undefined,
		aiKey: process.env.TRACKER_AI_KEY || undefined,
	}
}

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
		securityGate: { ...DEFAULT_CONFIG.securityGate, ...userConfig.securityGate },
		integrations: { ...DEFAULT_CONFIG.integrations, ...userConfig.integrations },
		rootDir: projectRoot,
	}
}
