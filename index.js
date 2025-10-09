// Main entry point for @mono-labs/cli package
import { generateNewEnvList } from './lib/generateNewEnvList.js';

// Default export for convenience
export default {
	generateNewEnvList,
};

export function filterUnwantedEnvVars(env) {
	const unwantedPrefixes = [
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
		'Path',
		'COREPACK',
		'PATHEXT',
		'PROCESSOR',
		'Program',
		'PSModule',
		'PUBLIC',
		'SystemDrive',
		'SystemRoot',
		'TEMP',
		'TMP',
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
		'PATH',
		'PROJECT_CWD',
		'PROMPT',
		'PWD',
		'TERM_PROGRAM',
		'TERM_PROGRAM_VERSION',
		'__PSLockDownPolicy',
	];
	return Object.keys(env).reduce((obj, key) => {
		if (!unwantedPrefixes.some((prefix) => key.startsWith(prefix))) {
			obj[key] = env[key];
		}
		return obj;
	}, {});
}
