import type { Snapshot } from '../storage/snapshot-storage'
import type { Notation } from '../types'

export interface BurnDownPoint {
	date: string
	total: number
	projected?: boolean
}

export interface BurnDownData {
	historical: BurnDownPoint[]
	projection: BurnDownPoint[]
	weeklyResolutionRate: number
	estimatedZeroDate: string | null
}

export function computeBurnDown(snapshots: Snapshot[], currentNotations: Notation[]): BurnDownData {
	const historical: BurnDownPoint[] = snapshots.map((s) => ({
		date: s.date,
		total: s.stats.total,
	}))

	// Add current state
	const today = new Date().toISOString().slice(0, 10)
	const currentTotal = currentNotations.filter((n) => n.status !== 'resolved').length
	if (!historical.find((h) => h.date === today)) {
		historical.push({ date: today, total: currentTotal })
	}

	// Calculate weekly resolution rate from historical data
	const weeklyResolutionRate = computeWeeklyRate(historical)

	// Project forward
	const projection: BurnDownPoint[] = []
	let estimatedZeroDate: string | null = null

	if (weeklyResolutionRate > 0 && historical.length >= 2) {
		let remaining = currentTotal
		const startDate = new Date(today)

		for (let week = 1; week <= 26; week++) { // Project up to 26 weeks
			remaining = Math.max(0, remaining - weeklyResolutionRate)
			const projDate = new Date(startDate)
			projDate.setDate(projDate.getDate() + week * 7)
			const dateStr = projDate.toISOString().slice(0, 10)

			projection.push({ date: dateStr, total: Math.round(remaining), projected: true })

			if (remaining <= 0 && !estimatedZeroDate) {
				estimatedZeroDate = dateStr
				break
			}
		}
	}

	return {
		historical,
		projection,
		weeklyResolutionRate,
		estimatedZeroDate,
	}
}

function computeWeeklyRate(points: BurnDownPoint[]): number {
	if (points.length < 2) return 0

	const first = points[0]
	const last = points[points.length - 1]
	const daysDiff = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)

	if (daysDiff <= 0) return 0

	const totalReduction = first.total - last.total
	if (totalReduction <= 0) return 0

	// Convert daily rate to weekly rate
	const dailyRate = totalReduction / daysDiff
	return Math.round(dailyRate * 7 * 100) / 100
}
