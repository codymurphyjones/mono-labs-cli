import type { WebSocket, WebSocketServer } from 'ws'

import { ActionRouter } from './action-router'
import { ConnectionRegistry } from './connection-registry'
import { buildRequestContext } from './event-synthesizer'
import { LocalGatewayClient } from './local-gateway-client'
import { InMemoryChannelStore, RedisChannelStore } from './channel-store'
import { SocketEmitter } from './socket-emitter'
import { initCacheRelay } from '../cache-relay'
import type { ConnectionId, SocketAdapterConfig } from './types'

export type { ConnectionId, PostToConnectionFn, SocketAdapterConfig, RedisConfig } from './types'
export { ConnectionRegistry } from './connection-registry'
export { LocalGatewayClient } from './local-gateway-client'
export { ActionRouter } from './action-router'
export { InMemoryChannelStore, RedisChannelStore } from './channel-store'
export type { ChannelStore } from './channel-store'
export { SocketEmitter } from './socket-emitter'
export type { EmitTarget } from './socket-emitter'

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

	// Create channel store
	let channelStore = config?.channelStore
	if (!channelStore) {
		if (config?.useRedis) {
			const host = config.redis?.host ?? 'localhost'
			const port = config.redis?.port ?? 6379
			initCacheRelay(`${host}:${port}`)
			channelStore = new RedisChannelStore({ keyPrefix: config.redis?.keyPrefix })
		} else {
			channelStore = new InMemoryChannelStore()
		}
	}

	// Create socket emitter
	const socketEmitter = new SocketEmitter({ postToConnection, connectionRegistry, channelStore })

	// Register consumer-provided routes
	if (config?.routes) {
		for (const [action, handler] of Object.entries(config.routes)) {
			actionRouter.addRoute(action, handler)
		}
	}

	// $default handler for unknown actions
	if (config?.defaultHandler) {
		actionRouter.setDefaultHandler(config.defaultHandler)
	} else {
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
	}

	// Use consumer-provided handlers or sensible defaults
	const connectHandler = config?.connectHandler ?? (async () => ({
		response: { statusCode: 200 },
		userContext: undefined,
	}))

	const disconnectHandler = config?.disconnectHandler ?? (async () => {})

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

		// 4. Reject if connectHandler returns non-200
		if (response.statusCode !== 200) {
			if (debug) console.log(`[socket-adapter] rejected connectionId=${connectionId} status=${response.statusCode}`)
			ws.close(1008, 'Authentication failed')
			connectionRegistry.unregister(connectionId)
			wsToConnectionId.delete(ws)
			return
		}

		// 5. Store user context in the registry (if provided)
		if (userContext) {
			connectionRegistry.setUserContext(connectionId, userContext)
		}

		// 6. Send welcome message to client
		const welcomeMessage: Record<string, unknown> = { type: 'connected', connectionId }
		if (userContext) welcomeMessage.userId = userContext.userId
		ws.send(JSON.stringify(welcomeMessage))
		if (debug) console.log(`[socket-adapter] welcome sent to ${connectionId}${userContext ? ` userId=${userContext.userId}` : ''}`)

		// 7. Route incoming messages through ActionRouter
		ws.on('message', async (raw) => {
			const rawBody = raw.toString()

			if (debug) console.log(`[socket-adapter] message from ${connectionId}:`, rawBody)

			const requestContext = buildRequestContext(connectionId, '$default', 'MESSAGE', {
				domainName,
				stage,
			})

			const resolvedUserContext = userContext ?? connectionRegistry.getUserContext(connectionId) ?? {
				userId: 'anonymous',
				organizationId: 'anonymous',
			}

			const result = await actionRouter.route(connectionId, rawBody, postToConnection, requestContext, resolvedUserContext)

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

			await channelStore.removeAll(connectionId)
			await disconnectHandler(connectionId)
			connectionRegistry.unregister(connectionId)
			wsToConnectionId.delete(ws)
		})
	})

	return {
		postToConnection,
		connectionRegistry,
		actionRouter,
		channelStore,
		socketEmitter,
		getConnectionId: (ws: WebSocket) => wsToConnectionId.get(ws),
	}
}
