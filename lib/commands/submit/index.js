import { spawn } from 'child_process';

import { program } from '../../app.js';
import { generateEnvValues } from '../../app.js';
import { STAGING_URL } from '../../config.js';

program
	.command('submit')
	.description('Execute eas build command')
	.option('--android', 'Build to target preview profile')
	.option('--ios', 'Build to target production profile')
	.action((str, options) => {
		console.log('its me');
		console.log('test');
		//console.log(options);
		console.log(str);

		let envObj = generateEnvValues(true, '', false);

		envObj.NEXT_PUBLIC_API_URL = `${STAGING_URL}`;
		envObj.NEXT_FORCE_PROD = 'true';
		envObj.EAS_BUILD_PROFILE = 'production';

		const command = `workspace app eas submit ${str.android ? `--platform android` : `--platform ios`}`;
		console.log('Running command:', command);
		const child = spawn('yarn', [command], {
			stdio: 'inherit',
			shell: true, // required if using shell-style commands or cross-platform support
			env: {
				...envObj,
			},
		});

		child.on('exit', (code) => {
			console.log(`Process exited with code ${code}`);
			process.exit(code ?? 0);
		});
	});
