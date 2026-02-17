import type { WebSocket } from 'ws'
import type { WebSocketMessage } from '@my/types/websockets'
import type { WebSocketUserContext } from '../../websocket/types'

export type { WebSocketMessage }

/** Unique identifier for a WebSocket connection (mirrors API Gateway connectionId) */
export type ConnectionId = string

/** Function signature for sending data to a connection (replaces PostToConnectionCommand) */
export type PostToConnectionFn = (connectionId: ConnectionId, data: unknown) => Promise<void>

/** Synthesized equivalent of event.requestContext for local dev */
export interface LocalRequestContext {
	connectionId: ConnectionId
	domainName: string
	stage: string
	routeKey: string
	eventType: 'CONNECT' | 'DISCONNECT' | 'MESSAGE'
}

/** Context passed to action handlers */
export interface ActionHandlerContext {
	connectionId: ConnectionId
	requestContext: LocalRequestContext
	postToConnection: PostToConnectionFn
	userContext: WebSocketUserContext
}

/** Result returned from an action handler */
export interface ActionHandlerResult {
	statusCode: number
	body?: string
}

/** Handler function for a routed action */
export type ActionHandler = (
	body: string,
	ctx: ActionHandlerContext
) => Promise<ActionHandlerResult>

/** Configuration for the socket adapter */
export interface SocketAdapterConfig {
	domainName?: string
	stage?: string
	debug?: boolean
}
