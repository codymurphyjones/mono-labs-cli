import type {
	ActionHandler,
	ActionHandlerContext,
	ActionHandlerResult,
	ConnectionId,
	LocalRequestContext,
	PostToConnectionFn,
} from './types'
import type { WebSocketUserContext } from '../../websocket/types'

/**
 * Routes incoming WebSocket messages by `action` field — mirrors
 * API Gateway's `$request.body.action` route selection.
 */
export class ActionRouter {
	private routes = new Map<string, ActionHandler>()
	private defaultHandler: ActionHandler | null = null

	/** Register a handler for a specific action (equivalent to webSocketApi.addRoute()) */
	addRoute(action: string, handler: ActionHandler): void {
		this.routes.set(action, handler)
	}

	/** Set the $default handler for unknown actions */
	setDefaultHandler(handler: ActionHandler): void {
		this.defaultHandler = handler
	}

	/** Parse incoming message JSON, extract `action`, and dispatch to the matching handler */
	async route(
		connectionId: ConnectionId,
		rawBody: string,
		postToConnection: PostToConnectionFn,
		requestContext: LocalRequestContext,
		userContext: WebSocketUserContext
	): Promise<ActionHandlerResult> {
		let parsed: { action?: string; [k: string]: unknown }
		try {
			parsed = JSON.parse(rawBody)
		} catch {
			return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
		}

		const action = parsed.action
		if (!action || typeof action !== 'string') {
			return { statusCode: 400, body: JSON.stringify({ error: 'Missing "action" field' }) }
		}

		const handler = this.routes.get(action) ?? this.defaultHandler
		if (!handler) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: `Unknown action: ${action}` }),
			}
		}

		const ctx: ActionHandlerContext = {
			connectionId,
			requestContext: { ...requestContext, routeKey: action },
			postToConnection,
			userContext,
		}

		return handler(rawBody, ctx)
	}
}
