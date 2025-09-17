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

export function replaceTokens(str) {
	if (typeof str !== 'string') return str;
	console.log('dataLayer:', dataLayer);
	return str.replace(/\$\{([^}]+)\}/g, (m, k) =>
		hasData(k) ? String(getData(k)) : m
	);
}

export default dataLayer;
