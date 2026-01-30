import { program } from '../../app'
import { pruneRepo } from './prune'

program
  .command('prune')
  .description('Prune local branches that are not on origin')
  .action(() => {
    pruneRepo()
  })
