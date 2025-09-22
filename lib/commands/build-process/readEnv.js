// scripts/read-env.mjs
import fs from 'node:fs';

export function parseEnvFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return {};
	}

	const content = fs.readFileSync(filePath, 'utf8');

	const keymap = {};
	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();

		// skip empty lines and comments
		if (!trimmed || trimmed.startsWith('#')) continue;

		// split on first "=" only
		const idx = trimmed.indexOf('=');
		if (idx === -1) continue;

		const key = trimmed.slice(0, idx).trim();
		let value = trimmed.slice(idx + 1).trim();

		// strip surrounding quotes if present
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		keymap[key] = value;
	}

	return keymap;
}
