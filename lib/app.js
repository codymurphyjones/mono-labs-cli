import { Command } from 'commander'

import { STAGING_URL } from './config.js'
import fs from 'fs'
import { join } from 'node:path';
const packageJSON = JSON.parse(fs.readFileSync(join('./', 'package.json'), 'utf8'));

const version = '0.0.1'
export const program = new Command()

const getBinFromPackageJSON = () => {
	const keyList = Object.keys(packageJSON.bin);
	if(keyList.length === 0) {
		throw new Error('No bin field found in package.json');
	}
	return typeof packageJSON.bin === 'string' ? packageJSON.bin : packageJSON.bin?.[Object.keys(packageJSON.bin)[0]];
}


console.log('binfromjson', getBinFromPackageJSON());

program.name('haste').description('CLI to manage Haste project').version(version)
const EXPO_PUBLIC_API_URL =
	(process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.length > 0) || STAGING_URL
const CLIENT_NAME = process.env.CLIENT_NAME || 'jawdrop'

export const generateEnvValues = (
	forceProd = false,
	ngrokUrl = 'localhost:3000',
	useAtlas = false,
) => {
	return {
		...process.env,
		EXPO_PUBLIC_API_URL,

		CLIENT_NAME,
		EXPO_FORCE_PROD: forceProd,
		EXPO_PRIVATE_API_URL: ngrokUrl,
		EXPO_UNSTABLE_ATLAS: useAtlas,
		EXPO_CLIENT_NAME: CLIENT_NAME,
	}
}
