import { describe, it, expect } from 'vitest'
import { generateId, generateStableId } from './id-generator'

describe('generateId', () => {
	it('generates an id with default prefix', () => {
		const id = generateId()
		expect(id).toMatch(/^N-[a-f0-9]{8}$/)
	})

	it('generates an id with custom prefix', () => {
		const id = generateId('T')
		expect(id).toMatch(/^T-[a-f0-9]{8}$/)
	})

	it('generates unique ids', () => {
		const ids = new Set(Array.from({ length: 100 }, () => generateId()))
		expect(ids.size).toBe(100)
	})
})

describe('generateStableId', () => {
	it('generates deterministic id for same file and line', () => {
		const id1 = generateStableId('N', 'src/foo.ts', 10)
		const id2 = generateStableId('N', 'src/foo.ts', 10)
		expect(id1).toBe(id2)
	})

	it('generates different ids for different lines', () => {
		const id1 = generateStableId('N', 'src/foo.ts', 10)
		const id2 = generateStableId('N', 'src/foo.ts', 20)
		expect(id1).not.toBe(id2)
	})
})
