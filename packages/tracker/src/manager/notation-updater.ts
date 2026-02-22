import type { Notation, Status } from '../types'

export function updateStatus(notation: Notation, status: Status): Notation {
	return { ...notation, status }
}

export function addTag(notation: Notation, tag: string): Notation {
	if (notation.tags.includes(tag)) return notation
	return { ...notation, tags: [...notation.tags, tag] }
}

export function removeTag(notation: Notation, tag: string): Notation {
	return { ...notation, tags: notation.tags.filter((t) => t !== tag) }
}

export function setAssignee(notation: Notation, assignee: string): Notation {
	return { ...notation, assignee }
}
