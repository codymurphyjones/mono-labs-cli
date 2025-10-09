import { runForeground } from './runners/runForeground.js';
import { runBackground } from './runners/runBackground.js';
import { killAllBackground } from './runners/processManager.js';
import { getHasteConfig } from '../loadFromRoot.js';
import { parseEnvFile } from './readEnv.js';
import path from 'node:path';

/**
 * Orchestrate execution of a single haste command definition.
 * Phases:
 *  1. Preactions (sequential, blocking) via runForeground
 *  2. Actions (background except last; last attached) via runBackground
 * Environment selection based on --stage flag and injection of AWS_PROFILE.
 */
export async function runHasteCommand(configObject, options = {}) {
	const { config } = getHasteConfig();
	
	const devConfig = configObject.environments?.dev ?? {};

	// Usage:
	const envPath = path.resolve(process.cwd(), '.env');
	const keymap = parseEnvFile(envPath);

	const prodConfig = configObject.environments?.prod ?? {};
	const awsProfile = process.env.CDK_DEPLOY_PROFILE || 'default';
	const envObjBase = options.prod ? { ...prodConfig } : { ...devConfig };

	Object.keys(envObjBase).forEach((k) => {
		if (
			typeof envObjBase[k] === 'string' &&
			envObjBase[k].startsWith('$') &&
			!envObjBase[k].startsWith('${')
		) {
			const refKey = envObjBase[k].substring(1);
			envObjBase[k] = keymap[refKey] || '';
		}
	});
	envObjBase.AWS_PROFILE = awsProfile;

	const envKeys = Object.keys(process.env).filter((k) => k.startsWith('MONO_'));
	const envMapList = config.envMap ?? ['FAILURE'];
	const combinedEnv = { ...process.env, ...envObjBase };
	let envMapVals = {};

	envKeys.map((k) => {
		envMapList.map((item) => {
			envMapVals[k.replace('MONO', item)] = combinedEnv[k];
		});
	});

	const envObj = { ...envObjBase, ...envMapVals };

	const preactions = configObject.preactions ?? [];
	const actions = configObject.actions ?? [];

	

	
		`→ Executing haste command: ${configObject.name || 'Unnamed Command'}`
	);
	
	
	

	// Run preactions sequentially
	for (const cmd of preactions) {
		
		await runForeground(cmd, envObj, options);
	}

	if (actions.length === 0) return;

	const bg = actions.slice(0, -1);
	const fg = actions[actions.length - 1];

	for (const cmd of bg) {
		
		runBackground(cmd, envObj, options);
	}

	
	try {
		await runBackground(fg, envObj, options, true);
	} finally {
		killAllBackground();
	}
}

export default runHasteCommand;
