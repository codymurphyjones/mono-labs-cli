import type { Notation, NotationStats } from '../types'
import { isOverdue } from '../utils'
import { isBlocked } from './relationship-manager'

export function computeStats(notations: Notation[]): NotationStats {
	const stats: NotationStats = {
		total: notations.length,
		byType: {},
		byPriority: {},
		byStatus: {},
		byTag: {},
		byAssignee: {},
		overdue: 0,
		blocked: 0,
		totalDebtHours: 0,
	}

	for (const n of notations) {
		stats.byType[n.type] = (stats.byType[n.type] ?? 0) + 1
		stats.byStatus[n.status] = (stats.byStatus[n.status] ?? 0) + 1

		if (n.priority) {
			stats.byPriority[n.priority] = (stats.byPriority[n.priority] ?? 0) + 1
		}

		for (const tag of n.tags) {
			stats.byTag[tag] = (stats.byTag[tag] ?? 0) + 1
		}

		if (n.assignee) {
			stats.byAssignee[n.assignee] = (stats.byAssignee[n.assignee] ?? 0) + 1
		}

		if (n.dueDate && isOverdue(n.dueDate) && n.status !== 'resolved') {
			stats.overdue++
		}

		if (isBlocked(n, notations)) {
			stats.blocked++
		}

		if (n.debt) {
			stats.totalDebtHours += n.debt.hours
		}
	}

	return stats
}
