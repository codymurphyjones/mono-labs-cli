import { WebSocket } from 'ws'
import type { ConnectionRegistry } from './connection-registry'
import type { ConnectionId, PostToConnectionFn } from './types'

/**
 * Local replacement for @aws-sdk/client-apigatewaymanagementapi.
 * Looks up the WebSocket in ConnectionRegistry and sends data directly.
 */
export class LocalGatewayClient {
	constructor(private registry: ConnectionRegistry) {}

	/** Send data to a specific connection. Throws GoneException (410) if not found. */
	async postToConnection(connectionId: ConnectionId, data: unknown): Promise<void> {
		const ws = this.registry.get(connectionId)

		if (!ws || ws.readyState !== WebSocket.OPEN) {
			const error = new Error(`GoneException: Connection ${connectionId} is no longer available`)
			;(error as any).statusCode = 410
			;(error as any).name = 'GoneException'
			throw error
		}

		const payload = typeof data === 'string' ? data : JSON.stringify(data)
		ws.send(payload)
	}

	/** Returns a bound PostToConnectionFn for dependency injection */
	asFunction(): PostToConnectionFn {
		return this.postToConnection.bind(this)
	}
}
