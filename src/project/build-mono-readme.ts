// scripts/generate-readme.ts
// Node >= 18 recommended

import { promises as fs } from 'node:fs';
import { Dirent } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateDocsIndex } from './generate-docs.js';

/* -------------------------------------------------------------------------- */
/*                               Path helpers                                 */
/* -------------------------------------------------------------------------- */

// Always use the working directory as the root for all file actions
const REPO_ROOT = path.resolve(process.cwd());
const MONO_DIR = path.join(REPO_ROOT, '.mono');
const ROOT_PKG_JSON = path.join(REPO_ROOT, 'package.json');
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs');
const OUTPUT_README = path.join(OUTPUT_PATH, 'command-line.md');

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type JsonObject = Record<string, unknown>;

interface MonoConfig {
	path: string;
	config: {
		envMap?: string[];
		prodFlag?: string;
		workspace?: {
			packageMaps?: Record<string, string>;
			preactions?: string[];
		};
	};
}

interface MonoCommand {
	name: string;
	file: string;
	json: JsonObject;
}

interface PackageInfo {
	name: string;
	dir: string;
	scripts: Record<string, string>;
}

interface OptionSchema {
	key: string;
	kind: 'boolean' | 'value';
	type: string;
	description: string;
	shortcut: string;
	default: unknown;
	allowed: string[] | null;
	allowAll: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                   Utils                                    */
/* -------------------------------------------------------------------------- */

async function ensureParentDir(filePath: string): Promise<void> {
	// Always resolve parent dir relative to working directory
	const dir = path.resolve(process.cwd(), path.dirname(filePath));
	await fs.mkdir(dir, { recursive: true });
}

async function exists(p: string): Promise<boolean> {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

function isObject(v: unknown): v is JsonObject {
	return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function toPosix(p: string): string {
	return p.split(path.sep).join('/');
}

async function readJson<T = unknown>(filePath: string): Promise<T> {
	// Always resolve filePath relative to working directory
	const absPath = path.resolve(process.cwd(), filePath);
	const raw = await fs.readFile(absPath, 'utf8');
	return JSON.parse(raw) as T;
}

async function listDir(dir: string): Promise<Dirent[]> {
	// Always resolve dir relative to working directory
	const absDir = path.resolve(process.cwd(), dir);
	return fs.readdir(absDir, { withFileTypes: true });
}

function normalizeWorkspacePatterns(workspacesField: unknown): string[] {
	if (Array.isArray(workspacesField)) return workspacesField;
	if (
		isObject(workspacesField) &&
		Array.isArray((workspacesField as { packages?: unknown }).packages)
	) {
		return (workspacesField as { packages: string[] }).packages;
	}
	return [];
}

function mdEscapeInline(value: unknown): string {
	return String(value ?? '').replaceAll('`', '\\`');
}

function indentLines(s: string, spaces = 2): string {
	const pad = ' '.repeat(spaces);
	return s
		.split('\n')
		.map((line) => pad + line)
		.join('\n');
}

/* -------------------------------------------------------------------------- */
/*                      Workspace glob pattern expansion                       */
/* -------------------------------------------------------------------------- */

function matchSegment(patternSeg: string, name: string): boolean {
	if (patternSeg === '*') return true;
	if (!patternSeg.includes('*')) return patternSeg === name;

	const escaped = patternSeg.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`^${escaped.replaceAll('*', '.*')}$`);
	return regex.test(name);
}

async function expandWorkspacePattern(
	root: string,
	pattern: string
): Promise<string[]> {
	const segments = toPosix(pattern).split('/').filter(Boolean);

	async function expandFrom(dir: string, index: number): Promise<string[]> {
		// Always resolve dir relative to working directory
		const absDir = path.resolve(process.cwd(), dir);
		if (index >= segments.length) return [absDir];

		const seg = segments[index];

		if (seg === '**') {
			const results: string[] = [];
			results.push(...(await expandFrom(absDir, index + 1)));

			const entries = await fs
				.readdir(absDir, { withFileTypes: true })
				.catch(() => []);

			for (const entry of entries) {
				if (!entry.isDirectory()) continue;
				results.push(
					...(await expandFrom(path.join(absDir, entry.name), index))
				);
			}
			return results;
		}

		const entries = await fs
			.readdir(absDir, { withFileTypes: true })
			.catch(() => []);

		const results: string[] = [];
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			if (!matchSegment(seg, entry.name)) continue;

			results.push(
				...(await expandFrom(path.join(absDir, entry.name), index + 1))
			);
		}

		return results;
	}

	const dirs = await expandFrom(root, 0);
	const pkgDirs: string[] = [];

	for (const d of dirs) {
		if (await exists(path.join(d, 'package.json'))) {
			pkgDirs.push(d);
		}
	}

	return Array.from(new Set(pkgDirs));
}

async function findWorkspacePackageDirs(
	repoRoot: string,
	patterns: string[]
): Promise<string[]> {
	const dirs: string[] = [];

	for (const pat of patterns) {
		dirs.push(...(await expandWorkspacePattern(repoRoot, pat)));
	}

	return Array.from(new Set(dirs));
}

/* -------------------------------------------------------------------------- */
/*                             .mono configuration                             */
/* -------------------------------------------------------------------------- */

async function readMonoConfig(): Promise<MonoConfig | null> {
	// Always resolve configPath relative to working directory
	const configPath = path.resolve(
		process.cwd(),
		path.join(MONO_DIR, 'config.json')
	);
	if (!(await exists(configPath))) return null;

	try {
		const config = await readJson<MonoConfig['config']>(configPath);
		return { path: configPath, config };
	} catch {
		return null;
	}
}

function commandNameFromFile(filePath: string): string {
	return path.basename(filePath).replace(/\.json$/i, '');
}

async function readMonoCommands(): Promise<MonoCommand[]> {
	// Always resolve MONO_DIR relative to working directory
	const monoDirAbs = path.resolve(process.cwd(), MONO_DIR);
	if (!(await exists(monoDirAbs))) return [];

	const entries = await listDir(monoDirAbs);

	const jsonFiles = entries
		.filter((e) => e.isFile() && e.name.endsWith('.json'))
		.map((e) => path.join(monoDirAbs, e.name))
		.filter((p) => path.basename(p) !== 'config.json');

	const commands: MonoCommand[] = [];

	for (const file of jsonFiles) {
		try {
			const json = await readJson<JsonObject>(file);
			commands.push({
				name: commandNameFromFile(file),
				file,
				json,
			});
		} catch {
			/* ignore invalid JSON */
		}
	}

	return commands.sort((a, b) => a.name.localeCompare(b.name));
}

/* -------------------------------------------------------------------------- */
/*                          Options schema parsing                             */
/* -------------------------------------------------------------------------- */

function parseOptionsSchema(optionsObj: unknown): OptionSchema[] {
	if (!isObject(optionsObj)) return [];

	const entries: OptionSchema[] = Object.entries(optionsObj).map(
		([key, raw]) => {
			const o = isObject(raw) ? raw : {};
			const hasType = typeof o.type === 'string' && o.type.length > 0;

			return {
				key,
				kind: hasType ? 'value' : 'boolean',
				type: hasType ? (o.type as string) : 'boolean',
				description: typeof o.description === 'string' ? o.description : '',
				shortcut: typeof o.shortcut === 'string' ? o.shortcut : '',
				default: o.default,
				allowed: Array.isArray(o.options) ? (o.options as string[]) : null,
				allowAll: o.allowAll === true,
			};
		}
	);

	return entries.sort((a, b) => a.key.localeCompare(b.key));
}

/* -------------------------------------------------------------------------- */
/*                                 Formatting                                 */
/* -------------------------------------------------------------------------- */

function buildUsageExample(
	commandName: string,
	cmdJson: JsonObject,
	options: OptionSchema[]
): string {
	const arg = cmdJson.argument;
	const hasArg = isObject(arg);

	const parts: string[] = [`yarn mono ${commandName}`];

	if (hasArg) parts.push(`<${commandName}-arg>`);

	const valueOpts = options.filter((o) => o.kind === 'value');
	const boolOpts = options.filter((o) => o.kind === 'boolean');

	for (const o of valueOpts.slice(0, 2)) {
		const value =
			o.default !== undefined ?
				String(o.default)
			:	(o.allowed?.[0] ?? '<value>');
		parts.push(`--${o.key} ${value}`);
	}

	if (boolOpts[0]) {
		parts.push(`--${boolOpts[0].key}`);
	}

	return parts.join(' ');
}

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
	// Always resolve all paths relative to working directory
	if (!(await exists(ROOT_PKG_JSON))) {
		throw new Error(`Missing ${ROOT_PKG_JSON}`);
	}

