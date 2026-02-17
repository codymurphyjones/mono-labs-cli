import { cacheRelay } from '@my/services/backend/cacheRelay'
import type { ActionHandler } from '../types'

interface SendMessageBody {
	action: string
	senderId: string
	recipientId: string
	message: string
}

/**
 * Local implementation of the `sendMessage` route.
 * Replicates logic from packages/backend/src/websocket/message.ts
 * but uses ctx.postToConnection() instead of ApiGatewayManagementApiClient.
 */
export const sendMessageHandler: ActionHandler = async (body, ctx) => {
	const parsed: SendMessageBody = JSON.parse(body)
	const { senderId, recipientId, message } = parsed

	console.log('[sendMessage] body:', parsed)

	cacheRelay.set('userId', senderId)

	if (!recipientId) {
		return { statusCode: 400, body: JSON.stringify({ error: 'Missing recipientId' }) }
	}

	try {
		await ctx.postToConnection(recipientId, JSON.stringify({ senderId, message }))
	} catch (err: unknown) {
		if (err instanceof Error && (err as any).statusCode === 410) {
			return { statusCode: 410, body: JSON.stringify({ error: 'Recipient not connected' }) }
		}
		console.error('[sendMessage] Error sending message:', err)
		return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send message' }) }
	}

	return { statusCode: 200, body: JSON.stringify({ message: 'Message sent successfully' }) }
}
