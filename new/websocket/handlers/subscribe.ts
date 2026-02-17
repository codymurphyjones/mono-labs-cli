import { subscribeToChannel } from '../../../websocket/channel-registry'
import type { ActionHandler } from '../types'

interface SubscribeBody {
	action: string
	channel: string
}

/**
 * Handler for the `subscribe` action.
 * Subscribes the connection to a channel for pub/sub.
 */
export const subscribeHandler: ActionHandler = async (body, ctx) => {
	const parsed: SubscribeBody = JSON.parse(body)
	const { channel } = parsed

	if (!channel || typeof channel !== 'string') {
		return { statusCode: 400, body: JSON.stringify({ error: 'Missing "channel" field' }) }
	}

	await subscribeToChannel(ctx.connectionId, channel)

	return { statusCode: 200, body: JSON.stringify({ action: 'subscribed', channel }) }
}
