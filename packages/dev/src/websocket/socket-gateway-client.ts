import type { ConnectionId, PostToConnectionFn } from './types'
import type { ConnectionRegistry } from './connection-registry'

/**
 * Unified gateway client that auto-detects local vs production mode.
 *
 * - Pass a `ConnectionRegistry` → local mode (sends via in-memory WebSocket)
 * - Pass a URL string → API Gateway mode (sends via AWS SDK PostToConnectionCommand)
 */
export class SocketGatewayClient {
	private mode: 'local' | 'apigateway'
	private registry?: ConnectionRegistry
	private endpoint?: string

	constructor(backend: ConnectionRegistry | string) {
		if (typeof backend === 'string') {
			this.mode = 'apigateway'
			this.endpoint = backend
		} else {
			this.mode = 'local'
			this.registry = backend
		}
	}

	async postToConnection(connectionId: ConnectionId, data: unknown): Promise<void> {
		if (this.mode === 'local') {
			return this.postLocal(connectionId, data)
		}
		return this.postApiGateway(connectionId, data)
	}

	private async postLocal(connectionId: ConnectionId, data: unknown): Promise<void> {
		const { WebSocket } = require('ws') as typeof import('ws')
		const ws = this.registry!.get(connectionId)

		if (!ws || ws.readyState !== WebSocket.OPEN) {
			const error = new Error(`GoneException: Connection ${connectionId} is no longer available`)
			;(error as any).statusCode = 410
			;(error as any).name = 'GoneException'
			throw error
		}

		const payload = typeof data === 'string' ? data : JSON.stringify(data)
		ws.send(payload)
	}

	private async postApiGateway(connectionId: ConnectionId, data: unknown): Promise<void> {
		let ApiGatewayManagementApiClient: any, PostToConnectionCommand: any
		try {
			const mod = require('@aws-sdk/client-apigatewaymanagementapi')
			ApiGatewayManagementApiClient = mod.ApiGatewayManagementApiClient
			PostToConnectionCommand = mod.PostToConnectionCommand
		} catch {
			throw new Error(
				'API Gateway mode requires "@aws-sdk/client-apigatewaymanagementapi". '
				+ 'Install it with: npm install @aws-sdk/client-apigatewaymanagementapi'
			)
		}

		const client = new ApiGatewayManagementApiClient({ endpoint: this.endpoint })
		const payload = typeof data === 'string' ? data : JSON.stringify(data)

		try {
			await client.send(new PostToConnectionCommand({
				ConnectionId: connectionId,
				Data: new TextEncoder().encode(payload),
			}))
		} catch (err: any) {
			if (err.name === 'GoneException' || err.$metadata?.httpStatusCode === 410) {
				const error = new Error(`GoneException: Connection ${connectionId} is no longer available`)
				;(error as any).statusCode = 410
				;(error as any).name = 'GoneException'
				throw error
			}
			throw err
		}
	}

	/** Returns a bound PostToConnectionFn for dependency injection */
	asFunction(): PostToConnectionFn {
		return this.postToConnection.bind(this)
	}
}
