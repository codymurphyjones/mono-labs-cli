import { spawn } from 'child_process';

import { program } from '../app.js';

program
	.command('destroy2')
	.description('Destroys the current or specified cdk construct')
	.argument('[<string>]', 'Environment to deploy')
	.option('-d, --dev', 'Deploy to dev environment')
	.option('-r, --region <region>', 'Region to deploy to')
	.action((str, options) => {
		const owner = str || 'dev';
		const region = options.region || 'us-east-2';
		console.log(`Deploying to ${owner} environment`);
		const command = `workspace infra cdk destroy`;
		const inputs = `-c owner=${owner} -c region=${region}`;
		console.log(`Inputs: ${inputs}`);
		const child = spawn('yarn', [`${command} ${inputs}`], {
			stdio: 'inherit',
			shell: true, // required if using shell-style commands or cross-platform support
		});

		child.on('exit', (code) => {
			console.log(`Process exited with code ${code}`);
			process.exit(code ?? 0);
		});
	});
