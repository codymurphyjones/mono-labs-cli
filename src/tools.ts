import type { ExpoConfig, AppJSONConfig } from 'expo/config'

export function replaceTokens(input: string, tokens: Record<string, string>): string {
  return input.replace(/\$\{([^}]+)\}|\$([A-Z0-9_]+)/g, (_m, k1, k2) => {
    const key = (k1 || k2) as string
    const val = tokens[key]
    return val == null ? '' : String(val)
  })
}

function filterEnvByPrefix(env: NodeJS.ProcessEnv, prefix: string): Record<string, string> {
  const filtered: Record<string, string> = {}
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(prefix) && typeof value === 'string') {
      filtered[key] = value
    }
  }
  return filtered
}

export function setUpConfig(config: AppJSONConfig): ExpoConfig {
  const { extra = {}, ...other } = (config.expo ?? {}) as any
  const router = extra['router'] ? { origin: false, ...extra['router'] } : { origin: false }

  return {
    ...(config as any),
    expo: {
      ...other,
      extra: {
        ...filterEnvByPrefix(process.env, 'NEXT_PUBLIC_'),
        eas: {
          projectId: process.env.EAS_PROJECT_ID,
        },
        router,
        ...extra,
      },
    },
  } as ExpoConfig
}
