import { execSync } from 'child_process';
import { getRootJson } from '../loadFromRoot.js';

//Run Action List before all script actions

const WorkSpaceDirectory = '${dir}';

export function executeCommandsIfWorkspaceAction(action, commands = []) {
	console.log('we here');
	const result = execSync('yarn workspaces list --json', { encoding: 'utf8' })
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line))
		.filter((obj) => obj !== '.');

	const workspaces = result.map((w) => w.name);
	const actualAction = action[1] || '';

	console.log('workspaces', workspaces);
	console.log('action', action);
	console.log('actualAction', actualAction);

	const rootJson = getRootJson();
	const workspacesList = (rootJson.workspaces || []).map((item) =>
		item.replace(/[\.\/\*]/g, '')
	);

	console.log('workspacesList', workspacesList);

	const filteredResult =
		result.filter((obj) => obj.name === actualAction)[0] || {};
	console.log('filteredResult', filteredResult);
	const workingDirectory = filteredResult.location || '';
	// Check if the action is a workspace action
	if (action) {
		// Execute each command in the context of the workspace
		commands.forEach((cmd) => {
			const finalCommand = cmd.replace(WorkSpaceDirectory, workingDirectory);
			console.log(`Executing command in workspace: ${finalCommand}`);
			// Here you would add the logic to execute the command
			execSync(finalCommand, { stdio: 'inherit', shell: true });
		});
	}
}
