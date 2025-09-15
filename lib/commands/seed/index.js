import { spawn } from 'child_process'

import { program } from '../../app.js'
import { importAllDynamoBatches } from './import.js'

program
	.command('seed')
	.description('Execute eas build command')
	.option('-p, --live', 'Pull from live')
	.action(async (options) => {
		importAllDynamoBatches('./docker/seed', options.live)
	})
