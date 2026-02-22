import type { NotationAction } from '../types'

export interface ActionResult {
	success: boolean
	message: string
	verb: string
}

export type ActionHandler = (action: NotationAction) => Promise<ActionResult>

const handlers = new Map<string, ActionHandler>()

export function registerActionHandler(verb: string, handler: ActionHandler): void {
	handlers.set(verb, handler)
}

export async function executeAction(action: NotationAction): Promise<ActionResult> {
	const handler = handlers.get(action.verb)
	if (!handler) {
		return {
			success: false,
			message: `No handler registered for verb: ${action.verb}`,
			verb: action.verb,
		}
	}
	return handler(action)
}
