import { describe, it, expect } from 'vitest'
import { parseDate, isOverdue } from './date-parser'

describe('parseDate', () => {
	it('parses ISO format', () => {
		expect(parseDate('2026-02-24')).toBe('2026-02-24')
	})

	it('parses US format', () => {
		expect(parseDate('2/24/2026')).toBe('2026-02-24')
	})

	it('parses US format with leading zeros', () => {
		expect(parseDate('02/24/2026')).toBe('2026-02-24')
	})

	it('parses relative days', () => {
		const result = parseDate('+3d')
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
	})

	it('parses relative weeks', () => {
		const result = parseDate('+2w')
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
	})

	it('returns null for invalid input', () => {
		expect(parseDate('not-a-date')).toBeNull()
	})
})

describe('isOverdue', () => {
	it('returns true for past dates', () => {
		expect(isOverdue('2020-01-01')).toBe(true)
	})

	it('returns false for future dates', () => {
		expect(isOverdue('2099-12-31')).toBe(false)
	})
})
