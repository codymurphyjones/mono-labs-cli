import type { AppJSONConfig, ExpoConfig } from 'expo/config'

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

export function filterUnwantedEnvVarsEAS(envVars: Record<string, string>): Record<string, string> {
  // Keep in sync with lib/filterUnwantedEnvVars.ts
  const unwantedPrefixes = [
    'ProgramData',
    'ProgramFiles',
    'ProgramFiles(x86)',
    'ProgramW6432',
    'PSModulePath',
    'PUBLIC',
    'TEMP',
    'TMP',
    'EFC_',
    'FPS_',
    'GIT_',
    'NVM_',
    'VSCODE_',
    'windir',
    'Chocolatey',
    'ALLUSERSPROFILE',
    'APPDATA',
    'CommonProgramFiles',
    'CommonProgramW6432',
    'ComSpec',
    'Driver',
    'HOME',
    'npm',
    'LOCALAPPDATA',
    'LOGONSERVER',
    'NUMBER_OF_PROCESSORS',
    'OS',
    'COREPACK',
    'PROCESSOR',
    'USERDOMAIN',
    'USERDOMAIN_ROAMINGPROFILE',
    'USERNAME',
    'USERPROFILE',
    'CUDA',
    'SESSIONNAME',
    'ZES',
    '3DVPATH',
    'APP_NAME',
    'asl.log',
    'BERRY_BIN_FOLDER',
    'CHROME_CRASHPAD_PIPE_NAME',
    'COLORTERM',
    'COMPUTERNAME',
    'CUDNN',
    'EAS_BUILD_PROFILE',
    'EAS_PROJECT_ID',
    'EXPO_UNSTABLE_ATLAS',
    'INIT_CWD',
    'JAVA_HOME',
    'LANG',
    'OneDrive',
    'ORIGINAL_XDG_CURRENT_DESKTOP',
    'PROJECT_CWD',
    'PROMPT',
    'PWD',
    'TERM_PROGRAM',
    'TERM_PROGRAM_VERSION',
    '__PSLockDownPolicy',
    'PATH',
    'SystemRoot',
    'SystemDrive',
    'npm_',
  ]

  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(envVars)) {
    if (!unwantedPrefixes.some((prefix) => key.startsWith(prefix))) {
      out[key] = value
    }
  }
  return out
}
