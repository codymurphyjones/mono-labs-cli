import { program } from '../../app.js'
import { exportTable } from './generateSeed.js'

program
	.command('generate')
	.description('Generate seed data in ./docker/seed')
	.argument('[<string>]', 'Tables to generateFrom')
	.option('-o, --owner <owner>', 'Owner of the tables')
	.option('-n, --newowner <newowner>', 'New owner of the tables')
	.option('-p, --live', 'Pull from live')
	.option('-r, --region <region>', 'Region to deploy to')
	.option('-d, --db <db>', 'Databases to rewrite to')
	.option('--profiles', 'Profiles only seed generation')
	.action(async (str, options) => {
		const owner = options.owner || 'dev'
		const profilesOnly = options.profiles || false
		const tables = (str || '').split(',')
		let nameRedirect = []
		if (options.db) nameRedirect = options.db.split(',')

		exportTable(
			tables,
			owner,
			options.newowner,
			nameRedirect,
			options.live,
			options.region,
			profilesOnly,
		)
	})
