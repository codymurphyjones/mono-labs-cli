import { program } from '../../app.js'
import { dev } from './dev-editor.js'

program
  .command('dev2')
  .description('Run local dev environment')
  .option('-d, --dev', 'Deploy to dev environment')
  .option('-a, --atlas', 'Region to deploy to')
  .option('--app', 'Runs just the native app')
  .option('--host', 'Runs just the backend host app')
  .option('--stage', 'Connect to staging environment')
  .action(async (str, options) => {
    let services = undefined
    console.log('str', str)
    if (str.app || str.host) {
      if (str.app) services = ['app']
      if (str.host) services = ['backend']
    }
    const stage = str.stage || false
    console.log(str.dev || false)
    dev(str.dev || false, str.atlas || false, services, stage)
  })
