// Shared mutable key/value store for build-process commands.
// Extracts dynamic values from preactions and holds defaults from options.

const dataLayer = {};

export function setData(key, value) {
	if (value !== undefined) dataLayer[key] = value;
}

export function mergeData(obj = {}) {
	Object.entries(obj).forEach(([k, v]) => setData(k, v));
	return dataLayer;
}

export function getData(key) {
	return key ? dataLayer[key] : dataLayer;
}

export function hasData(key) {
	return Object.prototype.hasOwnProperty.call(dataLayer, key);
}

export function replaceTokens(str, env) {
	if (typeof str !== 'string') return str;

	console.log('→ replaceTokens called');
	console.log('dataLayer:', dataLayer);
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

export default dataLayer;
