import type { NotationAction } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleReplace(action: NotationAction): Promise<ActionResult> {
	return {
		success: true,
		message: `Would execute replace: ${action.raw}`,
		verb: 'replace',
	}
}
