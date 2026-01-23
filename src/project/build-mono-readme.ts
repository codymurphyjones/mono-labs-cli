// scripts/generate-readme.mjs
// Node >= 18 recommended
import { promises as fs, Dirent } from 'node:fs';
import path from 'node:path';
import { generateDocsIndex } from './generate-docs.js';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type MonoConfig = {
	path: string;
	config: {
		envMap?: string[];
		prodFlag?: string;
		workspace?: {
			packageMaps?: Record<string, string>;
			preactions?: string[];
		};
	};
};

type MonoCommand = {
	name: string;
	file: string;
	json: {
		description?: string;
		argument?: {
			type?: string;
			description?: string;
			default?: unknown;
			required?: boolean;
		};
		options?: Record<string, unknown>;
		environments?: Record<string, Record<string, string>>;
		preactions?: string[];
		actions?: string[];
	};
};

type PackageInfo = {
	name: string;
	dir: string;
	scripts: Record<string, string>;
};

type OptionSchema = {
	key: string;
	kind: 'boolean' | 'value';
	type: string;
	description: string;
	shortcut: string;
	default: unknown;
	allowed: string[] | null;
	allowAll: boolean;
};

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const REPO_ROOT = path.resolve(process.cwd());
const MONO_DIR = path.join(REPO_ROOT, '.mono');
const ROOT_PKG_JSON = path.join(REPO_ROOT, 'package.json');
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs');
const OUTPUT_README = path.join(OUTPUT_PATH, 'command-line.md');

/* ------------------------------------------------------------------ */
/* Utils                                                              */
/* ------------------------------------------------------------------ */

