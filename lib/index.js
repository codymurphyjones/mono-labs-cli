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
  const [cmd] = operands;                   // e.g. "destroy3"
  const raw = program.rawArgs.slice(2);     // everything after `node script.js`
  console.log('raw', raw);
  const i = raw.indexOf(cmd);
  const unknownWithArgs = i >= 0 ? raw.slice(i).join(' ') : operands.join(' ');

  console.error(`Unknown command: ${unknownWithArgs}`);
  // -> "Unknown command: destroy3 --test --lot test"

  process.exitCode = 1; // don’t hard-exit if you prefer
});
program.parse()
