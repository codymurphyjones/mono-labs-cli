// Orchestrator for modular build-process command system.
import { boot } from './boot.js';
import { buildCommands, createCliCommands } from './cliFactory.js';
import { ensureSignalHandlers } from './runners/processManager.js';
import { program } from '../../app.js';

const { files, config, rootDir } = boot();
console.log('[build-process] root:', rootDir);
console.log('[build-process] commands discovered:', Object.keys(files));

ensureSignalHandlers();
buildCommands(files);
program.addCommand(createCliCommands());

// (No direct export; importing this file registers commands on the shared commander program.)
