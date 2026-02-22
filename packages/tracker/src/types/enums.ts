export const MarkerType = {
	TODO: 'TODO',
	FIXME: 'FIXME',
	BUG: 'BUG',
	HACK: 'HACK',
	NOTE: 'NOTE',
	OPTIMIZE: 'OPTIMIZE',
	SECURITY: 'SECURITY',
} as const
export type MarkerType = (typeof MarkerType)[keyof typeof MarkerType]

export const Priority = {
	MINIMAL: 'minimal',
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
	CRITICAL: 'critical',
} as const
export type Priority = (typeof Priority)[keyof typeof Priority]

export const RiskLevel = {
	MINIMAL: 'minimal',
	LOW: 'low',
	MODERATE: 'moderate',
	SEVERE: 'severe',
	CRITICAL: 'critical',
} as const
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]

export const Status = {
	OPEN: 'open',
	IN_PROGRESS: 'in_progress',
	BLOCKED: 'blocked',
	RESOLVED: 'resolved',
} as const
export type Status = (typeof Status)[keyof typeof Status]

export const CompoundingRate = {
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
} as const
export type CompoundingRate = (typeof CompoundingRate)[keyof typeof CompoundingRate]
