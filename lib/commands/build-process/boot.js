// Boot logic: load root + mono configuration
import {
	getMonoConfig,
	getRootDirectory,
	getRootJson,
} from '../loadFromRoot.js';

export function boot() {
	const rootDir = getRootDirectory();
	const rootJson = getRootJson();
	const { files, config } = getMonoConfig();
	return { rootDir, rootJson, files, config };
}

export default boot;
