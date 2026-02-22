import type { MarkerType } from './enums'

export interface TrackerConfig {
	rootDir: string
	include: string[]
	exclude: string[]
	markers: MarkerType[]
	storagePath: string
	idPrefix: string
}

export const DEFAULT_CONFIG: TrackerConfig = {
	rootDir: '.',
	include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
	exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
	markers: ['TODO', 'FIXME', 'BUG', 'HACK', 'NOTE', 'OPTIMIZE', 'SECURITY'],
	storagePath: '.tracker/notations.jsonl',
	idPrefix: 'N',
}
