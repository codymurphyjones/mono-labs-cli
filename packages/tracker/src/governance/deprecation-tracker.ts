import type { Notation } from '../types'

export interface DeprecationEntry {
	id: string
	description: string
	eolDate?: string
	replacement?: string
	file: string
	line: number
	status: 'past-eol' | 'approaching-eol' | 'future' | 'unknown'
	daysUntilEol?: number
}

export interface DeprecationSummary {
	total: number
	pastEol: number
	approachingEol: number
	future: number
	unknown: number
	entries: DeprecationEntry[]
}

const APPROACHING_DAYS = 30

export function computeDeprecationSummary(notations: Notation[]): DeprecationSummary {
	const deprecations = notations.filter((n) => n.type === 'DEPRECATION')
	const now = new Date()
	const entries: DeprecationEntry[] = []

	let pastEol = 0
	let approachingEol = 0
	let future = 0
	let unknown = 0

	for (const n of deprecations) {
		const entry: DeprecationEntry = {
			id: n.id,
			description: n.description,
			eolDate: n.eolDate,
			replacement: n.replacement,
			file: n.location.file,
			line: n.location.line,
			status: 'unknown',
		}

		if (!n.eolDate) {
			entry.status = 'unknown'
			unknown++
		} else {
			const eolDate = new Date(n.eolDate + 'T23:59:59')
			const diffMs = eolDate.getTime() - now.getTime()
			const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
			entry.daysUntilEol = diffDays

			if (diffDays < 0) {
				entry.status = 'past-eol'
				pastEol++
			} else if (diffDays <= APPROACHING_DAYS) {
				entry.status = 'approaching-eol'
				approachingEol++
			} else {
				entry.status = 'future'
				future++
			}
		}

		entries.push(entry)
	}

	return {
		total: deprecations.length,
		pastEol,
		approachingEol,
		future,
		unknown,
		entries,
	}
}
