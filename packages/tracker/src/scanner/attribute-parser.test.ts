import { describe, it, expect } from 'vitest'
import { parseAttributes } from './attribute-parser'

describe('parseAttributes', () => {
	describe('@ prefix strategy', () => {
		it('parses @author', () => {
			const attrs = parseAttributes(['@author: Cody Jones'])
			expect(attrs.author).toBe('Cody Jones')
		})

		it('parses @assignee', () => {
			const attrs = parseAttributes(['@assignee: Austin Lowell'])
			expect(attrs.assignee).toBe('Austin Lowell')
		})

		it('parses @priority', () => {
			const attrs = parseAttributes(['@priority: critical'])
			expect(attrs.priority).toBe('critical')
		})

		it('parses @tags', () => {
			const attrs = parseAttributes(['@tags: perf, security, ux'])
			expect(attrs.tags).toEqual(['perf', 'security', 'ux'])
		})

		it('parses @due with ISO date', () => {
			const attrs = parseAttributes(['@due: 2026-03-01'])
			expect(attrs.dueDate).toBe('2026-03-01')
		})

		it('parses @due with relative date', () => {
			const attrs = parseAttributes(['@due: +2w'])
			expect(attrs.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
		})
	})

	describe('compact bracket strategy', () => {
		it('parses arrow assignment', () => {
			const attrs = parseAttributes(['[Cody Jones → Austin Lowell | 3d | due: 2/24/2026]'])
			expect(attrs.author).toBe('Cody Jones')
			expect(attrs.assignee).toBe('Austin Lowell')
			expect(attrs.dueDate).toBe('2026-02-24')
		})

		it('parses hour-based debt', () => {
			const attrs = parseAttributes(['[8h | compounding: high]'])
			expect(attrs.debt).toEqual({ hours: 8, compounding: 'high' })
		})

		it('parses priority shorthand', () => {
			const attrs = parseAttributes(['[critical]'])
			expect(attrs.priority).toBe('critical')
		})
	})

	describe('key-value strategy', () => {
		it('parses Priority: value', () => {
			const attrs = parseAttributes(['Priority: high'])
			expect(attrs.priority).toBe('high')
		})

		it('parses Tags: comma-separated', () => {
			const attrs = parseAttributes(['Tags: ui, backend, api'])
			expect(attrs.tags).toEqual(['ui', 'backend', 'api'])
		})

		it('parses Risk: value', () => {
			const attrs = parseAttributes(['Risk: severe'])
			expect(attrs.risk).toBe('severe')
		})

		it('parses Blocks relationship', () => {
			const attrs = parseAttributes(['Blocks: N-abc123, N-def456'])
			expect(attrs.relationships).toEqual(['N-abc123', 'N-def456'])
		})
	})

	describe('performance impact', () => {
		it('parses performance notation', () => {
			const attrs = parseAttributes(['Performance: 2000ms->100ms'])
			expect(attrs.performance).toEqual({ before: '2000ms', after: '100ms', unit: 'ms' })
		})
	})

	describe('technical debt', () => {
		it('parses debt with compounding', () => {
			const attrs = parseAttributes(['Debt: 8h | compounding: high'])
			expect(attrs.debt).toEqual({ hours: 8, compounding: 'high' })
		})

		it('parses debt without compounding', () => {
			const attrs = parseAttributes(['Debt: 4h'])
			expect(attrs.debt).toEqual({ hours: 4, compounding: 'low' })
		})
	})

	describe('edge cases', () => {
		it('handles empty body', () => {
			const attrs = parseAttributes([])
			expect(attrs.tags).toEqual([])
			expect(attrs.relationships).toEqual([])
		})

		it('handles blank lines', () => {
			const attrs = parseAttributes(['', '  ', '@author: Test'])
			expect(attrs.author).toBe('Test')
		})
	})
})
