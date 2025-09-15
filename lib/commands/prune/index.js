import { spawn } from 'child_process'

import { program } from '../../app.js'
import { pruneRepo } from './prune.js'

program
	.command('prune')
	.description('Prune local branches that are not on origin')

	.action(() => {
		pruneRepo()
	})
