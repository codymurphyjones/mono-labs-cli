// scripts/generate-repo-help.mjs
// Generates a developer-friendly workspace command reference.
//
// Output: docs/workspaces.md
//
// Run (from repo root):
//   node ./scripts/generate-repo-help.mjs
//
// Philosophy:
// - Optimize for onboarding and day-to-day use
// - Keep raw yarn workspace commands for reference
// - Emphasize `yarn mono` as the primary interface

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { generateDocsIndex } from './generate-docs.js';

interface PackageInfo {
	name: string;
	dir: string;
	scripts: Record<string, string>;
}

// ----------------- config -----------------
// Always use the working directory as the root for all file actions
const REPO_ROOT = path.resolve(process.cwd());
const ROOT_PKG_JSON = path.join(REPO_ROOT, 'package.json');
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs', 'workspaces.md');

// ----------------- helpers -----------------
async function exists(p: string): Promise<boolean> {
	// Always resolve path relative to working directory
	const absPath = path.resolve(process.cwd(), p);
	try {
		await fs.access(absPath);
		return true;
	} catch {
		return false;
	}
}

function isObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function toPosix(p: string): string {
	return p.split(path.sep).join('/');
}

function mdEscapeInline(s: string): string {
	return String(s ?? '').replaceAll('`', '\`');
}

function slugifyForGithubAnchor(title: string): string {
	return String(title ?? '')
		.trim()
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-');
}

async function readJson<T = any>(filePath: string): Promise<T> {
	// Always resolve filePath relative to working directory
	const absPath = path.resolve(process.cwd(), filePath);
	const raw = await fs.readFile(absPath, 'utf8');
	return JSON.parse(raw);
}

function normalizeWorkspacePatterns(workspacesField: unknown): string[] {
	if (Array.isArray(workspacesField)) return workspacesField as string[];
	if (
		isObject(workspacesField) &&
		Array.isArray((workspacesField as any).packages)
	)
		return (workspacesField as any).packages;
	return [];
}

// ----------------- glob expansion -----------------
function matchSegment(patternSeg: string, name: string): boolean {
	if (patternSeg === '*') return true;
	if (!patternSeg.includes('*')) return patternSeg === name;

	const escaped = patternSeg.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp('^' + escaped.replaceAll('*', '.*') + '$');
	return regex.test(name);
}

async function expandWorkspacePattern(
	root: string,
	pattern: string
): Promise<string[]> {
	const segs = toPosix(pattern).split('/').filter(Boolean);

	async function expandFrom(dir: string, segIndex: number): Promise<string[]> {
		// Always resolve dir relative to working directory
		const absDir = path.resolve(process.cwd(), dir);
		if (segIndex >= segs.length) return [absDir];

		const seg = segs[segIndex];

		if (seg === '**') {
			const results: string[] = [];
			results.push(...(await expandFrom(absDir, segIndex + 1)));

			const entries = await fs
				.readdir(absDir, { withFileTypes: true })
				.catch(() => []);
			for (const e of entries) {
				if (e.isDirectory()) {
					results.push(
						...(await expandFrom(path.join(absDir, e.name), segIndex))
					);
				}
			}
			return results;
		}

		const entries = await fs
			.readdir(absDir, { withFileTypes: true })
			.catch(() => []);
		const results: string[] = [];
		for (const e of entries) {
			if (e.isDirectory() && matchSegment(seg, e.name)) {
				results.push(
					...(await expandFrom(path.join(absDir, e.name), segIndex + 1))
				);
			}
		}
		return results;
	}

	return [...new Set(await expandFrom(root, 0))];
}

async function findWorkspaceRoots(
	repoRoot: string,
	workspacePatterns: string[]
): Promise<string[]> {
	const roots: string[] = [];
	for (const pat of workspacePatterns) {
		const expandedDirs = await expandWorkspacePattern(repoRoot, pat);
		roots.push(...expandedDirs);
	}
	return [...new Set(roots)];
}

// ----------------- package discovery -----------------
const SKIP_DIRS = new Set([
	'node_modules',
	'.git',
	'.next',
	'dist',
	'build',
	'out',
	'coverage',
	'.turbo',
]);

async function findPackageJsonFilesRecursive(
	startDir: string
): Promise<string[]> {
	const found: string[] = [];

	async function walk(dir: string): Promise<void> {
		// Always resolve dir relative to working directory
		const absDir = path.resolve(process.cwd(), dir);
		const entries = await fs
			.readdir(absDir, { withFileTypes: true })
			.catch(() => []);
		for (const e of entries) {
			const full = path.join(absDir, e.name);
			if (e.isDirectory()) {
				if (!SKIP_DIRS.has(e.name)) await walk(full);
			} else if (e.isFile() && e.name === 'package.json') {
				found.push(full);
			}
		}
	}

	await walk(startDir);
	return found;
}

