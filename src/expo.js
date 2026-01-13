export { replaceTokens } from '../lib/commands/build-process/dataLayer';
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
