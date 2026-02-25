import { describe, it, expect } from 'vitest'
import { evaluateSecurityGate } from './security-gate'
import type { Notation, TrackerConfig } from '../types'
import { DEFAULT_CONFIG } from '../types'

function makeNotation(overrides: Partial<Notation> = {}): Notation {
	return {
		id: 'N-test',
		type: 'SECURITY',
		description: 'Test security issue',
		body: [],
		codeContext: [],
		location: { file: 'test.ts', line: 1, column: 1 },
		status: 'open',
		tags: [],
		actions: [],
		relationships: [],
		rawBlock: '',
		scannedAt: new Date().toISOString(),
		...overrides,
	}
}

function makeConfig(overrides: Partial<TrackerConfig['securityGate']> = {}): TrackerConfig {
	return {
		...DEFAULT_CONFIG,
		securityGate: { ...DEFAULT_CONFIG.securityGate, ...overrides },
	}
}

describe('evaluateSecurityGate', () => {
	it('returns passed when gate is disabled', () => {
		const result = evaluateSecurityGate(
			[makeNotation({ priority: 'critical' })],
			makeConfig({ enabled: false })
		)
		expect(result.passed).toBe(true)
		expect(result.violations).toHaveLength(0)
	})

	it('passes when no security notations exist', () => {
		const result = evaluateSecurityGate(
			[makeNotation({ type: 'BUG', priority: 'critical' })],
			makeConfig({ enabled: true, blockOnCritical: true })
		)
		expect(result.passed).toBe(true)
	})

	it('fails on critical security notations when blockOnCritical is true', () => {
		const result = evaluateSecurityGate(
			[makeNotation({ priority: 'critical' })],
			makeConfig({ enabled: true, blockOnCritical: true })
		)
		expect(result.passed).toBe(false)
		expect(result.violations).toHaveLength(1)
		expect(result.violations[0].priority).toBe('critical')
	})

	it('passes on high security notations when only blockOnCritical is true', () => {
		const result = evaluateSecurityGate(
			[makeNotation({ priority: 'high' })],
			makeConfig({ enabled: true, blockOnCritical: true, blockOnHigh: false })
		)
		expect(result.passed).toBe(true)
	})

	it('fails on high security notations when blockOnHigh is true', () => {
		const result = evaluateSecurityGate(
			[makeNotation({ priority: 'high' })],
			makeConfig({ enabled: true, blockOnHigh: true })
		)
		expect(result.passed).toBe(false)
		expect(result.violations).toHaveLength(1)
	})

	it('ignores resolved security notations', () => {
		const result = evaluateSecurityGate(
			[makeNotation({ priority: 'critical', status: 'resolved' })],
			makeConfig({ enabled: true, blockOnCritical: true })
		)
		expect(result.passed).toBe(true)
	})

	it('reports multiple violations', () => {
		const result = evaluateSecurityGate(
			[
				makeNotation({ id: 'N-1', priority: 'critical' }),
				makeNotation({ id: 'N-2', priority: 'high' }),
				makeNotation({ id: 'N-3', priority: 'critical' }),
			],
			makeConfig({ enabled: true, blockOnCritical: true, blockOnHigh: true })
		)
		expect(result.passed).toBe(false)
		expect(result.violations).toHaveLength(3)
	})
})
