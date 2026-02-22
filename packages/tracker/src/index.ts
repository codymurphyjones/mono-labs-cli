// Types
export { MarkerType, Priority, RiskLevel, Status, CompoundingRate } from './types'
export { ActionVerbEnum as ActionVerb } from './types'
export type {
	Notation,
	SourceLocation,
	PerformanceImpact,
	TechnicalDebt,
	NotationQuery,
	NotationStats,
	NotationAction,
	ActionArgs,
	ReplaceArgs,
	RemoveArgs,
	RenameArgs,
	InsertArgs,
	ExtractArgs,
	MoveArgs,
	WrapInArgs,
	GenericArgs,
	TrackerConfig,
} from './types'
export { DEFAULT_CONFIG } from './types'

// Utils
export { generateId, generateStableId, parseDate, isOverdue } from './utils'

// Storage
export { JsonlStorage } from './storage'
export { loadConfig } from './storage'

// Scanner
export { parseAttributes, parseActions, parseFileContent, scanFiles } from './scanner'
export type { ParsedAttributes } from './scanner'

// Manager
export { NotationManager } from './manager'
export { getBlockers, isBlocked, detectCircularDependencies } from './manager'
export { updateStatus, addTag, removeTag, setAssignee } from './manager'
export { validateNotation, validateAll, computeStats } from './manager'
export type { ValidationError } from './manager'

// Executor
export { executeAction, registerActionHandler } from './executor'
export type { ActionResult, ActionHandler } from './executor'
export { handleReplace, handleRemove, handleRename } from './executor'
