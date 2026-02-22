import type { Notation } from '../types'
import { MarkerType, Priority, RiskLevel, Status } from '../types/enums'
import { detectCircularDependencies } from './relationship-manager'

export interface ValidationError {
	notationId: string
	field: string
	message: string
}

const VALID_TYPES = new Set(Object.values(MarkerType))
const VALID_PRIORITIES = new Set(Object.values(Priority))
const VALID_RISKS = new Set(Object.values(RiskLevel))
const VALID_STATUSES = new Set(Object.values(Status))

export function validateNotation(notation: Notation): ValidationError[] {
	const errors: ValidationError[] = []

	if (!notation.id) {
		errors.push({ notationId: notation.id, field: 'id', message: 'Missing id' })
	}
	if (!VALID_TYPES.has(notation.type)) {
		errors.push({ notationId: notation.id, field: 'type', message: `Invalid type: ${notation.type}` })
	}
	if (!notation.description) {
		errors.push({ notationId: notation.id, field: 'description', message: 'Missing description' })
	}
	if (!notation.location?.file) {
		errors.push({ notationId: notation.id, field: 'location', message: 'Missing file location' })
	}
	if (!VALID_STATUSES.has(notation.status)) {
		errors.push({ notationId: notation.id, field: 'status', message: `Invalid status: ${notation.status}` })
	}
	if (notation.priority && !VALID_PRIORITIES.has(notation.priority)) {
		errors.push({ notationId: notation.id, field: 'priority', message: `Invalid priority: ${notation.priority}` })
	}
	if (notation.risk && !VALID_RISKS.has(notation.risk)) {
		errors.push({ notationId: notation.id, field: 'risk', message: `Invalid risk: ${notation.risk}` })
	}

	return errors
}

export function validateAll(notations: Notation[]): ValidationError[] {
	const errors: ValidationError[] = []
	const idSet = new Set<string>()

	for (const n of notations) {
		errors.push(...validateNotation(n))

		if (idSet.has(n.id)) {
			errors.push({ notationId: n.id, field: 'id', message: `Duplicate id: ${n.id}` })
		}
		idSet.add(n.id)

		// Check reference integrity
		for (const rel of n.relationships) {
			if (!notations.some((other) => other.id === rel)) {
				errors.push({ notationId: n.id, field: 'relationships', message: `Unknown reference: ${rel}` })
			}
		}
	}

	// Check circular dependencies
	const cycles = detectCircularDependencies(notations)
	for (const cycle of cycles) {
		errors.push({
			notationId: cycle[0],
			field: 'relationships',
			message: `Circular dependency: ${cycle.join(' → ')}`,
		})
	}

	return errors
}
