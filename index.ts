// Main entry point for @mono-labs/cli package
import { generateNewEnvList } from './lib/generateNewEnvList.js';
import {
	filterUnwantedEnvVars,
	filterUnwantedEnvVarsEAS,
} from './lib/filterUnwantedEnvVars.js';
import { replaceTokens } from './lib/commands/build-process/dataLayer.js';
// Default export for convenience
export default {
	replaceTokens,
	generateNewEnvList,
	filterUnwantedEnvVars,
	filterUnwantedEnvVarsEAS,
};

export {
	replaceTokens,
	generateNewEnvList,
	filterUnwantedEnvVars,
	filterUnwantedEnvVarsEAS,
};
