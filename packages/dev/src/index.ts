// Core
export { LocalServer } from './local-server'
export type { ApiGatewayHandler, ALBHandler, LocalServerConfig } from './local-server/types'

// WebSocket
export { attachSocketAdapter } from './websocket'
export { ConnectionRegistry } from './websocket/connection-registry'
export { ActionRouter } from './websocket/action-router'
export { LocalGatewayClient } from './websocket/local-gateway-client'
export type {
	ConnectionId,
	PostToConnectionFn,
	SocketAdapterConfig,
	ConnectHandlerFn,
	DisconnectHandlerFn,
	ActionHandler,
	ActionHandlerContext,
	ActionHandlerResult,
	LocalRequestContext,
	WebSocketUserContext,
} from './websocket/types'
