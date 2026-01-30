import { runForeground } from './runners/runForeground'
import { runBackground } from './runners/runBackground'
import { killAllBackground } from './runners/processManager'
import { getMonoConfig } from '../loadFromRoot'
import { parseEnvFile } from './readEnv'
import path from 'node:path'
import { mergeData } from './dataLayer'
import { testFlag } from './testflag'

export function getAllowAllKeys(cfg: any): string[] {
  const decls = cfg.options ?? {}
  return Object.entries(decls)
    .filter(
      ([, v]) =>
        Boolean((v as any)?.allowAll) &&
        Array.isArray((v as any)?.options) &&
        (v as any).options.length > 0
    )
    .map(([k]) => k)
}

/**
 * Orchestrate execution of a single mono command definition.
 * Phases:
 *  1. Preactions (sequential, blocking) via runForeground
 *  2. Actions (background except last; last attached) via runBackground
 * Environment selection based on --stage flag and injection of AWS_PROFILE.
 */
export async function runMonoCommand(configObject: any, options: any = {}): Promise<void> {
  const { config } = getMonoConfig() as { config: any }
  const devConfig = configObject.environments?.dev ?? {}
  console.log('configObject:', JSON.stringify(configObject, null, 2))

  // Usage:
  const envPath = path.resolve(process.cwd(), '.env')
  const keymap = parseEnvFile(envPath)

  const prodConfig = configObject.environments?.prod ?? {}
  const awsProfile = process.env.CDK_DEPLOY_PROFILE || 'default'
  const envObjBase: Record<string, any> = options.prod ? { ...prodConfig } : { ...devConfig }

  Object.keys(envObjBase).forEach((k) => {
    if (
      typeof envObjBase[k] === 'string' &&
      envObjBase[k].startsWith('$') &&
      !envObjBase[k].startsWith('${')
    ) {
      const refKey = envObjBase[k].substring(1)
      envObjBase[k] = (keymap as any)[refKey] || ''
    }
  })
  envObjBase.AWS_PROFILE = awsProfile

  const envKeys = Object.keys(process.env).filter((k) => k.startsWith('MONO_'))
  const envMapList = config.envMap ?? ['FAILURE']
  const combinedEnv = { ...process.env, ...envObjBase }
  const envMapVals: Record<string, any> = {}

  envKeys.forEach((k) => {
    envMapList.forEach((item: string) => {
      envMapVals[k.replace('MONO', item)] = (combinedEnv as any)[k]
    })
  })

  const envObj = { ...envObjBase, ...envMapVals }

  const preactions: string[] = configObject.preactions ?? []
  const actions: string[] = configObject.actions ?? []

  console.log(`→ Executing mono command: ${configObject.name || 'Unnamed Command'}`)
  console.log(`→ Using AWS profile: ${awsProfile}`)
  console.log(`→ Using environment: ${options.stage ? 'stage' : 'dev'}`)
  console.log('→ Environment variables:', envObj)

  // Run preactions sequentially
  for (const cmd of preactions) {
    await runForeground(cmd, envObj)
  }

  if (actions.length === 0) return

  const bg = actions.slice(0, -1)
  const fg = actions[actions.length - 1]

  for (const cmd of bg) {
    void runBackground(cmd, envObj, 'background')
  }

  try {
    await runBackground(fg, envObj, 'foreground', true)
  } finally {
    killAllBackground()
  }
}

export default runMonoCommand
