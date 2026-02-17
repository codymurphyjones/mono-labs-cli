import type { ActionHandler } from '../types'

/**
 * Local implementation of the `receiveMessage` route.
 * Direct translation of apps/deployment/src/receiveMessage.ts.
 */
export const receiveMessageHandler: ActionHandler = async (body, _ctx) => {
	const parsed = JSON.parse(body)
	const message = parsed.message

	console.log('[receiveMessage] message:', message)

	return {
		statusCode: 200,
		body: JSON.stringify({ message: 'Message received successfully!' }),
	}
}
