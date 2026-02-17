import type { WebSocket, WebSocketServer } from 'ws'

import { connectHandler } from '../../websocket/connect'
import { disconnectHandler } from '../../websocket/disconnect'

import { ActionRouter } from './action-router'
import { ConnectionRegistry } from './connection-registry'
import { buildRequestContext } from './event-synthesizer'
import { LocalGatewayClient } from './local-gateway-client'
import { sendMessageHandler } from './handlers/send-message'
import { receiveMessageHandler } from './handlers/receive-message'
import { subscribeHandler } from './handlers/subscribe'
import { unsubscribeHandler } from './handlers/unsubscribe'
import type { ConnectionId, SocketAdapterConfig } from './types'

export type { ConnectionId, PostToConnectionFn, SocketAdapterConfig } from './types'
export { ConnectionRegistry } from './connection-registry'
export { LocalGatewayClient } from './local-gateway-client'
export { ActionRouter } from './action-router'

/**
 * Attaches a full socket adapter to a WebSocketServer instance.
 * Maps 1:1 to each API Gateway WebSocket event so local dev
 * behaves identically to the deployed system.
 */
export function attachSocketAdapter(wss: WebSocketServer, config?: SocketAdapterConfig) {
	const debug = config?.debug ?? false
	const domainName = config?.domainName ?? 'localhost'
	const stage = config?.stage ?? 'local'

	const connectionRegistry = new ConnectionRegistry()
	const gatewayClient = new LocalGatewayClient(connectionRegistry)
	const postToConnection = gatewayClient.asFunction()
	const actionRouter = new ActionRouter()

	// Register routes (mirrors webSocketApi.addRoute() in CDK config)
	actionRouter.addRoute('sendMessage', sendMessageHandler)
	actionRouter.addRoute('receiveMessage', receiveMessageHandler)
	actionRouter.addRoute('subscribe', subscribeHandler)
	actionRouter.addRoute('unsubscribe', unsubscribeHandler)

	// $default handler for unknown actions
	actionRouter.setDefaultHandler(async (body, ctx) => {
		let action = 'unknown'
		try {
			action = JSON.parse(body).action ?? 'unknown'
		} catch {}
		return {
			statusCode: 400,
			body: JSON.stringify({ error: `Unknown action: ${action}` }),
		}
	})

	// Reverse lookup: WebSocket → connectionId
	const wsToConnectionId = new WeakMap<WebSocket, ConnectionId>()

	wss.on('connection', async (ws: WebSocket, req) => {
		// 1. Extract token from query string
		const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`)
		const token = url.searchParams.get('token') ?? undefined

		// 2. Register connection and assign connectionId
		const connectionId = connectionRegistry.register(ws)
		wsToConnectionId.set(ws, connectionId)

		if (debug) console.log(`[socket-adapter] $connect connectionId=${connectionId}`)
		if (debug) console.log(`[socket-adapter] token ${token ? 'present' : 'MISSING'}`)

		// 3. Authenticate via connectHandler
		const { response, userContext } = await connectHandler(connectionId, { token })
		if (debug) console.log(`[socket-adapter] connectHandler result:`, response)
		if (debug && userContext) {
			console.log(`[socket-adapter] authenticated userId=${userContext.userId} orgId=${userContext.organizationId}`)
		}

		// 4. Reject unauthenticated connections
		if (response.statusCode !== 200 || !userContext) {
			if (debug) console.log(`[socket-adapter] rejected connectionId=${connectionId} status=${response.statusCode}`)
			ws.close(1008, 'Authentication failed')
			connectionRegistry.unregister(connectionId)
			wsToConnectionId.delete(ws)
			return
		}

		// 5. Store user context in the registry
		connectionRegistry.setUserContext(connectionId, userContext)

		// 6. Send welcome message to client
		ws.send(JSON.stringify({ type: 'connected', connectionId, userId: userContext.userId }))
		if (debug) console.log(`[socket-adapter] welcome sent to ${connectionId} userId=${userContext.userId}`)

		// 7. Route incoming messages through ActionRouter
		ws.on('message', async (raw) => {
			const rawBody = raw.toString()

			if (debug) console.log(`[socket-adapter] message from ${connectionId}:`, rawBody)

			const requestContext = buildRequestContext(connectionId, '$default', 'MESSAGE', {
				domainName,
				stage,
			})

			const result = await actionRouter.route(connectionId, rawBody, postToConnection, requestContext, userContext)

			// Send the handler result back to the sender
			if (result.body) {
				ws.send(result.body)
			}
		})

		// 8. Handle disconnect
		ws.on('close', async (code, reason) => {
			if (debug) {
				console.log(
					`[socket-adapter] $disconnect connectionId=${connectionId} code=${code} reason=${reason.toString()}`
				)
			}

			await disconnectHandler(connectionId)
			connectionRegistry.unregister(connectionId)
			wsToConnectionId.delete(ws)
		})
	})

	return {
		postToConnection,
		connectionRegistry,
		actionRouter,
		getConnectionId: (ws: WebSocket) => wsToConnectionId.get(ws),
	}
}
