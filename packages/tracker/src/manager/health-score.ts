import type { Notation } from '../types'

export function computeHealthScore(notations: Notation[]): number {
	let score = 100

	for (const n of notations) {
		if (n.status === 'resolved') continue

		if (n.type === 'HACK') score -= 3
		if (n.type === 'BUG') score -= 4
		if (n.type === 'SECURITY' && n.priority === 'critical') score -= 10
		if (n.type === 'SECURITY' && n.priority === 'high') score -= 5
		if (n.dueDate && new Date(n.dueDate + 'T23:59:59') < new Date()) score -= 2
		if (n.relationships.length > 0) score -= 1
		if (n.type === 'DEPRECATION' && n.eolDate && new Date(n.eolDate) < new Date()) score -= 3
	}

	// Debt hours deduction
	const totalDebt = notations
		.filter((n) => n.status !== 'resolved' && n.debt)
		.reduce((sum, n) => sum + (n.debt?.hours ?? 0), 0)

	if (totalDebt > 40) {
		score -= Math.floor((totalDebt - 40) / 10)
	}

	return Math.max(0, score)
}
