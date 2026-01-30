import { getMonoConfig } from './commands/loadFromRoot.js';
export function generateNewEnvList(processEnv) {
	const { config } = getMonoConfig();

	const envMapList = config.envMap ?? ['FAILURE'];
	const envKeys = Object.keys(processEnv).filter((k) => k.startsWith('MONO_'));
	let envObj = {};
	for (const key of envKeys) {
		if (key.includes('SECRET')) continue; // Skip keys that include
		const mappedKey = envMapList[key] || key;
		envObj[mappedKey] = processEnv[key];
	}
	return { ...processEnv, ...envObj };
}
