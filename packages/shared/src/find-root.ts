import fs from 'fs'
import path from 'path'

export interface WorkspaceRootResult {
	root: string
	isWorkspace: boolean
}

/**
 * Walk up from startDir until we find a directory containing package.json.
 * Returns the first match or falls back to startDir.
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
	let current = path.resolve(startDir)

	while (true) {
		const pkg = path.join(current, 'package.json')
		if (fs.existsSync(pkg)) return current

		const parent = path.dirname(current)
		if (parent === current) break

		current = parent
	}

	return path.resolve(startDir)
}

/**
 * Walk up from startDir checking for monorepo/workspace markers:
 * - package.json with "workspaces" field (yarn/npm workspaces)
 * - pnpm-workspace.yaml
 * - lerna.json, turbo.json, nx.json
 * - .git directory (fallback)
 *
 * Returns { root, isWorkspace }.
 */
export function findWorkspaceRoot(startDir: string = process.cwd()): WorkspaceRootResult {
	let dir = path.resolve(startDir)

	while (true) {
		// Check for package.json with workspaces field
		const pkgPath = path.join(dir, 'package.json')
		if (fs.existsSync(pkgPath)) {
			try {
				const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
				if (pkg?.workspaces) {
					return { root: dir, isWorkspace: true }
				}
			} catch {
				// ignore malformed package.json
			}
		}

		// Check for other monorepo markers
		const markers = ['pnpm-workspace.yaml', 'lerna.json', 'turbo.json', 'nx.json']
		if (markers.some((m) => fs.existsSync(path.join(dir, m)))) {
			return { root: dir, isWorkspace: true }
		}

		// .git as fallback boundary
		if (fs.existsSync(path.join(dir, '.git'))) {
			return { root: dir, isWorkspace: false }
		}

		const parent = path.dirname(dir)
		if (parent === dir) break
		dir = parent
	}

	return { root: path.resolve(startDir), isWorkspace: false }
}
