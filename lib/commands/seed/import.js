import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function importAllDynamoBatches(folderPath, useRemote = false) {
	const files = fs
		.readdirSync(folderPath)
		.filter(
			(file) => file.startsWith('dynamodb-seed-') && file.endsWith('.json')
		);

	files.sort(); // Optional: ensures files run in order

	for (const file of files) {
		const fullPath = path.resolve(path.join(folderPath, file));

		const baseCommand =
			useRemote ?
				`aws dynamodb batch-write-item --request-items file://${fullPath}`
			:	`aws dynamodb batch-write-item --endpoint-url http://localhost:8000 --request-items file://${fullPath}`;
		try {
			execSync(baseCommand, {
				stdio: 'inherit',
			});
		} catch (err) {
			console.error(`❌ Error with ${file}:`, err.message);
			break; // or continue if you want to skip failed files
		}
	}
}
