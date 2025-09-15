import 'dotenv/config'

import { program } from './app.js'
import './commands/build/index.js'
import './commands/deploy/index.js'
import './commands/destroy.js'
import './commands/dev/index.js'
import './commands/generate/index.js'
import './commands/init/index.js'
import './commands/prune/index.js'
import './commands/reset.js'
import './commands/seed/index.js'
import './commands/squash/index.js'
import './commands/submit/index.js'
import './commands/update/index.js'
import './commands/build-process/index.js'

program.parse()
