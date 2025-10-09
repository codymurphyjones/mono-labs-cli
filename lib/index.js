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
import { executeCommandsIfWorkspaceAction } from './commands/build-process/test.js';

const { config } = getHasteConfig();

const workspacemap = config.workspace?.packageMaps || {};
const preactions = config.workspace?.preactions || [];
const envMapList = config.envMap ?? ['FAILURE'];

program.on('command:*', (operands) => {
	const [cmd] = operands; // e.g. "destroy3"
	const raw = program.rawArgs.slice(2); // after `node script.js`
	const i = raw.indexOf(cmd);
	const tokens = i >= 0 ? raw.slice(i) : operands;

	const workspace = workspacemap[tokens[0]] || tokens[0];
	let rest = tokens.slice(1);

	const envKeys = Object.keys(process.env).filter((k) => k.startsWith('MONO_'));

	let envObj = {};

	envKeys.map((k) => {
		envMapList.map((item) => {
			envObj[k.replace('MONO', item)] = process.env[k];
		});
	});

	const args = ['workspace', workspace, ...rest];

	console.error(`Unknown command. Falling back to: yarn ${args.join(' ')}`);
	executeCommandsIfWorkspaceAction(args, preactions, envObj);
	const child = spawn('yarn', args, {
		stdio: 'inherit',
		shell: process.platform === 'win32',
		env: { ...process.env, ...envObj },
	});
	child.on('exit', (code) => {
		console.log('Child process exited with code:', code);
		process.exitCode = code ?? 1;
	});
});
program.parse();
