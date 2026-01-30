import { getMonoConfig } from './commands/loadFromRoot'

export function generateNewEnvList(processEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const { config } = getMonoConfig() as any

  const envMapList: string[] = config.envMap ?? ['FAILURE']
  const envKeys = Object.keys(processEnv).filter((k) => k.startsWith('MONO_'))
  const envObj: Record<string, string | undefined> = {}

  for (const key of envKeys) {
    if (key.includes('SECRET')) continue
    const mappedKey = (envMapList as any)[key] || key
    envObj[mappedKey] = processEnv[key]
  }

  return { ...processEnv, ...envObj }
}
