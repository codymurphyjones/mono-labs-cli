import { describe, it, expect, beforeEach } from 'vitest'
import { NotationManager } from './notation-manager'
import { computeStats } from './stats'
import { detectCircularDependencies, isBlocked } from './relationship-manager'
import { updateStatus, addTag, removeTag, setAssignee } from './notation-updater'
import { validateNotation, validateAll } from './validator'
import type { Notation, TrackerConfig } from '../types'

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
		rawBlock: '// TODO: Test',
		scannedAt: '2026-01-01T00:00:00.000Z',
		...overrides,
	} as Notation
}

const testConfig: TrackerConfig = {
	rootDir: '/tmp/test-project',
	include: ['**/*.ts'],
	exclude: ['**/node_modules/**'],
	markers: ['TODO', 'FIXME', 'BUG', 'HACK', 'NOTE', 'OPTIMIZE', 'SECURITY', 'DEPRECATION'],
	storagePath: '/tmp/test-tracker/notations.jsonl',
	snapshotPath: '/tmp/test-tracker/snapshots.jsonl',
	idPrefix: 'N',
	gitBlame: false,
	securityGate: { enabled: false, blockOnCritical: true, blockOnHigh: false },
	integrations: {},
}

describe('NotationManager', () => {
	let manager: NotationManager

	beforeEach(() => {
		manager = new NotationManager(testConfig)
	})

	it('starts empty', () => {
		expect(manager.getAll()).toEqual([])
	})

	it('sets and gets notations', () => {
		const notations = [makeNotation({ id: 'N-1' }), makeNotation({ id: 'N-2' })]
		manager.setAll(notations)
		expect(manager.getAll()).toHaveLength(2)
	})

	it('gets by id', () => {
		manager.setAll([makeNotation({ id: 'N-1', description: 'First' })])
		expect(manager.getById('N-1')?.description).toBe('First')
		expect(manager.getById('N-999')).toBeUndefined()
	})

	it('updates a notation', () => {
		manager.setAll([makeNotation({ id: 'N-1' })])
		const updated = manager.update('N-1', { description: 'Updated' })
		expect(updated).toBe(true)
		expect(manager.getById('N-1')?.description).toBe('Updated')
	})

	it('returns false when updating non-existent id', () => {
		expect(manager.update('N-999', { description: 'nope' })).toBe(false)
	})

	describe('query', () => {
		beforeEach(() => {
			manager.setAll([
				makeNotation({ id: 'N-1', type: 'TODO', priority: 'high', tags: ['ui'], assignee: 'Alice', status: 'open' }),
				makeNotation({ id: 'N-2', type: 'FIXME', priority: 'low', tags: ['api'], assignee: 'Bob', status: 'open' }),
				makeNotation({ id: 'N-3', type: 'BUG', priority: 'critical', tags: ['ui', 'api'], status: 'resolved' }),
				makeNotation({ id: 'N-4', type: 'TODO', dueDate: '2020-01-01', status: 'open' }),
				makeNotation({ id: 'N-5', type: 'TODO', description: 'Search me please', status: 'open' }),
			] as Notation[])
		})

		it('filters by type', () => {
			expect(manager.query({ type: 'TODO' })).toHaveLength(3)
		})

		it('filters by multiple types', () => {
			expect(manager.query({ type: ['TODO', 'BUG'] })).toHaveLength(4)
		})

		it('filters by tags', () => {
			expect(manager.query({ tags: ['ui'] })).toHaveLength(2)
		})

		it('filters by priority', () => {
			expect(manager.query({ priority: 'high' })).toHaveLength(1)
		})

		it('filters by status', () => {
			expect(manager.query({ status: 'resolved' })).toHaveLength(1)
		})

		it('filters by assignee', () => {
			expect(manager.query({ assignee: 'Alice' })).toHaveLength(1)
		})

		it('filters overdue', () => {
			const overdue = manager.query({ overdue: true })
			expect(overdue).toHaveLength(1)
			expect(overdue[0].id).toBe('N-4')
		})

		it('filters by search text', () => {
			const results = manager.query({ search: 'search me' })
			expect(results).toHaveLength(1)
			expect(results[0].id).toBe('N-5')
		})

		it('filters by file', () => {
			manager.setAll([
				makeNotation({ id: 'N-1', location: { file: 'src/app.ts', line: 1, column: 1 } }),
				makeNotation({ id: 'N-2', location: { file: 'src/utils.ts', line: 1, column: 1 } }),
			])
			expect(manager.query({ file: 'app.ts' })).toHaveLength(1)
		})
	})
})

