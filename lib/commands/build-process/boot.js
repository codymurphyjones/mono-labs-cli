// Boot logic: load root + haste configuration
import {
	getHasteConfig,
	getRootDirectory,
	getRootJson,
} from '../loadFromRoot.js';

export function boot() {
	const rootDir = getRootDirectory();
	const rootJson = getRootJson();
	const { files, config } = getHasteConfig();
	return { rootDir, rootJson, files, config };
}

export default boot;
