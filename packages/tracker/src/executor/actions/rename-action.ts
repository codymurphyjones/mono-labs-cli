import type { NotationAction } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleRename(action: NotationAction): Promise<ActionResult> {
	return {
		success: true,
		message: `Would execute rename: ${action.raw}`,
		verb: 'rename',
	}
}
