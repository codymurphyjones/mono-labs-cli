import fs from 'node:fs';
import path from 'node:path';

type WorkspaceDetectResult = {
	cwd: string;
	workspaceRoot: string | null;
	isWorkspaceRoot: boolean;
	configDir: string;
	configPath: string;
};

/**
 * Finds the workspace root by walking up from `startDir`.
 * Works for Yarn/npm workspaces via package.json "workspaces".
 * Also recognizes common mono-repo markers as fallback.
 */
export function detectWorkspaceAndConfigPath(
	startDir: string = process.cwd(),
	configFileName: string = 'app.config.json'
): WorkspaceDetectResult {
	const cwd = path.resolve(startDir);

	const isWorkspaceRootDir = (dir: string): boolean => {
		// 1) package.json workspaces
		const pkgPath = path.join(dir, 'package.json');
		if (fs.existsSync(pkgPath)) {
			try {
				const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as any;
				if (pkg?.workspaces) return true;
			} catch {
				// ignore
			}
		}

		// 2) other common monorepo root markers (fallback)
		const markers = [
			'pnpm-workspace.yaml',
			'lerna.json',
			'turbo.json',
			'nx.json',
			'.git', // good enough for many repos
		];
		return markers.some((m) => fs.existsSync(path.join(dir, m)));
	};

	const findUp = (
		from: string,
		predicate: (dir: string) => boolean
	): string | null => {
		let dir = path.resolve(from);
		while (true) {
			if (predicate(dir)) return dir;
			const parent = path.dirname(dir);
			if (parent === dir) return null; // reached filesystem root
			dir = parent;
		}
	};

	const workspaceRoot = findUp(cwd, isWorkspaceRootDir);
	const isWorkspaceRoot = workspaceRoot !== null && workspaceRoot === cwd;

	// If we are inside a workspace package, config lives at root.
	// If we're already at root, config lives in cwd (same thing).
	const configDir = workspaceRoot ?? cwd;
	const configPath = path.join(configDir, configFileName);

	return { cwd, workspaceRoot, isWorkspaceRoot, configDir, configPath };
}

type DefaultAppConfig = {
	appleAppId?: string;
	androidAppId?: string;
	appName?: string;
	easProjectId?: string;
	appScheme?: string;
	regions?: string[];
};

type DefaultDeployConfig = {
	baseDomain?: string;
	webSubdomain?: string;
	apiSubdomain?: string;
	regions?: string[];
};

type ConfigTypeMap = {
	app: DefaultAppConfig;
	deployment: DefaultDeployConfig;
};

/**
 * If TType is a known key, use the mapped type.
 * Otherwise use TCustom (default = unknown).
 */
type ResolveConfig<TType extends string, TCustom = unknown> =
	TType extends keyof ConfigTypeMap ? ConfigTypeMap[TType] : TCustom;

export function loadAppConfig<TCustom = unknown, TType extends string = string>(
	configType: TType,
	startDir: string = process.cwd()
): { config: ResolveConfig<TType, TCustom>; meta: WorkspaceDetectResult } {
	const fileName = `${configType}.config.json`;
	const meta = detectWorkspaceAndConfigPath(startDir, fileName);

	if (!fs.existsSync(meta.configPath)) {
		const where =
			meta.workspaceRoot ?
				`workspace root: ${meta.workspaceRoot}`
			:	`cwd: ${meta.cwd}`;
		throw new Error(
			`Could not find ${fileName} at ${meta.configPath} (detected from ${where}).`
		);
	}

	const raw = fs.readFileSync(meta.configPath, 'utf8');
	return { config: JSON.parse(raw) as ResolveConfig<TType, TCustom>, meta };
}

export const loadProjectConfig = loadAppConfig;
