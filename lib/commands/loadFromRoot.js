import fs from 'fs';
import path from 'path';

export function getRootDirectory() {
	return path.join(process.cwd(), 'myfile.json');
}

export function getRootJson() {
	const jsonPath = path.join(process.cwd(), 'package.json'); // cwd + file
	const raw = fs.readFileSync(jsonPath, 'utf-8');
	const data = JSON.parse(raw);

	return data;
}

export function getHasteFiles() {
	const dir = path.join(process.cwd(), '.mono');

	if (!fs.existsSync(dir)) {
		return [];
	}

	const files = fs.readdirSync(dir); // names only
	return files.map((f) => path.join(dir, f));
}

export function getHasteConfig() {
	const objHaste = getHasteFiles();
	const hasteFileConfig = {};
	let configObject = {};
	for (const file of objHaste) {
		const fileName = path.basename(file).replace('.json', '');
		if (fileName === 'config') {
			const raw = fs.readFileSync(file, 'utf-8');
			const data = JSON.parse(raw);
			if (data) configObject = data;
		} else {
			const raw = fs.readFileSync(file, 'utf-8');
			const data = JSON.parse(raw);
			hasteFileConfig[fileName] = data;
		}
	}

	return {
		files: hasteFileConfig,
		// config: {
		// 	workspace: workspaceMap,
		// },
		config: configObject,
	};
}
