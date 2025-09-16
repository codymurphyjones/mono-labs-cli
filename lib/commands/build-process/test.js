import { execSync } from 'child_process';

//Run Action List before all script actions

const result = execSync('yarn workspaces list --json', { encoding: 'utf8' })
	.trim()
	.split('\n')
	.map((line) => JSON.parse(line));

console.log(result.map((w) => w.location)); // list of workspace paths

function executeCommandsIfWorkspaceAction(commands = [], action) {}
