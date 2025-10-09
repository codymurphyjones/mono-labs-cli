import assert from 'assert';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

import { program } from '../../app.js';
import { join } from 'node:path';
const packageJSON = JSON.parse(
	readFileSync(join(process.cwd(), 'package.json'), 'utf8')
);

const awsObject = packageJSON['aws'] || {};

// const awsProfile = awsObject['profile'] || 'default'
const accountId = process.env.CDK_DEPLOY_ACCOUNT;
const awsProfile = process.env.CDK_DEPLOY_PROFILE || 'default';

program
	.command('deploy2')
	.description('Execute cdk deploy command')
	.argument('[<string>]', 'Environment to deploy')
	.option('-d, --dev', 'Deploy to dev environment')
	.option('-r, --region <region>', 'Region to deploy to')
	.action((str, options) => {
		const owner = str || 'dev';
		const region = options.region || 'us-east-2';

		const command = `workspace infra deploy`;
		const inputs = `-c owner=${owner} -c region=${region}`;

		const child = spawn('yarn', [`${command} ${inputs}`], {
			stdio: 'inherit',
			shell: true, // required if using shell-style commands or cross-platform support
			env: {
				AWS_PROFILE: awsProfile,
			},
		});

		child.on('exit', (code) => {
			process.exit(code ?? 0);
		});
	});
