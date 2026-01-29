import fs from 'node:fs';
import path from 'node:path';

/* ──────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────── */

type WorkspaceDetectResult = {
	cwd: string;
	workspaceRoot: string | null;
	isWorkspaceRoot: boolean;
	configDir: string;
	configPath: string;
};

type DefaultAppConfig = {
	appleAppId?: string;
	androidAppId?: string;
	appName?: string;
	easProjectId?: string;
	appScheme?: string;
	warehouseRegion?: string;
};

type DefaultDeployConfig = {
	baseDomain?: string;
	webSubdomain?: string;
	apiSubdomain?: string;
	defaultKeyPair?: string;
	regions: string[];
	ec2User: string;
	defaultVpcId?: string;
	defaultVpcSecurityGroupId?: string;
	ec2Bridge?: string;
};

const requiredSystemDefaults = {
	ec2User: 'ec2-user',
	regions: ['us-east-1'],
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

/* ──────────────────────────────────────────────────────────
 * Environment helpers
 * ────────────────────────────────────────────────────────── */

function isLambdaRuntime(): boolean {
	return !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

/* ──────────────────────────────────────────────────────────
 * Workspace detection (CLI / local dev only)
 * ────────────────────────────────────────────────────────── */

function detectWorkspaceAndConfigPath(
	startDir: string,
	configFileName: string
): WorkspaceDetectResult {
	const cwd = path.resolve(startDir);

	const isWorkspaceRootDir = (dir: string): boolean => {
		const pkgPath = path.join(dir, 'package.json');
		if (fs.existsSync(pkgPath)) {
			try {
				const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
				if (pkg?.workspaces) return true;
			} catch {
				// ignore
			}
		}

		const markers = [
			'pnpm-workspace.yaml',
			'lerna.json',
			'turbo.json',
			'nx.json',
			'.git',
		];

		return markers.some((m) => fs.existsSync(path.join(dir, m)));
	};

	let dir = cwd;
	while (true) {
		if (isWorkspaceRootDir(dir)) {
			return {
				cwd,
				workspaceRoot: dir,
				isWorkspaceRoot: dir === cwd,
				configDir: dir,
				configPath: path.join(dir, configFileName),
			};
		}

		const parent = path.dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}

	return {
		cwd,
		workspaceRoot: null,
		isWorkspaceRoot: false,
		configDir: cwd,
		configPath: path.join(cwd, configFileName),
	};
}

/* ──────────────────────────────────────────────────────────
 * Bundled config loader (Lambda runtime)
 * ────────────────────────────────────────────────────────── */

function loadConfigFromBundle(fileName: string): unknown | null {
	const bundledPath = path.join(__dirname, fileName);

	if (fs.existsSync(bundledPath)) {
		return JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
	}

	return null;
}

/* ──────────────────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────────────────── */

export function loadAppConfig<TCustom = unknown, TType extends string = 'app'>(
	configType: TType = 'app' as TType,
	startDir: string = process.cwd()
): { config: ResolveConfig<TType, TCustom>; meta: WorkspaceDetectResult } {
	const fileName = `mono.${configType}.json`;

	// ✅ 1. Lambda runtime: load bundled config if present
	if (isLambdaRuntime()) {
		const bundled = loadConfigFromBundle(fileName);

		if (bundled) {
			return {
				config: bundled as ResolveConfig<TType, TCustom>,
				meta: {
					cwd: __dirname,
					workspaceRoot: null,
					isWorkspaceRoot: false,
					configDir: __dirname,
					configPath: path.join(__dirname, fileName),
				},
			};
		}
	}

	// ✅ 2. CLI / local dev: workspace discovery
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
	const config = JSON.parse(raw) as ResolveConfig<TType, TCustom>;

	// ✅ Apply required system defaults
	if (typeof config === 'object' && config !== null) {
		for (const key of Object.keys(requiredSystemDefaults)) {
			// @ts-ignore: index signature
			if (config[key] === undefined || config[key] === null) {
				// @ts-ignore: index signature
				config[key] = requiredSystemDefaults[key];
			}
		}
	}

	return { config, meta };
}

export const loadProjectConfig = loadAppConfig;

export { loadMergedEnv } from './merge-env.js';
