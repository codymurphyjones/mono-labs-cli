import { program } from '../../app.js'
import { squash } from './squash.js'

program
	.command('squash')
	.description('Squash x count of commits into one commit')

	.action(() => squash())
