import { execSync } from 'child_process';

//Run Action List before all script actions

export function executeCommandsIfWorkspaceAction(commands = [], action) {
	console.log('we here');
	const result = execSync('yarn workspaces list --json', { encoding: 'utf8' })
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));

	console.log(result.map((w) => w.location)); // list of workspace paths
	// Check if the action is a workspace action
	if (action && action.type === 'workspace') {
		// Execute each command in the context of the workspace
		commands.forEach((cmd) => {
			console.log(`Executing command in workspace: ${cmd}`);
			// Here you would add the logic to execute the command
			execSync(cmd, { stdio: 'inherit', shell: true });
		});
	}
}
