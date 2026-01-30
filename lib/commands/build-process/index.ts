// Orchestrator for modular build-process command system.
import { boot } from './boot'
import { buildCommands, createCliCommands } from './cliFactory'
import { ensureSignalHandlers } from './runners/processManager'
import { program } from '../../app'

const { files } = boot()

ensureSignalHandlers()
buildCommands(files as any)
program.addCommand(createCliCommands())

// (No direct export; importing this file registers commands on the shared commander program.)
export {}
