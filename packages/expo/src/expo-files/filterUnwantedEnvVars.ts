import { getMonoConfig } from '@mono-labs/project'

export function filterUnwantedEnvVars(env: Record<string, string>) {
  const unwantedPrefixes = [
    // 'EFC_',
    // 'FPS_',
    // 'GIT_',
    // 'NVM_',
    // 'VSCODE_',
    // 'LOGONSERVER',
    // 'NUMBER_OF_PROCESSORS',
    // 'OS',
    // 'COREPACK',
    // 'PROCESSOR',
    // 'USERDOMAIN',
    // 'USERDOMAIN_ROAMINGPROFILE',
    // 'USERNAME',
    // 'CUDA',
    // 'SESSIONNAME',
    // 'ZES',
    // '3DVPATH',
    // 'APP_NAME',
    // 'asl.log',
    // 'BERRY_BIN_FOLDER',
    // 'CHROME_CRASHPAD_PIPE_NAME',
    // 'COLORTERM',
    // 'COMPUTERNAME',
    // 'CUDNN',
    // 'EAS_BUILD_PROFILE',
    // 'EAS_PROJECT_ID',
    // 'EXPO_UNSTABLE_ATLAS',
    // 'INIT_CWD',
    // 'JAVA_HOME',
    // 'LANG',
    // 'OneDrive',
    // 'ORIGINAL_XDG_CURRENT_DESKTOP',
    // 'PROJECT_CWD',
    // 'PROMPT',
    // 'PWD',
    // 'TERM_PROGRAM',
    // 'TERM_PROGRAM_VERSION',
    // '__PSLockDownPolicy',
    'npm_config_force',
  ]
  return Object.keys(env).reduce(
    (obj, key) => {
      if (!unwantedPrefixes.some((prefix) => key.startsWith(prefix))) {
        obj[key] = env[key]
      }
      return obj
    },
    {} as Record<string, string>
  )
}

export function filterUnwantedEnvVarsEAS(env: Record<string, string>) {
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
    'HOME',
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
  return Object.keys(env).reduce(
    (obj: Record<string, string>, key) => {
      if (!unwantedPrefixes.some((prefix) => key.startsWith(prefix))) {
        obj[key] = env[key]
      }
      return obj
    },
    {} as Record<string, string>
  )
}

export function generateNewEnvList(processEnv: Record<string, string>): Record<string, string> {
  const { config } = getMonoConfig()

  const envPrefixes: string[] = Array.isArray(config.envMap) ? config.envMap : []

  const result: Record<string, string> = { ...processEnv }

  for (const [key, value] of Object.entries(processEnv)) {
    // Only clone MONO_ variables
    if (!key.startsWith('MONO_')) continue

    // Skip secrets
    if (key.includes('SECRET')) continue

    const suffix = key.slice('MONO_'.length)

    for (const prefix of envPrefixes) {
      const mappedKey = `${prefix}_${suffix}`
      result[mappedKey] = value
    }
  }
  return result
}