async function ensureParentDir(filePath: string): Promise<void> {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function exists(p: string): Promise<boolean> {
	try {
		await fs.access(p);
		return true;
	} catch {
		return false;
	}
}

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function toPosix(p: string): string {
	return p.split(path.sep).join('/');
}

async function readJson<T>(filePath: string): Promise<T> {
	return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
}

async function listDir(dir: string): Promise<Dirent[]> {
	return fs.readdir(dir, { withFileTypes: true });
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

function mdEscapeInline(s: string): string {
	return s.replaceAll('`', '\\`');
}

function indentLines(s: string, spaces = 2): string {
	const pad = ' '.repeat(spaces);
	return s
		.split('\n')
		.map((l) => pad + l)
		.join('\n');
}

/* ------------------------------------------------------------------ */
/* Workspace globbing                                                  */
/* ------------------------------------------------------------------ */

function matchSegment(patternSeg: string, name: string): boolean {
	if (patternSeg === '*') return true;
	if (!patternSeg.includes('*')) return patternSeg === name;
	const escaped = patternSeg.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
	return new RegExp(`^${escaped.replaceAll('*', '.*')}$`).test(name);
}

async function expandWorkspacePattern(
	root: string,
	pattern: string
): Promise<string[]> {
	const segs = toPosix(pattern).split('/').filter(Boolean);

	async function expandFrom(dir: string, idx: number): Promise<string[]> {
		if (idx >= segs.length) return [dir];
		const seg = segs[idx];

		const entries = await fs
			.readdir(dir, { withFileTypes: true })
			.catch(() => []);

		if (seg === '**') {
			return [
				...(await expandFrom(dir, idx + 1)),
				...entries
					.filter((e) => e.isDirectory())
					.flatMap((e) => expandFrom(path.join(dir, e.name), idx)),
			];
		}

		return entries
			.filter((e) => e.isDirectory() && matchSegment(seg, e.name))
			.flatMap((e) => expandFrom(path.join(dir, e.name), idx + 1));
	}

	const dirs = await expandFrom(root, 0);
	const pkgDirs = await Promise.all(
		dirs.map(async (d) =>
			(await exists(path.join(d, 'package.json'))) ? d : null
		)
	);

	return [...new Set(pkgDirs.filter(Boolean) as string[])];
}

async function findWorkspacePackageDirs(
	repoRoot: string,
	workspacePatterns: string[]
): Promise<string[]> {
	const dirs = await Promise.all(
		workspacePatterns.map((p) => expandWorkspacePattern(repoRoot, p))
	);
	return [...new Set(dirs.flat())];
}

/* ------------------------------------------------------------------ */
/* Mono config + commands                                              */
/* ------------------------------------------------------------------ */

async function readMonoConfig(): Promise<MonoConfig | null> {
	const configPath = path.join(MONO_DIR, 'config.json');
	if (!(await exists(configPath))) return null;
	return { path: configPath, config: await readJson(configPath) };
}

function commandNameFromFile(filePath: string): string {
	return path.basename(filePath).replace(/\.json$/i, '');
}

async function readMonoCommands(): Promise<MonoCommand[]> {
	if (!(await exists(MONO_DIR))) return [];

	const entries = await listDir(MONO_DIR);

	return Promise.all(
		entries
			.filter(
				(e) =>
					e.isFile() && e.name.endsWith('.json') && e.name !== 'config.json'
			)
			.map(async (e) => {
				const file = path.join(MONO_DIR, e.name);
				return {
					name: commandNameFromFile(file),
					file,
					json: await readJson(file),
				};
			})
	).then((cmds) => cmds.sort((a, b) => a.name.localeCompare(b.name)));
}

/* ------------------------------------------------------------------ */
/* Option parsing                                                      */
/* ------------------------------------------------------------------ */

function parseOptionsSchema(optionsObj: unknown): OptionSchema[] {
	if (!isObject(optionsObj)) return [];

	return Object.entries(optionsObj)
		.map(([key, raw]) => {
			const o = isObject(raw) ? raw : {};
			const hasType = typeof o.type === 'string';
			return {
				key,
				kind: hasType ? 'value' : 'boolean',
				type: hasType ? (o.type as string) : 'boolean',
				description: typeof o.description === 'string' ? o.description : '',
				shortcut: typeof o.shortcut === 'string' ? o.shortcut : '',
				default: o.default,
				allowed:
					Array.isArray(o.options) ?
						o.options.filter((x): x is string => typeof x === 'string')
					:	null,
				allowAll: o.allowAll === true,
			};
		})
		.sort((a, b) => a.key.localeCompare(b.key));
}

/* ------------------------------------------------------------------ */
/* Main                                                               */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
	if (!(await exists(ROOT_PKG_JSON))) {
		throw new Error(`Missing: ${ROOT_PKG_JSON}`);
	}

	await ensureParentDir(OUTPUT_PATH);

	const rootPkg = await readJson<any>(ROOT_PKG_JSON);
	const workspacePatterns = normalizeWorkspacePatterns(rootPkg.workspaces);

	const monoConfig = await readMonoConfig();
	const monoCommands = await readMonoCommands();
	const pkgDirs = await findWorkspacePackageDirs(REPO_ROOT, workspacePatterns);

	const packages: PackageInfo[] = await Promise.all(
		pkgDirs.map(async (dir) => {
			const pj = await readJson<any>(path.join(dir, 'package.json'));
			return {
				name:
					pj.name ||
					toPosix(path.relative(REPO_ROOT, dir)) ||
					path.basename(dir),
				dir,
				scripts: pj.scripts ?? {},
			};
		})
	);

	const parts: string[] = [];
	parts.push(`# Mono Command-Line Reference

> Generated by \`scripts/generate-readme.mjs\`.
> Update \`.mono/config.json\`, \`.mono/*.json\`, and workspace package scripts to change this output.

`);

	// existing renderers unchanged
	// ...
	// (your formatMonoConfigSection / formatMonoCommandsSection calls here)

	const docsIndex = await generateDocsIndex({
		docsDir: path.join(REPO_ROOT, 'docs'),
		excludeFile: 'command-line.md',
	});

	parts.push(docsIndex);

	await fs.writeFile(OUTPUT_README, parts.join('\n'), 'utf8');

	console.log(`Generated: ${OUTPUT_README}`);
	console.log(`- mono config: ${monoConfig ? 'yes' : 'no'}`);
	console.log(`- mono commands: ${monoCommands.length}`);
	console.log(`- workspace packages: ${packages.length}`);
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
