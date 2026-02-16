import fs from 'fs';
import path from 'path';

/* ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

export interface MonoWorkspaceConfig {
	packageMaps: Record<string, string>;
}

export interface MonoProjectConfig {
	envMap: string[];
	workspace: MonoWorkspaceConfig;
	prodFlag: string;
}

export type MonoFiles = Record<string, unknown>;

export interface MonoConfig {
	config: MonoProjectConfig;
	files: MonoFiles;
}

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Walk up from cwd until we find a directory containing package.json.
 * This is treated as the project root.
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
	let current = startDir;

	while (true) {
		const pkg = path.join(current, 'package.json');
		if (fs.existsSync(pkg)) return current;

		const parent = path.dirname(current);
		if (parent === current) break;

		current = parent;
	}

	// Fallback: use cwd
	return startDir;
}

export function getRootDirectory(): string {
	return findProjectRoot();
}

export function getRootJson(): Record<string, unknown> {
	const root = getRootDirectory();
	const jsonPath = path.join(root, 'package.json');

	if (!fs.existsSync(jsonPath)) {
		throw new Error(`package.json not found in ${root}`);
	}

	return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}

/* ------------------------------------------------------------------
 * Mono (.mono) handling
 * ------------------------------------------------------------------ */

const DISALLOWED_FILES = new Set(['tools']);

function readJsonFile(filePath: string): unknown {
	return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Resolve the .mono directory.
 * Priority:
 *  1. project root/.mono
 *  2. cwd/.mono
 */
export function resolveMonoDirectory(): string | null {
	const root = getRootDirectory();
	const rootMono = path.join(root, '.mono');
	if (fs.existsSync(rootMono)) return rootMono;

	const cwdMono = path.join(process.cwd(), '.mono');
	if (fs.existsSync(cwdMono)) return cwdMono;

	return null;
}

export function getMonoFiles(): string[] {
	const dir = resolveMonoDirectory();
	if (!dir) return [];

	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith('.json'))
		.map((f) => path.join(dir, f));
}

let _monoConfigCache: MonoConfig | null = null;

/**
 * Load and validate mono configuration.
 * Results are cached — subsequent calls return the same object.
 */
export function getMonoConfig(): MonoConfig {
	if (_monoConfigCache) return _monoConfigCache;

	const monoDir = resolveMonoDirectory();

	if (!monoDir) {
		_monoConfigCache = {
			files: {},
			config: {
				envMap: [],
				workspace: { packageMaps: {} },
				prodFlag: 'live',
			},
		};
		return _monoConfigCache;
	}

	const files: MonoFiles = {};
	let config: MonoProjectConfig = {
		envMap: [],
		workspace: { packageMaps: {} },
		prodFlag: 'live',
	};

	for (const filePath of getMonoFiles()) {
		const fileName = path.basename(filePath, '.json');

		if (DISALLOWED_FILES.has(fileName)) {
			throw new Error(`Disallowed file name in .mono directory: ${fileName}`);
		}

		const data = readJsonFile(filePath);

		if (fileName === 'config') {
			if (typeof data === 'object' && data !== null) {
				config = data as MonoProjectConfig;
			}
		} else {
			files[fileName] = data;
		}
	}

	_monoConfigCache = { files, config };
	return _monoConfigCache;
}

export function clearMonoConfigCache(): void {
	_monoConfigCache = null;
}
