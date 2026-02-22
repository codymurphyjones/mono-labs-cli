import * as fs from 'fs'
import fg from 'fast-glob'
import type { Notation, TrackerConfig } from '../types'
import { parseFileContent } from './notation-parser'

export async function scanFiles(config: TrackerConfig, rootDir?: string): Promise<Notation[]> {
	const root = rootDir ?? config.rootDir

	const files = await fg(config.include, {
		cwd: root,
		ignore: config.exclude,
		absolute: true,
		onlyFiles: true,
	})

	const allNotations: Notation[] = []

	for (const file of files) {
		const content = await fs.promises.readFile(file, 'utf-8')
		const notations = parseFileContent(file, content, config.idPrefix)
		allNotations.push(...notations)
	}

	return allNotations
}
