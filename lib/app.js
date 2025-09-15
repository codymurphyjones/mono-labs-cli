import { Command } from 'commander'

import { STAGING_URL } from './config.js'

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgPath = join(__dirname, '../', 'package.json');      
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const version = pkg.version || '0.0.1'
export const program = new Command()

const getBinFromPackageJSON = () => {
	const keyList = Object.keys(pkg.bin);
	if(keyList.length === 0) {
		throw new Error('No bin field found in package.json');
	}
	return keyList[0];
}


const programName = getBinFromPackageJSON();
console.log('description', pkg.description);

program.name(programName).description(pkg.description || '').version(version)
const EXPO_PUBLIC_API_URL =
	(process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.length > 0) || STAGING_URL

export const generateEnvValues = (
	forceProd = false,
	ngrokUrl = 'localhost:3000',
	useAtlas = false,
) => {
	return {
		...process.env,
		EXPO_PUBLIC_API_URL,
		EXPO_FORCE_PROD: forceProd,
		EXPO_PRIVATE_API_URL: ngrokUrl,
		EXPO_UNSTABLE_ATLAS: useAtlas,
	}
}
