import { describe, it, expect } from 'vitest'
import { parseFileContent } from './notation-parser'

describe('parseFileContent', () => {
	it('parses a simple TODO', () => {
		const content = '// TODO: Fix this bug'
		const result = parseFileContent('test.ts', content)
		expect(result).toHaveLength(1)
		expect(result[0].type).toBe('TODO')
		expect(result[0].description).toBe('Fix this bug')
	})

	it('parses a FIXME marker', () => {
		const content = '// FIXME: Memory leak in handler'
		const result = parseFileContent('test.ts', content)
		expect(result).toHaveLength(1)
		expect(result[0].type).toBe('FIXME')
	})

	it('parses a BUG marker', () => {
		const content = '// BUG: Null pointer exception'
		const result = parseFileContent('test.ts', content)
		expect(result[0].type).toBe('BUG')
	})

	it('parses a HACK marker', () => {
		const content = '// HACK: Temporary workaround'
		const result = parseFileContent('test.ts', content)
		expect(result[0].type).toBe('HACK')
	})

	it('parses a NOTE marker', () => {
		const content = '// NOTE: This is intentional'
		const result = parseFileContent('test.ts', content)
		expect(result[0].type).toBe('NOTE')
	})

	it('parses an OPTIMIZE marker', () => {
		const content = '// OPTIMIZE: Use batch query'
		const result = parseFileContent('test.ts', content)
		expect(result[0].type).toBe('OPTIMIZE')
	})

	it('parses a SECURITY marker', () => {
		const content = '// SECURITY: Validate input'
		const result = parseFileContent('test.ts', content)
		expect(result[0].type).toBe('SECURITY')
	})

	it('extracts inline id from brackets', () => {
		const content = '// TODO [TASK-123] Implement feature'
		const result = parseFileContent('test.ts', content)
		expect(result[0].id).toBe('TASK-123')
	})

	it('collects continuation comment lines', () => {
		const content = [
			'// TODO: Main description',
			'// @author: Cody Jones',
			'// @priority: high',
		].join('\n')
		const result = parseFileContent('test.ts', content)
		expect(result).toHaveLength(1)
		expect(result[0].body).toHaveLength(2)
		expect(result[0].author).toBe('Cody Jones')
		expect(result[0].priority).toBe('high')
	})

	it('collects code context lines', () => {
		const content = [
			'// TODO: Fix this function',
			'function broken() {',
			'  return null',
			'}',
		].join('\n')
		const result = parseFileContent('test.ts', content)
		expect(result[0].codeContext).toHaveLength(3)
		expect(result[0].codeContext[0]).toBe('function broken() {')
	})

	it('stops code context at blank line', () => {
		const content = [
			'// TODO: Fix this',
			'const x = 1',
			'',
			'const y = 2',
		].join('\n')
		const result = parseFileContent('test.ts', content)
		expect(result[0].codeContext).toHaveLength(1)
	})

	it('parses adjacent markers separately', () => {
		const content = [
			'// TODO: First task',
			'// FIXME: Second task',
		].join('\n')
		const result = parseFileContent('test.ts', content)
		expect(result).toHaveLength(2)
		expect(result[0].type).toBe('TODO')
		expect(result[1].type).toBe('FIXME')
	})

	it('sets correct line numbers (1-indexed)', () => {
		const content = [
			'const x = 1',
			'// TODO: Found on line 2',
			'const y = 2',
		].join('\n')
		const result = parseFileContent('test.ts', content)
		expect(result[0].location.line).toBe(2)
	})

	it('sets correct file path', () => {
		const content = '// TODO: Test'
		const result = parseFileContent('src/app.ts', content)
		expect(result[0].location.file).toBe('src/app.ts')
	})

	it('parses indented markers', () => {
		const content = '    // TODO: Indented task'
		const result = parseFileContent('test.ts', content)
		expect(result).toHaveLength(1)
		expect(result[0].location.column).toBe(5)
	})

	it('parses marker without colon', () => {
		const content = '// TODO Fix without colon'
		const result = parseFileContent('test.ts', content)
		expect(result).toHaveLength(1)
		expect(result[0].description).toBe('Fix without colon')
	})

	it('handles multi-line with actions', () => {
		const content = [
			'// TODO: Refactor handler',
			'// Action: replace(oldFn, newFn)',
		].join('\n')
		const result = parseFileContent('test.ts', content)
		expect(result[0].actions).toHaveLength(1)
		expect(result[0].actions[0].args.verb).toBe('replace')
	})

	it('generates stable ids when no inline id', () => {
		const content = '// TODO: No id here'
		const r1 = parseFileContent('test.ts', content, 'N')
		const r2 = parseFileContent('test.ts', content, 'N')
		expect(r1[0].id).toBe(r2[0].id)
	})

	it('handles empty content', () => {
		const result = parseFileContent('test.ts', '')
		expect(result).toHaveLength(0)
	})

	it('handles content with no markers', () => {
		const content = 'const x = 1\nconst y = 2'
		const result = parseFileContent('test.ts', content)
		expect(result).toHaveLength(0)
	})

	it('preserves raw block', () => {
		const content = [
			'// TODO: Raw block test',
			'// with continuation',
			'const x = 1',
		].join('\n')
		const result = parseFileContent('test.ts', content)
		expect(result[0].rawBlock).toContain('TODO: Raw block test')
		expect(result[0].rawBlock).toContain('with continuation')
		expect(result[0].rawBlock).toContain('const x = 1')
	})
})
