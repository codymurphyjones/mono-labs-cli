import { runForeground } from './runners/runForeground.js';
import { runBackground } from './runners/runBackground.js';
import { killAllBackground } from './runners/processManager.js';

/**
 * Orchestrate execution of a single haste command definition.
 * Phases:
 *  1. Preactions (sequential, blocking) via runForeground
 *  2. Actions (background except last; last attached) via runBackground
 * Environment selection based on --stage flag and injection of AWS_PROFILE.
 */
export async function runHasteCommand(configObject, options = {}) {
	console.log('runHasteCommand options:', options);
	const devConfig = configObject.environments?.dev ?? {};
	const stageConfig = configObject.environments?.stage ?? {};
	const awsProfile = process.env.CDK_DEPLOY_PROFILE || 'default';
	const envObj = options.stage ? { ...stageConfig } : { ...devConfig };
	envObj.AWS_PROFILE = awsProfile;

	const preactions = configObject.preactions ?? [];
	const actions = configObject.actions ?? [];

	console.log(
		`→ Executing haste command: ${configObject.name || 'Unnamed Command'}`
	);
	console.log(`→ Using AWS profile: ${awsProfile}`);
	console.log(`→ Using environment: ${options.stage ? 'stage' : 'dev'}`);
	console.log('→ Environment variables:', envObj);

	// Run preactions sequentially
	for (const cmd of preactions) {
		console.log(`→ preaction: ${cmd}`);
		await runForeground(cmd, envObj, options);
	}

	if (actions.length === 0) return;

	const bg = actions.slice(0, -1);
	const fg = actions[actions.length - 1];

	for (const cmd of bg) {
		console.log(`→ background action: ${cmd}`);
		runBackground(cmd, envObj, options);
	}

	console.log(`→ foreground action (attached): ${fg}`);
	try {
		await runBackground(fg, envObj, options, true);
	} finally {
		killAllBackground();
	}
}

export default runHasteCommand;
