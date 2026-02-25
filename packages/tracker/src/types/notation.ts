import type { MarkerType, Priority, RiskLevel, Status, CompoundingRate } from './enums'
import type { NotationAction } from './action'

export interface SourceLocation {
	file: string
	line: number
	column: number
	endLine?: number
}

export interface PerformanceImpact {
	before: string
	after: string
	unit: string
}

export interface TechnicalDebt {
	hours: number
	compounding: CompoundingRate
}

export interface Notation {
	id: string
	type: MarkerType
	description: string
	body: string[]
	codeContext: string[]
	location: SourceLocation
	author?: string
	assignee?: string
	priority?: Priority
	risk?: RiskLevel
	status: Status
	tags: string[]
	dueDate?: string
	createdDate?: string
	performance?: PerformanceImpact
	debt?: TechnicalDebt
	eolDate?: string
	replacement?: string
	blame?: { author: string; email: string; date: string; commitHash: string }
	linkedIssue?: string
	actions: NotationAction[]
	relationships: string[]
	rawBlock: string
	scannedAt: string
}

export interface NotationQuery {
	type?: MarkerType | MarkerType[]
	tags?: string[]
	priority?: Priority | Priority[]
	status?: Status | Status[]
	file?: string
	assignee?: string
	overdue?: boolean
	blocked?: boolean
	search?: string
	dueBefore?: string
	dueAfter?: string
}

export interface NotationStats {
	total: number
	byType: Record<string, number>
	byPriority: Record<string, number>
	byStatus: Record<string, number>
	byTag: Record<string, number>
	byAssignee: Record<string, number>
	overdue: number
	blocked: number
	totalDebtHours: number
}
