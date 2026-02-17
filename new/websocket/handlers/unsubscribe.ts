import { unsubscribeFromChannel } from '../../../websocket/channel-registry'
import type { ActionHandler } from '../types'

interface UnsubscribeBody {
	action: string
	channel: string
}

/**
 * Handler for the `unsubscribe` action.
 * Unsubscribes the connection from a channel.
 */
export const unsubscribeHandler: ActionHandler = async (body, ctx) => {
	const parsed: UnsubscribeBody = JSON.parse(body)
	const { channel } = parsed

	if (!channel || typeof channel !== 'string') {
		return { statusCode: 400, body: JSON.stringify({ error: 'Missing "channel" field' }) }
	}

	await unsubscribeFromChannel(ctx.connectionId, channel)

	return { statusCode: 200, body: JSON.stringify({ action: 'unsubscribed', channel }) }
}
