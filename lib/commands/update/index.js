import { spawn } from 'child_process';
import inquirer from 'inquirer';

import { program } from '../../app.js';
import { STAGING_URL } from '../../config.js';
import { getEASBranches } from './eas.js';

const NEXT_PUBLIC_API_URL = STAGING_URL;
const NEXT_FORCE_PROD = true;
const EXPO_BUILD_PROFILE = 'production';

program
	.command('update')
	.description('Prune local branches that are not on origin')
	.option('--auto', 'Auto run')
	.action(async (str) => {
		//

		const { auto } = str;

		if (auto) {
			const fastChild = spawn(`yarn eas update --auto`, {
				stdio: ['inherit', 'pipe', 'pipe'], // Read from terminal, but capture output
				shell: true,
				env: {
					...process.env,
					NEXT_FORCE_PROD,
					NEXT_PUBLIC_API_URL,
					EXPO_BUILD_PROFILE,
				},
			});
			fastChild.stdout.on('data', (data) => {
				process.stdout.write(data); // pipe to main stdout
			});

			fastChild.stderr.on('data', (data) => {
				process.stderr.write(data); // pipe errors
			});
			fastChild.on('message', (data) => {});
			return;
		}

		const branches = getEASBranches().map((branch) => branch.name);

		const { branch } = await inquirer.prompt([
			{
				type: 'list',
				name: 'branch',
				message: 'Select branch to update',
				choices: Object.keys(branches).map((key) => ({
					name: branches[key],
					value: branches[key],
				})),
				default: Object.keys(branches).map((key) => branches[key]),
			},
		]);

		const { message } = await inquirer.prompt([
			{
				type: 'input',
				name: 'message',
				message: 'Enter a message for the update:',
				default: 'No message provided', // Optional default
				validate: (input) => input.trim() !== '' || 'Message cannot be empty.',
			},
		]);
		const command = `yarn eas update --branch ${branch} --message "${message}"`;
		const child = spawn(`${command} --non-interactive`, {
			stdio: ['inherit', 'pipe', 'pipe'], // Read from terminal, but capture output
			shell: true,
			env: {
				...process.env,
				NEXT_FORCE_PROD,
				NEXT_PUBLIC_API_URL,
				EXPO_BUILD_PROFILE,
			},
		});

		child.stdout.on('data', (data) => {
			process.stdout.write(data); // pipe to main stdout
		});

		child.stderr.on('data', (data) => {
			process.stderr.write(data); // pipe errors
		});
		child.on('message', (data) => {});
	});
