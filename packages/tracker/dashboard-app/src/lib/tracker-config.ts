// ── Tailwind-class-based color mappings ──────────────────────────────────────
// Replaces constants.ts hex-based config with Tailwind utility classes.

export interface TypeColorConfig {
  color: string       // text color class
  bgColor: string     // background color class (with opacity)
  borderColor: string // border color class (with opacity)
}

export const TYPE_CONFIG: Record<string, TypeColorConfig> = {
  TODO:        { color: 'text-blue-600 dark:text-blue-300',    bgColor: 'bg-blue-500/15',    borderColor: 'border-blue-500/30' },
  FIXME:       { color: 'text-amber-600 dark:text-amber-300',   bgColor: 'bg-amber-500/15',   borderColor: 'border-amber-500/30' },
  BUG:         { color: 'text-red-400',     bgColor: 'bg-red-500/15',     borderColor: 'border-red-500/30' },
  HACK:        { color: 'text-orange-600 dark:text-orange-300',  bgColor: 'bg-orange-500/15',  borderColor: 'border-orange-500/30' },
  NOTE:        { color: 'text-slate-600 dark:text-slate-300',   bgColor: 'bg-slate-500/15',   borderColor: 'border-slate-500/30' },
  OPTIMIZE:    { color: 'text-cyan-600 dark:text-cyan-300',    bgColor: 'bg-cyan-500/15',    borderColor: 'border-cyan-500/30' },
  SECURITY:    { color: 'text-rose-400',    bgColor: 'bg-rose-500/15',    borderColor: 'border-rose-500/30' },
  TICKET:      { color: 'text-violet-600 dark:text-violet-300',  bgColor: 'bg-violet-500/15',  borderColor: 'border-violet-500/30' },
  TASK:        { color: 'text-emerald-600 dark:text-emerald-300', bgColor: 'bg-emerald-500/15', borderColor: 'border-emerald-500/30' },
  DEBT:        { color: 'text-yellow-600 dark:text-yellow-300',  bgColor: 'bg-yellow-500/15',  borderColor: 'border-yellow-500/30' },
  REFACTOR:    { color: 'text-indigo-600 dark:text-indigo-300',  bgColor: 'bg-indigo-500/15',  borderColor: 'border-indigo-500/30' },
  DEPRECATION: { color: 'text-pink-600 dark:text-pink-300',    bgColor: 'bg-pink-500/15',    borderColor: 'border-pink-500/30' },
  MIGRATION:   { color: 'text-teal-600 dark:text-teal-300',    bgColor: 'bg-teal-500/15',    borderColor: 'border-teal-500/30' },
  PERF:        { color: 'text-lime-600 dark:text-lime-300',    bgColor: 'bg-lime-500/15',    borderColor: 'border-lime-500/30' },
  TEST:        { color: 'text-sky-600 dark:text-sky-300',     bgColor: 'bg-sky-500/15',     borderColor: 'border-sky-500/30' },
}

export const DEFAULT_TYPE_CONFIG: TypeColorConfig = {
  color: 'text-slate-600 dark:text-slate-300',
  bgColor: 'bg-slate-500/15',
  borderColor: 'border-slate-500/30',
}

export function getTypeConfig(type: string): TypeColorConfig {
  return TYPE_CONFIG[type] || DEFAULT_TYPE_CONFIG
}

// ── Priority Colors ──────────────────────────────────────────────────────────

export interface PriorityColorConfig {
  color: string // text color class
  dot: string   // dot color class (bg-)
}

export const PRIORITY_CONFIG: Record<string, PriorityColorConfig> = {
  critical: { color: 'text-red-400',    dot: 'bg-red-400' },
  high:     { color: 'text-orange-400', dot: 'bg-orange-400' },
  medium:   { color: 'text-yellow-400', dot: 'bg-yellow-400' },
  low:      { color: 'text-blue-400',   dot: 'bg-blue-400' },
  minimal:  { color: 'text-slate-400',  dot: 'bg-slate-500' },
}

export const DEFAULT_PRIORITY_CONFIG: PriorityColorConfig = {
  color: 'text-slate-400',
  dot: 'bg-slate-500',
}

export function getPriorityConfig(priority: string): PriorityColorConfig {
  return PRIORITY_CONFIG[priority] || DEFAULT_PRIORITY_CONFIG
}

// ── Status Colors ────────────────────────────────────────────────────────────

export interface StatusColorConfig {
  color: string // text color class
  dot: string   // dot color class (bg-)
  label: string // display label
}

export const STATUS_CONFIG: Record<string, StatusColorConfig> = {
  open:        { color: 'text-blue-400',    dot: 'bg-blue-400',    label: 'Open' },
  in_progress: { color: 'text-amber-400',   dot: 'bg-amber-400',   label: 'In Progress' },
  blocked:     { color: 'text-red-400',     dot: 'bg-red-400',     label: 'Blocked' },
  resolved:    { color: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Resolved' },
}

export const DEFAULT_STATUS_CONFIG: StatusColorConfig = {
  color: 'text-slate-400',
  dot: 'bg-slate-500',
  label: 'Unknown',
}

export function getStatusConfig(status: string): StatusColorConfig {
  return STATUS_CONFIG[status] || DEFAULT_STATUS_CONFIG
}

// ── Action Verb Colors ───────────────────────────────────────────────────────

export const VERB_CONFIG: Record<string, string> = {
  replace: 'text-amber-400',
  remove:  'text-red-400',
  rename:  'text-blue-400',
  insert:  'text-emerald-400',
  extract: 'text-violet-400',
  move:    'text-indigo-400',
  wrapIn:  'text-pink-400',
  generic: 'text-gray-400',
}

export function getVerbColor(verb: string): string {
  return VERB_CONFIG[verb] || VERB_CONFIG.generic
}

// ── Stat Card Accent Borders ─────────────────────────────────────────────────

export const STAT_BORDER_COLORS: Record<string, string> = {
  total:      'border-t-primary',
  overdue:    'border-t-red-500',
  blocked:    'border-t-amber-500',
  debtHours:  'border-t-yellow-500',
  critical:   'border-t-rose-500',
  inProgress: 'border-t-emerald-500',
}