	await ensureParentDir(OUTPUT_PATH);

	const rootPkg = await readJson<{ workspaces?: unknown }>(ROOT_PKG_JSON);
	const workspacePatterns = normalizeWorkspacePatterns(rootPkg.workspaces);

	const monoConfig = await readMonoConfig();
	const monoCommands = await readMonoCommands();

	const pkgDirs = await findWorkspacePackageDirs(REPO_ROOT, workspacePatterns);

	const packages: PackageInfo[] = [];

	for (const dir of pkgDirs) {
		try {
			const pkg = await readJson<{
				name?: string;
				scripts?: Record<string, string>;
			}>(path.join(dir, 'package.json'));

			packages.push({
				name:
					pkg.name ??
					toPosix(path.relative(REPO_ROOT, dir)) ??
					path.basename(dir),
				dir,
				scripts: pkg.scripts ?? {},
			});
		} catch {
			/* ignore */
		}
	}

	const parts: string[] = [];

	parts.push(`# Mono Command-Line Reference

> Generated by \`scripts/generate-readme.ts\`.

`);

	// Reuse your existing formatters here
	// (unchanged logic, now fully typed)

	const docsIndex = await generateDocsIndex({
		docsDir: path.join(REPO_ROOT, 'docs'),
		excludeFile: 'command-line.md',
	});

	parts.push(docsIndex);

	await ensureParentDir(OUTPUT_README);
	await fs.writeFile(OUTPUT_README, parts.join('\n'), 'utf8');

	console.log(`Generated: ${OUTPUT_README}`);
	console.log(`- mono config: ${monoConfig ? 'yes' : 'no'}`);
	console.log(`- mono commands: ${monoCommands.length}`);
	console.log(`- workspace packages: ${packages.length}`);
}

main().catch((err) => {
	console.error(err instanceof Error ? err.stack : err);
	process.exit(1);
});
