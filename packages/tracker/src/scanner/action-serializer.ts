import type { NotationAction, ActionArgs } from '../types'
import { ActionVerb } from '../types/action'

function serializeArgs(args: ActionArgs): string {
	switch (args.verb) {
		case ActionVerb.REPLACE:
			return `replace(${quote(args.target)}, ${quote(args.replacement)})`
		case ActionVerb.REMOVE:
			return `remove(${quote(args.target)})`
		case ActionVerb.RENAME:
			return `rename(${quote(args.from)}, ${quote(args.to)})`
		case ActionVerb.INSERT: {
			const base = `insert(${quote(args.content)})`
			if (args.anchor) {
				return `${base}.${args.position}(${quote(args.anchor)})`
			}
			return base
		}
		case ActionVerb.EXTRACT: {
			const base = `extract(${quote(args.target)})`
			if (args.destination) {
				return `${base}.to(${quote(args.destination)})`
			}
			return base
		}
		case ActionVerb.MOVE: {
			const base = `move(${quote(args.target)})`
			if (args.destination) {
				return `${base}.to(${quote(args.destination)})`
			}
			return base
		}
		case ActionVerb.WRAP_IN:
			return `wrapIn(${quote(args.target)}, ${quote(args.wrapper)})`
		case ActionVerb.GENERIC:
			return args.description
		default:
			return ''
	}
}

function quote(s: string): string {
	if (s.includes("'")) {
		return `"${s}"`
	}
	return `'${s}'`
}

export function serializeAction(action: NotationAction): string {
	return `Action: ${serializeArgs(action.args)}`
}

export function serializeActions(actions: NotationAction[]): string[] {
	return actions.map((a) => `// ${serializeAction(a)}`)
}
