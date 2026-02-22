import type { Priority, RiskLevel, CompoundingRate, PerformanceImpact, TechnicalDebt } from '../types'
import { parseDate } from '../utils'

export interface ParsedAttributes {
	author?: string
	assignee?: string
	priority?: Priority
	risk?: RiskLevel
	tags: string[]
	dueDate?: string
	createdDate?: string
	performance?: PerformanceImpact
	debt?: TechnicalDebt
	relationships: string[]
}

const PRIORITY_MAP: Record<string, Priority> = {
	minimal: 'minimal',
	m1: 'minimal',
	low: 'low',
	l2: 'low',
	medium: 'medium',
	med: 'medium',
	m3: 'medium',
	high: 'high',
	h4: 'high',
	critical: 'critical',
	c5: 'critical',
}

const RISK_MAP: Record<string, RiskLevel> = {
	minimal: 'minimal',
	m1: 'minimal',
	low: 'low',
	l2: 'low',
	moderate: 'moderate',
	mod: 'moderate',
	m3: 'moderate',
	severe: 'severe',
	s2: 'severe',
	critical: 'critical',
	c3: 'critical',
}

function parsePerformance(value: string): PerformanceImpact | undefined {
	const match = value.match(/^(\d+(?:\.\d+)?)\s*(ms|s|us)->(\d+(?:\.\d+)?)\s*(ms|s|us)$/)
	if (!match) return undefined
	return { before: match[1] + match[2], after: match[3] + match[4], unit: match[4] }
}

function parseDebt(value: string): TechnicalDebt | undefined {
	const parts = value.split('|').map((s) => s.trim())
	const hoursMatch = parts[0].match(/^(\d+(?:\.\d+)?)\s*h$/)
	if (!hoursMatch) return undefined
	let compounding: CompoundingRate = 'low'
	for (const part of parts.slice(1)) {
		const compMatch = part.match(/^compounding:\s*(low|medium|high)$/i)
		if (compMatch) compounding = compMatch[1].toLowerCase() as CompoundingRate
	}
	return { hours: parseFloat(hoursMatch[1]), compounding }
}

function applyKeyValue(key: string, value: string, attrs: ParsedAttributes): void {
	const lowerKey = key.toLowerCase().trim()
	switch (lowerKey) {
		case 'author':
			attrs.author = value
			break
		case 'assignee':
			attrs.assignee = value
			break
		case 'priority':
			attrs.priority = PRIORITY_MAP[value.toLowerCase()] ?? undefined
			break
		case 'risk':
			attrs.risk = RISK_MAP[value.toLowerCase()] ?? undefined
			break
		case 'tags':
			attrs.tags.push(...value.split(',').map((t) => t.trim()).filter(Boolean))
			break
		case 'due':
		case 'due date':
		case 'duedate': {
			const parsed = parseDate(value)
			if (parsed) attrs.dueDate = parsed
			break
		}
		case 'created':
		case 'created date':
		case 'createddate': {
			const parsed = parseDate(value)
			if (parsed) attrs.createdDate = parsed
			break
		}
		case 'performance':
			attrs.performance = parsePerformance(value) ?? attrs.performance
			break
		case 'debt':
		case 'technical debt':
			attrs.debt = parseDebt(value) ?? attrs.debt
			break
		case 'compounding':
			if (attrs.debt) {
				const rate = value.toLowerCase() as CompoundingRate
				if (rate === 'low' || rate === 'medium' || rate === 'high') {
					attrs.debt = { ...attrs.debt, compounding: rate }
				}
			}
			break
		case 'blocks':
		case 'blocked by':
		case 'depends on':
		case 'related':
			attrs.relationships.push(...value.split(',').map((r) => r.trim()).filter(Boolean))
			break
	}
}

function parseAtPrefix(line: string, attrs: ParsedAttributes): boolean {
	const match = line.match(/^@(\w+):?\s+(.+)/)
	if (!match) return false
	applyKeyValue(match[1], match[2], attrs)
	return true
}

function parseCompactBracket(line: string, attrs: ParsedAttributes): boolean {
	const match = line.match(/^\[(.+)\]$/)
	if (!match) return false
	const inner = match[1]
	const segments = inner.split('|').map((s) => s.trim())

	for (const seg of segments) {
		// Arrow assignment: "Cody Jones → Austin Lowell"
		const arrowMatch = seg.match(/^(.+?)\s*(?:→|->)+\s*(.+)$/)
		if (arrowMatch) {
			attrs.author = arrowMatch[1].trim()
			attrs.assignee = arrowMatch[2].trim()
			continue
		}

		// Key: value
		const kvMatch = seg.match(/^(\w[\w\s]*?):\s*(.+)$/)
		if (kvMatch) {
			applyKeyValue(kvMatch[1], kvMatch[2], attrs)
			continue
		}

		// Duration shorthand: 3d, 8h, 2w
		const durationMatch = seg.match(/^(\d+[dhwmy])$/)
		if (durationMatch) {
			const debtMatch = seg.match(/^(\d+)h$/)
			if (debtMatch) {
				attrs.debt = { hours: parseInt(debtMatch[1], 10), compounding: 'low' }
			} else {
				const parsed = parseDate('+' + seg)
				if (parsed) attrs.dueDate = parsed
			}
			continue
		}

		// Priority/risk shorthand
		const lower = seg.toLowerCase()
		if (PRIORITY_MAP[lower]) {
			attrs.priority = PRIORITY_MAP[lower]
		} else if (RISK_MAP[lower]) {
			attrs.risk = RISK_MAP[lower]
		}
	}
	return true
}

function parseKeyValue(line: string, attrs: ParsedAttributes): boolean {
	const match = line.match(/^([A-Z][\w\s]+):\s+(.+)/)
	if (!match) return false
	applyKeyValue(match[1], match[2], attrs)
	return true
}

export function parseAttributes(bodyLines: string[]): ParsedAttributes {
	const attrs: ParsedAttributes = {
		tags: [],
		relationships: [],
	}

	for (const line of bodyLines) {
		const trimmed = line.trim()
		if (!trimmed) continue

		// Try each strategy in order
		if (parseAtPrefix(trimmed, attrs)) continue
		if (parseCompactBracket(trimmed, attrs)) continue
		parseKeyValue(trimmed, attrs)
	}

	return attrs
}