describe('computeStats', () => {
	it('computes correct totals', () => {
		const notations = [
			makeNotation({ id: 'N-1', type: 'TODO', priority: 'high', tags: ['ui'], status: 'open' }),
			makeNotation({ id: 'N-2', type: 'FIXME', priority: 'low', tags: ['api'], status: 'open', debt: { hours: 4, compounding: 'low' } }),
			makeNotation({ id: 'N-3', type: 'TODO', status: 'resolved', assignee: 'Alice', debt: { hours: 8, compounding: 'high' } }),
		] as Notation[]
		const stats = computeStats(notations)
		expect(stats.total).toBe(3)
		expect(stats.byType['TODO']).toBe(2)
		expect(stats.byType['FIXME']).toBe(1)
		expect(stats.byPriority['high']).toBe(1)
		expect(stats.byStatus['open']).toBe(2)
		expect(stats.byTag['ui']).toBe(1)
		expect(stats.byAssignee['Alice']).toBe(1)
		expect(stats.totalDebtHours).toBe(12)
	})
})

describe('relationship-manager', () => {
	it('detects blocked notations', () => {
		const all = [
			makeNotation({ id: 'N-1', status: 'open' }),
			makeNotation({ id: 'N-2', relationships: ['N-1'], status: 'open' }),
		] as Notation[]
		expect(isBlocked(all[1], all)).toBe(true)
		expect(isBlocked(all[0], all)).toBe(false)
	})

	it('not blocked if dependency is resolved', () => {
		const all = [
			makeNotation({ id: 'N-1', status: 'resolved' }),
			makeNotation({ id: 'N-2', relationships: ['N-1'], status: 'open' }),
		] as Notation[]
		expect(isBlocked(all[1], all)).toBe(false)
	})

	it('detects circular dependencies', () => {
		const all = [
			makeNotation({ id: 'N-1', relationships: ['N-2'] }),
			makeNotation({ id: 'N-2', relationships: ['N-1'] }),
		] as Notation[]
		const cycles = detectCircularDependencies(all)
		expect(cycles.length).toBeGreaterThan(0)
	})

	it('returns empty for no cycles', () => {
		const all = [
			makeNotation({ id: 'N-1', relationships: [] }),
			makeNotation({ id: 'N-2', relationships: ['N-1'] }),
		] as Notation[]
		const cycles = detectCircularDependencies(all)
		expect(cycles).toHaveLength(0)
	})
})

describe('notation-updater', () => {
	it('updates status', () => {
		const n = makeNotation({ status: 'open' as any })
		const updated = updateStatus(n, 'resolved')
		expect(updated.status).toBe('resolved')
	})

	it('adds tag', () => {
		const n = makeNotation({ tags: ['a'] })
		const updated = addTag(n, 'b')
		expect(updated.tags).toEqual(['a', 'b'])
	})

	it('does not duplicate tag', () => {
		const n = makeNotation({ tags: ['a'] })
		const updated = addTag(n, 'a')
		expect(updated.tags).toEqual(['a'])
	})

	it('removes tag', () => {
		const n = makeNotation({ tags: ['a', 'b'] })
		const updated = removeTag(n, 'a')
		expect(updated.tags).toEqual(['b'])
	})

	it('sets assignee', () => {
		const n = makeNotation()
		const updated = setAssignee(n, 'Alice')
		expect(updated.assignee).toBe('Alice')
	})
})

describe('validator', () => {
	it('validates a correct notation', () => {
		const errors = validateNotation(makeNotation())
		expect(errors).toHaveLength(0)
	})

	it('catches missing id', () => {
		const errors = validateNotation(makeNotation({ id: '' }))
		expect(errors.some((e) => e.field === 'id')).toBe(true)
	})

	it('catches invalid type', () => {
		const errors = validateNotation(makeNotation({ type: 'INVALID' as any }))
		expect(errors.some((e) => e.field === 'type')).toBe(true)
	})

	it('catches missing description', () => {
		const errors = validateNotation(makeNotation({ description: '' }))
		expect(errors.some((e) => e.field === 'description')).toBe(true)
	})

	it('detects duplicate ids in validateAll', () => {
		const errors = validateAll([makeNotation({ id: 'N-1' }), makeNotation({ id: 'N-1' })])
		expect(errors.some((e) => e.message.includes('Duplicate'))).toBe(true)
	})

	it('detects unknown references', () => {
		const errors = validateAll([makeNotation({ id: 'N-1', relationships: ['N-999'] })])
		expect(errors.some((e) => e.message.includes('Unknown reference'))).toBe(true)
	})
})
