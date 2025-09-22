// Main entry point for @mono-labs/cli package
export { boot } from './lib/commands/build-process/boot.js';
export { buildCommands } from './lib/commands/build-process/cliFactory.js';
export { runHasteCommand } from './lib/commands/build-process/runHasteCommand.js';
export { verifyOptionValue } from './lib/commands/build-process/validators.js';
export {
	setData,
	getData,
	mergeData,
	replaceTokens,
} from './lib/commands/build-process/dataLayer.js';
export {
	getHasteConfig,
	getRootDirectory,
	getRootJson,
} from './lib/commands/loadFromRoot.js';
import { generateNewEnvList } from './lib/generateNewEnvList.js';

// Default export for convenience
export default {
	generateNewEnvList,
	boot,
	buildCommands,
	runHasteCommand,
	verifyOptionValue,
	setData,
	getData,
	mergeData,
	replaceTokens,
	getHasteConfig,
	getRootDirectory,
	getRootJson,
	program,
};
