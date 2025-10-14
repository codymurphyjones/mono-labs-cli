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

export function replaceTokens(str, env = {}) {
	if (typeof str !== 'string') return str;
	console.log('str:', str);
	console.log('env:', env);

	const rVal = str.replace(/\$\{([^}]+)\}/g, (m, k) => {
		// ✅ 1. Priority: existing dataLayer replacement
		if (hasData(k)) {
			const val = getData(k);
			return String(val);
		}

		// ✅ 2. Next: environment variable replacement
		if (env && Object.prototype.hasOwnProperty.call(env, k)) {
			const val = env[k];
			return String(val ?? '');
		}

		// ✅ 3. Fallback: replace with empty string
		return '';
	});
	console.log('rVal:', rVal);

	return rVal;
}

export default dataLayer;
