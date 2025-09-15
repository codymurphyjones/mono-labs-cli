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
import './commands/submit/index.js'
import './commands/update/index.js'
import './commands/build-process/index.js'


program.on('command:*', (operands) => {
  const [cmd, ...args] = operands;
  // your fallback logic
  console.error(`Unknown command: ${cmd}`);
  // e.g. route to a generic handler:
  // runFallback(cmd, args)
  process.exitCode = 1; // don’t exit immediately if you prefer
});
program.parse()
