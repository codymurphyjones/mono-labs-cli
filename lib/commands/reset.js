import { spawn } from 'child_process'

import { program } from '../app.js'

function createChild(command) {
	const child = spawn(command, {
		stdio: ['inherit', 'pipe', 'pipe'], // Read from terminal, but capture output
		shell: true,
		env: {
			...process.env,
		},
	})

	child.stdout.on('data', (data) => {
		process.stdout.write(data) // pipe to main stdout
	})

	child.stderr.on('data', (data) => {
		process.stderr.write(data) // pipe errors
	})
	child.on('message', (data) => {
		console.log(`Message from child process: ${data}`)
	})
}
program
	.command('reset')
	.description('Execute eas build command')
	.option('-s, --soft', 'Pull from live')
	.action(async (options) => {
		createChild(`git reset ${options.soft ? '--soft' : '--mixed '} HEAD~1`)
	})
