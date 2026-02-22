export function parseDate(input: string): string | null {
	const trimmed = input.trim()

	// Relative date: +2w, +3d, +1m
	const relativeMatch = trimmed.match(/^\+(\d+)([dwmy])$/)
	if (relativeMatch) {
		const amount = parseInt(relativeMatch[1], 10)
		const unit = relativeMatch[2]
		const date = new Date()
		switch (unit) {
			case 'd':
				date.setDate(date.getDate() + amount)
				break
			case 'w':
				date.setDate(date.getDate() + amount * 7)
				break
			case 'm':
				date.setMonth(date.getMonth() + amount)
				break
			case 'y':
				date.setFullYear(date.getFullYear() + amount)
				break
		}
		return date.toISOString().split('T')[0]
	}

	// ISO format: 2026-02-24
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		const parsed = new Date(trimmed + 'T00:00:00')
		if (!isNaN(parsed.getTime())) return trimmed
	}

	// US format: 2/24/2026 or 02/24/2026
	const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
	if (usMatch) {
		const month = usMatch[1].padStart(2, '0')
		const day = usMatch[2].padStart(2, '0')
		const year = usMatch[3]
		const iso = `${year}-${month}-${day}`
		const parsed = new Date(iso + 'T00:00:00')
		if (!isNaN(parsed.getTime())) return iso
	}

	return null
}

export function isOverdue(dateStr: string): boolean {
	const due = new Date(dateStr + 'T23:59:59')
	return due.getTime() < Date.now()
}
