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
	SecurityGateConfig,
	IntegrationsConfig,
} from './types'
export { DEFAULT_CONFIG } from './types'

// Utils
export { generateId, generateStableId, parseDate, isOverdue } from './utils'

// Storage
export { JsonlStorage, SnapshotStorage } from './storage'
export { loadConfig, loadSecrets } from './storage'
export type { Snapshot, ResolvedSecrets } from './storage'

// Scanner
export { parseAttributes, parseActions, parseFileContent, scanFiles } from './scanner'
export type { ParsedAttributes } from './scanner'

// Manager
export { NotationManager } from './manager'
export { getBlockers, isBlocked, detectCircularDependencies } from './manager'
export { updateStatus, addTag, removeTag, setAssignee } from './manager'
export { validateNotation, validateAll, computeStats, computeHealthScore, computeBurnDown } from './manager'
export type { ValidationError, BurnDownData, BurnDownPoint } from './manager'

// Executor
export { executeAction, registerActionHandler } from './executor'
export type { ActionResult, ActionHandler } from './executor'
export { handleReplace, handleRemove, handleRename, handleInsert, handleExtract, handleMove, handleWrap } from './executor'

// Governance
export { evaluateSecurityGate, computeDeprecationSummary } from './governance'
export type { GateResult, GateViolation, DeprecationSummary, DeprecationEntry } from './governance'

// Integrations
export { createGitHubIssue } from './integrations'
export { createJiraIssue } from './integrations'
export { suggestFix } from './integrations'
export type { SuggestedFix } from './integrations'

// Dashboard
export { startDashboard } from './dashboard'
export type { DashboardConfig, DashboardServer } from './dashboard'
