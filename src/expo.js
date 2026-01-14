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
