import type { NotationAction } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleRemove(action: NotationAction): Promise<ActionResult> {
	return {
		success: true,
		message: `Would execute remove: ${action.raw}`,
		verb: 'remove',
	}
}
