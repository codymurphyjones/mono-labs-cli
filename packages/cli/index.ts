// Main entry point for @mono-labs/cli package

export type MonoConfig = {
  envMap?: Record<string, string>
  workspace?: {
    packageMaps?: Record<string, string>
    preactions?: string[]
  }
}

export type OptionConfig = {
  type?: 'string' | 'boolean'
  description?: string
  default?: string | boolean
  shortcut?: string
  options?: string[]
  allowAll?: boolean
}

export type CommandConfig = {
  description?: string
  argument?: {
    type?: string
    description?: string
    default?: string
    required?: boolean
  }
  options?: Record<string, OptionConfig>
  preactions?: string[]
  actions?: string[]
  environments?: {
    dev?: Record<string, string>
    stage?: Record<string, string>
  }
}

export type MonoFiles = Record<string, CommandConfig>

export type BootResult = {
  rootDir: string
  rootJson: any
  files: MonoFiles
  config: MonoConfig
}

export { generateNewEnvList } from './lib/generateNewEnvList'
export { filterUnwantedEnvVars, filterUnwantedEnvVarsEAS } from './lib/filterUnwantedEnvVars'
export {
  replaceTokens,
  setData,
  mergeData,
  getData,
  hasData,
} from './lib/commands/build-process/dataLayer'

export { boot } from './lib/commands/build-process/boot'
export { getMonoConfig, getRootDirectory, getRootJson } from './lib/commands/loadFromRoot'
export { buildCommands } from './lib/commands/build-process/cliFactory'
export { runMonoCommand } from './lib/commands/build-process/runMonoCommand'
export { verifyOptionValue } from './lib/commands/build-process/validators'

import { generateNewEnvList } from './lib/generateNewEnvList'
import { filterUnwantedEnvVars, filterUnwantedEnvVarsEAS } from './lib/filterUnwantedEnvVars'
import { replaceTokens } from './lib/commands/build-process/dataLayer'

// Default export for convenience
export default {
  replaceTokens,
  generateNewEnvList,
  filterUnwantedEnvVars,
  filterUnwantedEnvVarsEAS,
}
