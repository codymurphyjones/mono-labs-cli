import { describe, it, expect } from 'vitest'
import { parseActions } from './action-parser'

describe('parseActions', () => {
	it('parses replace action', () => {
		const actions = parseActions(['Action: replace(oldFunc, newFunc)'])
		expect(actions).toHaveLength(1)
		expect(actions[0].args).toEqual({
			verb: 'replace',
			target: 'oldFunc',
			replacement: 'newFunc',
		})
	})

	it('parses remove action', () => {
		const actions = parseActions(['Action: remove(deprecatedMethod)'])
		expect(actions).toHaveLength(1)
		expect(actions[0].args).toEqual({
			verb: 'remove',
			target: 'deprecatedMethod',
		})
	})

	it('parses rename action', () => {
		const actions = parseActions(['Action: rename(oldName, newName)'])
		expect(actions).toHaveLength(1)
		expect(actions[0].args).toEqual({
			verb: 'rename',
			from: 'oldName',
			to: 'newName',
		})
	})

	it('parses insert with chained position', () => {
		const actions = parseActions(['Action: insert(validation).before(processData)'])
		expect(actions).toHaveLength(1)
		expect(actions[0].args).toEqual({
			verb: 'insert',
			content: 'validation',
			position: 'before',
			anchor: 'processData',
		})
	})

	it('parses extract with chained to', () => {
		const actions = parseActions(['Action: extract(helperFn).to(utils)'])
		expect(actions).toHaveLength(1)
		expect(actions[0].args).toEqual({
			verb: 'extract',
			target: 'helperFn',
			destination: 'utils',
		})
	})

	it('parses move with chained to', () => {
		const actions = parseActions(['Action: move(Component).to(shared)'])
		expect(actions).toHaveLength(1)
		expect(actions[0].args).toEqual({
			verb: 'move',
			target: 'Component',
			destination: 'shared',
		})
	})

	it('parses wrap action', () => {
		const actions = parseActions(['Action: wrapIn(dangerousCall, tryCatch)'])
		expect(actions).toHaveLength(1)
		expect(actions[0].args).toEqual({
			verb: 'wrapIn',
			target: 'dangerousCall',
			wrapper: 'tryCatch',
		})
	})

	it('handles generic/unknown actions', () => {
		const actions = parseActions(['Action: customAction(arg1)'])
		expect(actions).toHaveLength(1)
		expect(actions[0].args.verb).toBe('generic')
	})

	it('handles multiple actions', () => {
		const actions = parseActions([
			'Action: replace(a, b)',
			'Some other text',
			'Action: remove(c)',
		])
		expect(actions).toHaveLength(2)
	})

	it('ignores non-action lines', () => {
		const actions = parseActions(['This is just a comment', '@author: Someone'])
		expect(actions).toHaveLength(0)
	})

	it('handles empty input', () => {
		const actions = parseActions([])
		expect(actions).toHaveLength(0)
	})

	it('preserves raw action text', () => {
		const actions = parseActions(['Action: replace(foo, bar)'])
		expect(actions[0].raw).toBe('replace(foo, bar)')
	})
})
