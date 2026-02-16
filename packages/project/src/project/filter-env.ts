import { getMonoConfig } from '../loadFromRoot'

const DEFAULT_PREFIXES = ['MONO_', 'EAS_', 'APP_', 'TAMAGUI_']

export function filterEnvByPrefixes(
  env: Record<string, string | undefined>,
  prefixes: string[],
  include: string[] = []
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(env)) {
    if (typeof value !== 'string') continue
    if (
      prefixes.some((prefix) => key.startsWith(prefix)) ||
      include.includes(key)
    ) {
      result[key] = value
    }
  }
  return result
}

export function filterEnvByConfig(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
  include: string[] = []
): Record<string, string> {
  const { config } = getMonoConfig()
  const prefixes = [...DEFAULT_PREFIXES, ...config.envMap]
  return filterEnvByPrefixes(env, prefixes, include)
}
