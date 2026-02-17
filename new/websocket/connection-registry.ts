import type { WebSocket } from 'ws'
import type { ConnectionId } from './types'
import type { WebSocketUserContext } from '../../websocket/types'

/** Generates a unique connection ID (same pattern as socket-real.ts) */
const makeConnectionId = (): ConnectionId =>
	`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/**
 * In-memory connection registry — replaces API Gateway's built-in connection management.
 * Maps connectionId → WebSocket instance and connectionId → user context.
 */
export class ConnectionRegistry {
	private connections = new Map<ConnectionId, WebSocket>()
	private userContexts = new Map<ConnectionId, WebSocketUserContext>()

	/** Register a WebSocket and return its assigned connectionId */
	register(ws: WebSocket): ConnectionId {
		const connectionId = makeConnectionId()
		this.connections.set(connectionId, ws)
		return connectionId
	}

	/** Remove a connection by ID */
	unregister(connectionId: ConnectionId): void {
		this.connections.delete(connectionId)
		this.userContexts.delete(connectionId)
	}

	/** Look up a WebSocket by connectionId */
	get(connectionId: ConnectionId): WebSocket | undefined {
		return this.connections.get(connectionId)
	}

	/** Return all active connectionIds */
	getAll(): ConnectionId[] {
		return Array.from(this.connections.keys())
	}

	/** Store user context for a connection */
	setUserContext(connectionId: ConnectionId, ctx: WebSocketUserContext): void {
		this.userContexts.set(connectionId, ctx)
	}

	/** Retrieve user context for a connection */
	getUserContext(connectionId: ConnectionId): WebSocketUserContext | undefined {
		return this.userContexts.get(connectionId)
	}

	/** Find all connectionIds belonging to a specific user */
	getConnectionsByUserId(userId: string): ConnectionId[] {
		const result: ConnectionId[] = []
		for (const [connId, ctx] of this.userContexts) {
			if (ctx.userId === userId) result.push(connId)
		}
		return result
	}

	/** Find all connectionIds belonging to a specific organization */
	getConnectionsByOrgId(orgId: string): ConnectionId[] {
		const result: ConnectionId[] = []
		for (const [connId, ctx] of this.userContexts) {
			if (ctx.organizationId === orgId) result.push(connId)
		}
		return result
	}
}
