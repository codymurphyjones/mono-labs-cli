import type { MarkerType } from './enums'

export interface SecurityGateConfig {
	enabled: boolean
	blockOnCritical: boolean
	blockOnHigh: boolean
}

export interface IntegrationsConfig {
	github?: { owner: string; repo: string }
	jira?: { baseUrl: string; project: string }
	ai?: { model?: string }
}

export interface TrackerConfig {
	rootDir: string
	include: string[]
	exclude: string[]
	markers: MarkerType[]
	storagePath: string
	snapshotPath: string
	idPrefix: string
	gitBlame: boolean
	securityGate: SecurityGateConfig
	integrations: IntegrationsConfig
}

export const DEFAULT_CONFIG: TrackerConfig = {
	rootDir: '.',
	include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
	exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
	markers: ['TODO', 'FIXME', 'BUG', 'HACK', 'NOTE', 'OPTIMIZE', 'SECURITY', 'DEPRECATION'],
	storagePath: '.tracker/notations.jsonl',
	snapshotPath: '.tracker/snapshots.jsonl',
	idPrefix: 'N',
	gitBlame: false,
	securityGate: { enabled: false, blockOnCritical: true, blockOnHigh: false },
	integrations: {},
}
