import 'dotenv/config';
import spawn from 'cross-spawn';

import { program } from './app.js';
import './commands/build/index.js';
import './commands/deploy/index.js';
import './commands/destroy.js';
import './commands/dev/index.js';
import './commands/generate/index.js';
import './commands/init/index.js';
import './commands/prune/index.js';
import './commands/seed/index.js';
import './commands/submit/index.js';
import './commands/update/index.js';
import './commands/build-process/index.js';
import { getHasteConfig } from './commands/loadFromRoot.js';

const { config } = getHasteConfig();

const workspacemap = config.workspace || {};

program.on('command:*', (operands) => {
	const [cmd] = operands; // e.g. "destroy3"
	const raw = program.rawArgs.slice(2); // after `node script.js`
	const i = raw.indexOf(cmd);
	const tokens = i >= 0 ? raw.slice(i) : operands;

	const workspace = workspacemap[tokens[0]] || tokens[0];
	let rest = tokens.slice(1);
	console.log('Workspace:', workspace);
	console.log('Rest:', rest);

	// If the “rest” is empty or starts with flags, insert a default script
	if (rest.length === 0 || rest[0].startsWith('--')) {
		console.log('Rest is empty or starts with flags, inserting DEFAULT_SCRIPT');
		// Prefer an explicit script name; if you want to always use `run`, do:
		// rest = ['run', DEFAULT_SCRIPT, ...rest];
		rest = [...rest]; // yarn workspace <ws> dev --flags
		console.log('Rest after inserting DEFAULT_SCRIPT:', rest);
	}

	const args = ['workspace', workspace, ...rest];
	console.log('Final args for yarn:', args);

	console.error(`Unknown command. Falling back to: yarn ${args.join(' ')}`);

	const child = spawn('yarn', args, {
		stdio: 'inherit',
		shell: process.platform === 'win32',
	});
	child.on('exit', (code) => {
		console.log('Child process exited with code:', code);
		process.exitCode = code ?? 1;
	});
});
program.parse();
