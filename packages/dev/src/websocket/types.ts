import type { WebSocket } from 'ws'

/** User context attached to a WebSocket connection */
export interface WebSocketUserContext {
	userId: string
	organizationId: string
	[key: string]: unknown
}

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

/** Handler called on $connect — returns response + optional user context */
export type ConnectHandlerFn = (
	connectionId: ConnectionId,
	params: { token?: string },
) => Promise<{
	response: { statusCode: number; body?: string }
	userContext?: WebSocketUserContext
}>

/** Handler called on $disconnect */
export type DisconnectHandlerFn = (connectionId: ConnectionId) => Promise<void>

/** Configuration for the socket adapter */
export interface SocketAdapterConfig {
	domainName?: string
	stage?: string
	debug?: boolean
	connectHandler?: ConnectHandlerFn
	disconnectHandler?: DisconnectHandlerFn
	routes?: Record<string, ActionHandler>
	defaultHandler?: ActionHandler
}