async function collectPackagesFromWorkspaceRoots(
	workspaceRoots: string[]
): Promise<PackageInfo[]> {
	const pkgJsonFiles: string[] = [];

	for (const root of workspaceRoots) {
		if (await exists(root)) {
			pkgJsonFiles.push(...(await findPackageJsonFilesRecursive(root)));
		}
	}

	const packages: PackageInfo[] = [];
	for (const file of [...new Set(pkgJsonFiles)]) {
		if (path.resolve(file) === path.resolve(ROOT_PKG_JSON)) continue;

		try {
			const pj = await readJson<any>(file);
			const dir = path.dirname(file);
			packages.push({
				name: pj.name || toPosix(path.relative(REPO_ROOT, dir)),
				dir,
				scripts:
					isObject(pj.scripts) ? (pj.scripts as Record<string, string>) : {},
			});
		} catch {}
	}

	const seen = new Set<string>();
	return packages
		.sort((a, b) => a.name.localeCompare(b.name))
		.filter((p) => (seen.has(p.name) ? false : seen.add(p.name)));
}

// ----------------- classification -----------------
function classifyPackage(pkg: PackageInfo): string {
	const p = toPosix(pkg.dir);
	if (p.startsWith('apps/')) return 'Apps';
	if (p.startsWith('packages/')) return 'Libraries';
	return 'Other';
}
// ----------------- markdown generation -----------------
function formatQuickStart(pkgMgr: string): string[] {
	return [
		'# 🗂️ Workspace Overview',
		'',
		'This document explains how to run and discover commands in this monorepo.',
		'',
		'---',
		'',
		'## 🚀 Quick Start',
		'',
		'Most developers only need the following:',
		'',
		'```bash',
		`${pkgMgr} dev`,
		`${pkgMgr} serve`,
		`${pkgMgr} mobile`,
		`${pkgMgr} help`,
		'```',
		'',
		'Use `yarn mono` whenever possible. It handles environment setup,',
		'workspace routing, and service coordination automatically.',
		'',
		'---',
		'',
	];
}

function formatReferenceIntro(): string[] {
	return [
		'## 📖 Reference',
		'',
		'This section lists all workspace packages and their available scripts.',
		'',
		'Use this when:',
		'- Debugging',
		'- Working on internal libraries',
		'- Running CI or low-level tooling',
		'',
	];
}

function formatIndex(packages: PackageInfo[]): string[] {
	const groups: Record<string, PackageInfo[]> = {};
	for (const p of packages) {
		const g = classifyPackage(p);
		groups[g] ||= [];
		groups[g].push(p);
	}

	const lines: string[] = ['## Workspace Index', ''];
	for (const group of Object.keys(groups)) {
		lines.push(`### ${group}`);
		lines.push('');
		for (const p of groups[group]) {
			lines.push(
				`- [\`${mdEscapeInline(p.name)}\`](#${slugifyForGithubAnchor(p.name)})`
			);
		}
		lines.push('');
	}
	return lines;
}

function formatPackages(packages: PackageInfo[]): string[] {
	const lines: string[] = [];

	for (const p of packages) {
		lines.push(`### ${p.name}`);
		lines.push('');
		lines.push(`_Location: \`${toPosix(path.relative(REPO_ROOT, p.dir))}\`_`);
		lines.push('');

		const scripts = Object.keys(p.scripts).sort();
		if (!scripts.length) {
			lines.push('_No scripts defined._');
			lines.push('');
			continue;
		}

		lines.push('| Script | Recommended |');
		lines.push('|------|-------------|');
		for (const s of scripts) {
			lines.push(`| \`${s}\` | \`yarn mono ${p.name} ${s}\` |`);
		}
		lines.push('');
		lines.push('<details>');
		lines.push('<summary>Raw yarn workspace commands</summary>');
		lines.push('');
		for (const s of scripts) {
			lines.push(`- \`yarn workspace ${p.name} ${s}\``);
		}
		lines.push('</details>');
		lines.push('');
	}

	return lines;
}

async function ensureParentDir(filePath: string): Promise<void> {
	// Always resolve parent dir relative to working directory
	const dir = path.resolve(process.cwd(), path.dirname(filePath));
	await fs.mkdir(dir, { recursive: true });
}

// ----------------- main -----------------
async function main(): Promise<void> {
	// Always resolve all paths relative to working directory
	if (!(await exists(ROOT_PKG_JSON))) {
		throw new Error('Root package.json not found');
	}

	const rootPkg = await readJson<any>(ROOT_PKG_JSON);
	const workspacePatterns = normalizeWorkspacePatterns(rootPkg.workspaces);

	const pkgMgr = `${(rootPkg.packageManager || 'yarn').split('@')[0]} mono`;

	const workspaceRoots = await findWorkspaceRoots(REPO_ROOT, workspacePatterns);
	const fallbackRoots = ['packages', 'apps'].map((p) =>
		path.join(REPO_ROOT, p)
	);
	const roots = workspaceRoots.length ? workspaceRoots : fallbackRoots;

	const packages = await collectPackagesFromWorkspaceRoots(roots);

	const lines: string[] = [];
	lines.push(...formatQuickStart(pkgMgr));
	lines.push(...formatReferenceIntro());
	lines.push(...formatIndex(packages));
	lines.push('## Packages');
	lines.push('');
	lines.push(...formatPackages(packages));

	const val = await generateDocsIndex({
		docsDir: path.join(REPO_ROOT, 'docs'),
		excludeFile: 'workspaces.md',
	});

	val.split('\n').forEach((line) => lines.push(line));

	await ensureParentDir(OUTPUT_PATH);
	await fs.writeFile(OUTPUT_PATH, lines.join('\n'), 'utf8');

	console.log(`✅ Generated ${OUTPUT_PATH}`);
	console.log(`📦 Packages found: ${packages.length}`);
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
