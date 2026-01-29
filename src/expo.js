export function replaceTokens(str, env) {
	if (typeof str !== 'string') return str;

	return str.replace(/\$\{([^}]+)\}|\$([A-Z0-9_]+)/g, (m, k1, k2) => {
		const k = k1 || k2;

		// existing data layer takes priority (guarded in case not defined)
		if (typeof hasData === 'function' && hasData(k)) {
			const val = typeof getData === 'function' ? getData(k) : undefined;
			return val == null ? '' : String(val);
		}

		// environment variables
		if (env && Object.prototype.hasOwnProperty.call(env, k)) {
			const val = env[k];
			return val == null ? '' : String(val);
		}

		// fallback
		return '';
	});
}

function filterEnvByPrefix(env, prefix) {
	const filtered = {};
	for (const key in env) {
		if (key.startsWith(prefix)) {
			filtered[key] = env[key];
		}
	}
	return filtered;
}

export function setUpConfig(config) {
	const { extra = {}, ...other } = config.expo || {};
	const router =
		extra['router'] ?
			{ origin: false, ...extra['router'] }
		:	{
				origin: false,
			};
	const appConfig = {
		...config,

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
	};

	return appConfig;
}

export function filterUnwantedEnvVarsEAS(env) {
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
	];
	return Object.keys(env).reduce((obj, key) => {
		if (!unwantedPrefixes.some((prefix) => key.startsWith(prefix))) {
			obj[key] = env[key];
		}
		return obj;
	}, {});
}
