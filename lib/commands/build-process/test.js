import { execSync } from 'child_process';
import { getRootJson } from '../loadFromRoot.js';

//Run Action List before all script actions

export function executeCommandsIfWorkspaceAction(commands = [], action) {
	console.log('we here');
	const result = execSync('yarn workspaces list --json', { encoding: 'utf8' })
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line))
		.filter((obj) => obj !== '.');

	console.log(result.map((w) => w.location)); // list of workspace paths
	const rootJson = getRootJson();
	const workspacesList = (rootJson.workspaces || []).map((item) =>
		item.replace(/[\.\/\*]/g, '')
	);

	console.log('workspacesList', workspacesList);
	// Check if the action is a workspace action
	if (action) {
		// Execute each command in the context of the workspace
		commands.forEach((cmd) => {
			console.log(`Executing command in workspace: ${cmd}`);
			// Here you would add the logic to execute the command
			execSync(cmd, { stdio: 'inherit', shell: true });
		});
	}
}
