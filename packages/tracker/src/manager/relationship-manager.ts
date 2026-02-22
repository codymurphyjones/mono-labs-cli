import type { Notation } from '../types'

export function getBlockers(notation: Notation, allNotations: Notation[]): Notation[] {
	const idSet = new Set(notation.relationships)
	return allNotations.filter((n) => idSet.has(n.id) && n.status !== 'resolved')
}

export function isBlocked(notation: Notation, allNotations: Notation[]): boolean {
	return getBlockers(notation, allNotations).length > 0
}

export function detectCircularDependencies(notations: Notation[]): string[][] {
	const idToRelationships = new Map<string, string[]>()
	for (const n of notations) {
		idToRelationships.set(n.id, n.relationships)
	}

	const cycles: string[][] = []
	const visited = new Set<string>()
	const inStack = new Set<string>()

	function dfs(id: string, path: string[]): void {
		if (inStack.has(id)) {
			const cycleStart = path.indexOf(id)
			if (cycleStart !== -1) {
				cycles.push(path.slice(cycleStart).concat(id))
			}
			return
		}
		if (visited.has(id)) return

		visited.add(id)
		inStack.add(id)
		path.push(id)

		const deps = idToRelationships.get(id) ?? []
		for (const dep of deps) {
			dfs(dep, [...path])
		}

		inStack.delete(id)
	}

	for (const n of notations) {
		if (!visited.has(n.id)) {
			dfs(n.id, [])
		}
	}

	return cycles
}
