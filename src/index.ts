// Main entry point for @mono-labs/cli package

import {
	filterUnwantedEnvVars,
	filterUnwantedEnvVarsEAS,
	generateNewEnvList,
} from './expo-files/filterUnwantedEnvVars.js';

/* ------------------------------------------------------------------
 * Internal data layer
 * ------------------------------------------------------------------ */

type DataLayer = Record<string, unknown>;

const dataLayer: DataLayer = Object.create(null);

export function setData(key: string, value: unknown): void {
	if (value !== undefined) {
		dataLayer[key] = value;
	}
}

export function mergeData(obj: Record<string, unknown> = {}): DataLayer {
	Object.entries(obj).forEach(([k, v]) => setData(k, v));
	return dataLayer;
}

export function getData(key?: string): unknown {
	return key ? dataLayer[key] : dataLayer;
}

export function hasData(key: string): boolean {
	return Object.prototype.hasOwnProperty.call(dataLayer, key);
}

/* ------------------------------------------------------------------
 * Token replacement
 * ------------------------------------------------------------------ */

export function replaceTokens(
	str: unknown,
	env?: Record<string, string | undefined>
): unknown {
	if (typeof str !== 'string') return str;

	return str.replace(/\$\{([^}]+)\}|\$([A-Z0-9_]+)/g, (_match, k1, k2) => {
		const key = k1 || k2;

		// data layer takes priority
		if (hasData(key)) {
			const val = getData(key);
			return val == null ? '' : String(val);
		}

		// environment variables
		if (env && Object.prototype.hasOwnProperty.call(env, key)) {
			const val = env[key];
			return val == null ? '' : String(val);
		}

		return '';
	});
}

/* ------------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------------ */

export { generateNewEnvList, filterUnwantedEnvVars, filterUnwantedEnvVarsEAS };

export default {
	generateNewEnvList,
	replaceTokens,
	filterUnwantedEnvVars,
	filterUnwantedEnvVarsEAS,
};
