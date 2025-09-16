import { execSync } from 'child_process';
import { getRootJson, getHasteConfig } from '../loadFromRoot.js';

//Run Action List before all script actions

const WorkSpaceDirectory = '${dir}';

export function executeCommandsIfWorkspaceAction(action, commands = []) {
	const { config } = getHasteConfig();
	const workspacemap = config.workspace?.packageMaps || {};
	console.log('we here');
	console.log('we here');
	const result = execSync('yarn workspaces list --json', { encoding: 'utf8' })
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line))
		.filter((obj) => obj !== '.');

	const workspaces = result.map((w) => w.name);
	console.log('workspacemap', workspacemap);
	const workspaceMapAction =
		workspacemap ? workspacemap[action[1]] || action[1] : action[1];
	console.log('workspacemap', workspacemap !== undefined);
	console.log('workspacemap:key', workspacemap[action[1]]);
	console.log('workspaceMapAction', workspaceMapAction);
	const actualAction = workspacemap ? workspacemap[action[1]] || '' : action[1];
	console.log('actualAction', actualAction);
	console.log('workspaces', workspaces);
	console.log('action', action);

	const rootJson = getRootJson();
	const workspacesList = (rootJson.workspaces || []).map((item) =>
		item.replace(/[\.\/\*]/g, '')
	);

	console.log('workspacesList', workspacesList);

	const actualAction2 = actualAction;

	console.log('unfiltered result', result);
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
