import { execSync } from 'child_process';
import { getRootJson, getMonoConfig } from '../loadFromRoot.js';

//Run Action List before all script actions

const WorkSpaceDirectory = '${dir}';

export function executeCommandsIfWorkspaceAction(
	action,
	commands = [],
	fullEnv
) {
	const { config } = getMonoConfig();
	const workspacemap = config.workspace?.packageMaps || {};

	const result = execSync('yarn workspaces list --json', { encoding: 'utf8' })
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line))
		.filter((obj) => obj !== '.');

	const workspaces = result.map((w) => w.name);

	const actualAction =
		workspacemap ? workspacemap[action[1]] || action[1] : action[1];

	const rootJson = getRootJson();
	const workspacesList = (rootJson.workspaces || []).map((item) =>
		item.replace(/[\.\/\*]/g, '')
	);

	const filteredResult =
		result.filter((obj) => obj.name === actualAction)[0] || {};

	const workingDirectory = filteredResult.location || '';
	// Check if the action is a workspace action
	if (action) {
		// Execute each command in the context of the workspace
		commands.forEach((cmd) => {
			const finalCommand = cmd.replace(WorkSpaceDirectory, workingDirectory);

			// Here you would add the logic to execute the command
			execSync(finalCommand, {
				stdio: 'inherit',
				shell: true,
				env: { ...fullEnv },
			});
		});
	}
}
