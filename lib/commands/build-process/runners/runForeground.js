import { spawn } from 'child_process';
import { replaceTokens, setData } from '../dataLayer.js';

// Regex to capture tokens like: {out:field value}
const TOKEN_RX = /\{out:(?<field>[^\s}]+)\s+(?<value>[^\s}]+)\}/g;

/**
 * Run a command in the foreground, capturing stdout/stderr. Extracts token patterns
 * of the form {out:field value} and stores them in the shared dataLayer.
 */
export function runForeground(cmd, envObj = {}, options = {}) {
	console.log('optionsForeground:', options);
	const newCmd = replaceTokens(cmd);
	console.log('outCmd:', newCmd);
	return new Promise((resolve, reject) => {
		let lastLine = '';
		let buffer = '';

		const child = spawn(cmd, {
			shell: true,
			env: { ...process.env, ...envObj },
			stdio: ['inherit', 'pipe', 'pipe'],
		});

		const handleData = (chunk) => {
			const text = chunk.toString();
			buffer += text;
			const lines = text.trim().split(/\r?\n/);
			if (lines.length) lastLine = lines[lines.length - 1];
			process.stdout.write(text); // echo output
		};

		child.stdout.on('data', handleData);
		child.stderr.on('data', handleData);
		child.on('error', reject);

		child.on('exit', (code, signal) => {
			// Extract tokens and populate dataLayer
			for (const match of buffer.matchAll(TOKEN_RX)) {
				setData(match.groups.field, match.groups.value);
			}

			if (signal)
				return reject(new Error(`${cmd} exited via signal ${signal}`));
			if (code === 0) return resolve(lastLine);
			reject(
				new Error(`${cmd} exited with code ${code}. Last line: ${lastLine}`)
			);
		});
	});
}

export default runForeground;
