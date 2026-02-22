import type { NotationAction, ActionArgs } from '../types'
import { ActionVerb } from '../types/action'

function parseChainedCalls(raw: string): Array<{ method: string; args: string[] }> {
	const calls: Array<{ method: string; args: string[] }> = []
	const regex = /(\w+)\(([^)]*)\)/g
	let match: RegExpExecArray | null
	while ((match = regex.exec(raw)) !== null) {
		const method = match[1]
		const argStr = match[2].trim()
		const args = argStr
			? argStr.split(',').map((a) => a.trim().replace(/^['"]|['"]$/g, ''))
			: []
		calls.push({ method, args })
	}
	return calls
}

function buildActionArgs(calls: Array<{ method: string; args: string[] }>): ActionArgs | null {
	if (calls.length === 0) return null

	const primary = calls[0]
	const verb = primary.method.toLowerCase()

	switch (verb) {
		case 'replace':
			return {
				verb: ActionVerb.REPLACE,
				target: primary.args[0] ?? '',
				replacement: primary.args[1] ?? '',
			}
		case 'remove':
			return {
				verb: ActionVerb.REMOVE,
				target: primary.args[0] ?? '',
			}
		case 'rename':
			return {
				verb: ActionVerb.RENAME,
				from: primary.args[0] ?? '',
				to: primary.args[1] ?? '',
			}
		case 'insert': {
			const posCall = calls.find((c) => c.method === 'before' || c.method === 'after')
			return {
				verb: ActionVerb.INSERT,
				content: primary.args[0] ?? '',
				position: (posCall?.method as 'before' | 'after') ?? 'after',
				anchor: posCall?.args[0] ?? '',
			}
		}
		case 'extract': {
			const toCall = calls.find((c) => c.method === 'to')
			return {
				verb: ActionVerb.EXTRACT,
				target: primary.args[0] ?? '',
				destination: toCall?.args[0] ?? '',
			}
		}
		case 'move': {
			const toCall = calls.find((c) => c.method === 'to')
			return {
				verb: ActionVerb.MOVE,
				target: primary.args[0] ?? '',
				destination: toCall?.args[0] ?? '',
			}
		}
		case 'wrapin':
		case 'wrap': {
			return {
				verb: ActionVerb.WRAP_IN,
				target: primary.args[0] ?? '',
				wrapper: primary.args[1] ?? calls[1]?.args[0] ?? '',
			}
		}
		default:
			return {
				verb: ActionVerb.GENERIC,
				description: calls.map((c) => `${c.method}(${c.args.join(', ')})`).join('.'),
			}
	}
}

export function parseActions(bodyLines: string[]): NotationAction[] {
	const actions: NotationAction[] = []

	for (const line of bodyLines) {
		const trimmed = line.trim()
		const actionMatch = trimmed.match(/^Action:\s*(.+)$/i)
		if (!actionMatch) continue

		const raw = actionMatch[1]
		const calls = parseChainedCalls(raw)
		const args = buildActionArgs(calls)

		if (args) {
			actions.push({ verb: args.verb as any, raw, args })
		}
	}

	return actions
}
