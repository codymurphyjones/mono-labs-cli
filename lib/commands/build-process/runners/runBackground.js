import { spawn } from 'child_process';
import { getData, replaceTokens } from '../dataLayer.js';
import { registerBackground } from './processManager.js';

export function runBackground(
	cmd,
	envObj = {},
	options = {},
	attached = false
) {
	const isWin = process.platform === 'win32';

	// Replace ${field} tokens in env values using dataLayer
	const expandedEnv = {};
	for (const k of Object.keys(envObj)) {
		const v = envObj[k];
		expandedEnv[k] = typeof v === 'string' ? replaceTokens(v) : v;
	}

	// Replace in command string
	const outCmd = replaceTokens(cmd);

	return new Promise((resolve, reject) => {
		const child = spawn(outCmd, {
			shell: true,
			stdio: attached ? 'inherit' : 'ignore',
			env: { ...process.env, ...expandedEnv },
			detached: !attached && !isWin,
			windowsHide: !attached && isWin,
		});

		if (!attached && !isWin) child.unref();

		registerBackground(child);

		child.once('error', (err) => {
			reject(err);
		});

		child.once('exit', (code, signal) => {
			if (signal)
				return reject(new Error(`${cmd} exited via signal ${signal}`));
			if (code === 0) return resolve();
			reject(new Error(`${cmd} exited with code ${code}`));
		});
	});
}

export default runBackground;
