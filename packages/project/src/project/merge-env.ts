import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export function loadMergedEnv(): NodeJS.ProcessEnv {
	const ENV_PATH = path.resolve(process.cwd(), '.env');
	const ENV_LOCAL_PATH = path.resolve(process.cwd(), '.env.local');

	// Load base .env
	const base =
		fs.existsSync(ENV_PATH) ? dotenv.parse(fs.readFileSync(ENV_PATH)) : {};

	// Load overrides .env.local
	const local =
		fs.existsSync(ENV_LOCAL_PATH) ?
			dotenv.parse(fs.readFileSync(ENV_LOCAL_PATH))
		:	{};

	// Merge: local overrides base
	const merged = {
		...base,
		...local,
	};

	// Inject into process.env (do NOT overwrite existing real env vars)
	for (const [key, value] of Object.entries(merged)) {
		if (process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
	return process.env;
}
