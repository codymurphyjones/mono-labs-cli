import { getHasteConfig } from './commands/loadFromRoot.js';
export function generateNewEnvList(processEnv) {
	const { config } = getHasteConfig();

	const envMapList = config.envMap ?? ['FAILURE'];
	const envKeys = Object.keys(processEnv).filter((k) => k.startsWith('MONO_'));
	let envObj = {};
	for (const key of envKeys) {
		const mappedKey = envMapList[key] || key;
		envObj[mappedKey] = processEnv[key];
	}
	return { ...processEnv, ...envObj };
}
