import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { JsonlStorage } from './jsonl-storage'
import type { Notation } from '../types'

function makeNotation(overrides: Partial<Notation> = {}): Notation {
	return {
		id: 'N-test001',
		type: 'TODO',
		description: 'Test notation',
		body: [],
		codeContext: [],
		location: { file: 'test.ts', line: 1, column: 1 },
		status: 'open',
		tags: [],
		actions: [],
		relationships: [],
		rawBlock: '// TODO: Test notation',
		scannedAt: '2026-01-01T00:00:00.000Z',
		...overrides,
	} as Notation
}

describe('JsonlStorage', () => {
	let tmpDir: string
	let storage: JsonlStorage

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracker-test-'))
		storage = new JsonlStorage(path.join(tmpDir, 'data', 'notations.jsonl'))
	})

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true })
	})

	it('returns empty array when file does not exist', async () => {
		const result = await storage.readAll()
		expect(result).toEqual([])
	})

	it('round-trips notations through writeAll/readAll', async () => {
		const notations = [makeNotation({ id: 'N-1' }), makeNotation({ id: 'N-2' })]
		await storage.writeAll(notations)
		const result = await storage.readAll()
		expect(result).toHaveLength(2)
		expect(result[0].id).toBe('N-1')
		expect(result[1].id).toBe('N-2')
	})

	it('appends a single notation', async () => {
		await storage.append(makeNotation({ id: 'N-1' }))
		await storage.append(makeNotation({ id: 'N-2' }))
		const result = await storage.readAll()
		expect(result).toHaveLength(2)
	})

	it('appends a batch of notations', async () => {
		await storage.appendBatch([
			makeNotation({ id: 'N-1' }),
			makeNotation({ id: 'N-2' }),
			makeNotation({ id: 'N-3' }),
		])
		const result = await storage.readAll()
		expect(result).toHaveLength(3)
	})

	it('skips corrupt lines gracefully', async () => {
		const filePath = path.join(tmpDir, 'data', 'notations.jsonl')
		await storage.ensureDirectory()
		fs.writeFileSync(
			filePath,
			[
				JSON.stringify(makeNotation({ id: 'N-1' })),
				'this is not valid json{{{',
				JSON.stringify(makeNotation({ id: 'N-2' })),
			].join('\n') + '\n'
		)
		const result = await storage.readAll()
		expect(result).toHaveLength(2)
		expect(result[0].id).toBe('N-1')
		expect(result[1].id).toBe('N-2')
	})

	it('creates directory on write', async () => {
		const nested = new JsonlStorage(path.join(tmpDir, 'a', 'b', 'c', 'data.jsonl'))
		await nested.writeAll([makeNotation()])
		const result = await nested.readAll()
		expect(result).toHaveLength(1)
	})

	it('overwrites existing data on writeAll', async () => {
		await storage.writeAll([makeNotation({ id: 'N-1' }), makeNotation({ id: 'N-2' })])
		await storage.writeAll([makeNotation({ id: 'N-3' })])
		const result = await storage.readAll()
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe('N-3')
	})

	it('handles empty batch append', async () => {
		await storage.appendBatch([])
		const result = await storage.readAll()
		expect(result).toEqual([])
	})
})
