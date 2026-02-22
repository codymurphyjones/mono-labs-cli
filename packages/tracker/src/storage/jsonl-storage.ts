import * as fs from 'fs'
import * as path from 'path'
import type { Notation } from '../types'

export class JsonlStorage {
	private filePath: string

	constructor(filePath: string) {
		this.filePath = filePath
	}

	async ensureDirectory(): Promise<void> {
		const dir = path.dirname(this.filePath)
		await fs.promises.mkdir(dir, { recursive: true })
	}

	async readAll(): Promise<Notation[]> {
		try {
			const content = await fs.promises.readFile(this.filePath, 'utf-8')
			const lines = content.trim().split('\n').filter(Boolean)
			const notations: Notation[] = []
			for (const line of lines) {
				try {
					notations.push(JSON.parse(line))
				} catch {
					// Skip corrupt lines
				}
			}
			return notations
		} catch (err: any) {
			if (err.code === 'ENOENT') return []
			throw err
		}
	}

	async writeAll(notations: Notation[]): Promise<void> {
		await this.ensureDirectory()
		const tmpPath = this.filePath + '.tmp'
		const content = notations.map((n) => JSON.stringify(n)).join('\n') + '\n'
		await fs.promises.writeFile(tmpPath, content, 'utf-8')
		await fs.promises.rename(tmpPath, this.filePath)
	}

	async append(notation: Notation): Promise<void> {
		await this.ensureDirectory()
		await fs.promises.appendFile(this.filePath, JSON.stringify(notation) + '\n', 'utf-8')
	}

	async appendBatch(notations: Notation[]): Promise<void> {
		if (notations.length === 0) return
		await this.ensureDirectory()
		const content = notations.map((n) => JSON.stringify(n)).join('\n') + '\n'
		await fs.promises.appendFile(this.filePath, content, 'utf-8')
	}
}
