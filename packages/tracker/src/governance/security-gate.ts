import type { Notation, TrackerConfig } from '../types'

export interface GateViolation {
	notationId: string
	description: string
	priority: string
	file: string
	line: number
}

export interface GateResult {
	passed: boolean
	violations: GateViolation[]
	summary: string
}

export function evaluateSecurityGate(notations: Notation[], config: TrackerConfig): GateResult {
	if (!config.securityGate.enabled) {
		return { passed: true, violations: [], summary: 'Security gate disabled' }
	}

	const violations: GateViolation[] = []

	for (const n of notations) {
		if (n.type !== 'SECURITY') continue
		if (n.status === 'resolved') continue

		const isCritical = n.priority === 'critical'
		const isHigh = n.priority === 'high'

		if (isCritical && config.securityGate.blockOnCritical) {
			violations.push({
				notationId: n.id,
				description: n.description,
				priority: 'critical',
				file: n.location.file,
				line: n.location.line,
			})
		}

		if (isHigh && config.securityGate.blockOnHigh) {
			violations.push({
				notationId: n.id,
				description: n.description,
				priority: 'high',
				file: n.location.file,
				line: n.location.line,
			})
		}
	}

	const passed = violations.length === 0
	const summary = passed
		? `Security gate passed (${notations.filter((n) => n.type === 'SECURITY').length} SECURITY notations checked)`
		: `Security gate failed: ${violations.length} blocking violation(s)`

	return { passed, violations, summary }
}
