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
	console.log('replaceTokens input:', str);
	if (typeof str !== 'string') return str;
	console.log('dataLayer:', dataLayer);
	const rVal = str.replace(/\$\{([^}]+)\}/g, (m, k) => {
		console.log('token:', k);
		console.log('match:', m);
		console.log('hasData:', hasData(k));
		if (hasData(k)) {
			console.log('getData:', getData(k));
			return String(getData(k));
		} else {
			return m;
		}
	});
	console.log('rVal:', rVal);
	return rVal;
}

export default dataLayer;
