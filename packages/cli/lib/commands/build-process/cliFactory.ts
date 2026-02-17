import { program } from '../../app'
import { Command } from 'commander'
import runMonoCommand from './runMonoCommand'
import { verifyOptionValue } from './validators'
import { mergeData } from './dataLayer'
import { getMonoConfig } from '../loadFromRoot'
import { pruneRepo } from '../prune/prune'
import { writeLog } from '@mono-labs/shared'

type MonoFileDefinition = {
  name?: string
  description?: string
  argument?: {
    required?: boolean
    type?: string
    description?: string
    default?: unknown
    options?: string[]
    allowAll?: boolean
  }
  options?: Record<
    string,
    {
      type?: 'string' | 'boolean'
      shortcut?: string
      description?: string
      default?: unknown
      options?: string[]
      allowAll?: boolean
    }
  >
  environments?: Record<string, Record<string, unknown>>
  preactions?: string[]
  actions?: string[]
}

type ArgumentConfig = {
  default?: string
}

type OptionConfig = {
  default?: string | boolean | number
}

type CommandConfig = {
  argument?: ArgumentConfig
  options?: Record<string, OptionConfig>
}

function buildDefaultLookup(config: CommandConfig): Record<string, string | boolean | number> {
  const defaults: Record<string, string | boolean | number> = {}

  // Handle argument default
  if (config.argument?.default !== undefined) {
    defaults.arg = config.argument.default
  }

  // Handle options defaults
  if (config.options) {
    for (const [key, option] of Object.entries(config.options)) {
      if (option.default !== undefined) {
        defaults[key] = option.default
      }
    }
  }

  return defaults
}

/**
 * Register commander commands for each mono file definition.
 * Handles argument, options, validation, and action wiring.
 */
export function createConfigCommands(): Command {
  const config = new Command('config').description('Manage configuration')

  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action((_key: string, _value: string) => {})

  config
    .command('get <key>')
    .description('Get a configuration value')
    .action((_key: string) => {})

  config
    .command('list')
    .description('List all configuration values')
    .action(() => {})

  return config
}

export function createCliCommands(): Command {
  const tools = new Command('tools').description('Manage tools')

  tools
    .command('prune')
    .description('Prune unused branches in git')
    .action(() => {
      pruneRepo()
    })

  return tools
}

export function buildCommands(files: Record<string, MonoFileDefinition>): void {
  try {
    const { config } = getMonoConfig() as { config: Record<string, any> }

    Object.entries(files).forEach(([commandName, configObject]) => {
      const optionsData = configObject.options || {}

      let current = program
        .command(commandName)
        .description(configObject.description || 'Mono command')

      const argInfo = configObject.argument

      // Argument
      if (argInfo) {
        const required = !!argInfo.required
        const type = argInfo.type || 'string'
        const argSpec = required ? `<${type}>` : `[${type}]`
        current = current.argument(argSpec, argInfo.description || '')
      }

      // Options
      Object.entries(optionsData).forEach(([optionKey, meta]) => {
        const type = meta.type || 'boolean'
        const shortcut = meta.shortcut ? `-${meta.shortcut}, ` : ''

        if (type === 'string') {
          current = current.option(
            `${shortcut}--${optionKey} <${optionKey}>`,
            meta.description || ''
          )
        } else {
          current = current.option(`${shortcut}--${optionKey}`, meta.description || '')
        }
      })

      config.prodFlag = config.prodFlag || 'prod'

      current = current.option(
        `--${config.prodFlag}`,
        'Process execution mode: prduction or dev',
        false
      )

      current.action(async (arg: unknown, cmd: Command) => {
        const envDefaults: Record<string, unknown> = {}
        const optionValueList = argInfo?.options
        let actualOptions = optionValueList

        if (optionValueList) {
          actualOptions = argInfo?.allowAll ? [...optionValueList, 'all'] : [...optionValueList]
        }

        if (argInfo) {
          if (
            argInfo &&
            optionValueList &&
            actualOptions &&
            !actualOptions.includes(String(arg ?? argInfo.default))
          ) {
            throw new Error(
              `Invalid argument value for ${commandName}, must be one of: ${actualOptions.join(', ')}`
            )
          }
        }

        const optionsDataList = Object.keys(optionsData).map((key) => ({
          ...(optionsData as any)[key],
          name: key,
        }))

        optionsDataList.forEach((item: any) => {
          if (item.default) {
            envDefaults[item.name] = item.default
          }
        })

        try {
          const optionVals: Record<string, any> = {
            ...envDefaults,
            ...(cmd.opts ? (cmd.opts() as Record<string, unknown>) : (cmd as any)),
          }

          Object.keys(optionVals).forEach((k) => {
            optionVals[k] = verifyOptionValue(k, optionVals[k], optionsData as any)
          })
          optionVals['prod'] = optionVals[config.prodFlag] || false

          const defaultLookups = buildDefaultLookup(configObject as any)

          const argVal = arg || configObject.argument?.default

          const args = { ...defaultLookups, arg: argVal }

          writeLog('defaults', optionVals)
          writeLog('object', { ...optionVals, ...args })
          mergeData({ ...optionVals, ...args } as any)
          await runMonoCommand(configObject as any, optionVals)
        } catch (err: any) {
          console.error('Error executing mono command:', err?.message)
        }
      })
    })
  } catch (err: any) {
    console.error('Error executing mono command:', err?.message)
  }
}

export default buildCommands
