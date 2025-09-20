import assert from 'assert';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';

import { program } from '../../app.js';

import { join } from 'node:path';
const packageJSON = JSON.parse(
	readFileSync(join(process.cwd(), 'package.json'), 'utf8')
);

console.log('Deploy command loaded');

const awsObject = packageJSON['aws'] || {};

const accountId = process.env.CDK_DEPLOY_ACCOUNT;
const awsProfile = process.env.CDK_DEPLOY_PROFILE || 'default';

program
	.command('init2')
	.description('Execute cdk deploy command')
	.action((str, options) => {
		const owner = str || 'dev';
		const region = options.region || 'us-east-2';
		console.log(`Deploying to ${owner} environment`);
		const command = `workspace infra cdk bootstrap`;
		const child = spawn('yarn', [`${command}`], {
			stdio: 'inherit',
			shell: true, // required if using shell-style commands or cross-platform support
			env: {
				AWS_PROFILE: awsProfile,
			},
		});

		child.on('exit', (code) => {
			console.log(`Process exited with code ${code}`);
			process.exit(code ?? 0);
		});
	});
