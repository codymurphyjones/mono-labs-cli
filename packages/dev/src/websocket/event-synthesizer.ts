import type { APIGatewayProxyEvent } from 'aws-lambda'
import type http from 'node:http'
import type { ConnectionId, LocalRequestContext } from './types'

const EMPTY_MULTI_VALUE: Record<string, string[]> = {}
const EMPTY_HEADERS: Record<string, string> = {}

/** Creates a minimal APIGatewayProxyEvent shell with the given requestContext fields */
function baseEvent(
	requestContext: Partial<APIGatewayProxyEvent['requestContext']>,
	overrides?: Partial<APIGatewayProxyEvent>
): APIGatewayProxyEvent {
	return {
		body: null,
		headers: EMPTY_HEADERS,
		multiValueHeaders: EMPTY_MULTI_VALUE,
		httpMethod: 'GET',
		isBase64Encoded: false,
		path: '',
		pathParameters: null,
		queryStringParameters: null,
		multiValueQueryStringParameters: null,
		stageVariables: null,
		resource: '',
		requestContext: {
			accountId: 'local',
			apiId: 'local',
			authorizer: null,
			protocol: 'websocket',
			httpMethod: 'GET',
			identity: {
				accessKey: null,
				accountId: null,
				apiKey: null,
				apiKeyId: null,
				caller: null,
				clientCert: null,
				cognitoAuthenticationProvider: null,
				cognitoAuthenticationType: null,
				cognitoIdentityId: null,
				cognitoIdentityPoolId: null,
				principalOrgId: null,
				sourceIp: '127.0.0.1',
				user: null,
				userAgent: null,
				userArn: null,
			},
			path: '',
			stage: 'local',
			requestId: `local-${Date.now()}`,
			requestTimeEpoch: Date.now(),
			resourceId: '',
			resourcePath: '',
			...requestContext,
		},
		...overrides,
	}
}

/** Synthesize a $connect event */
export function synthesizeConnectEvent(
	connectionId: ConnectionId,
	req: http.IncomingMessage,
	config?: { domainName?: string; stage?: string }
): APIGatewayProxyEvent {
	const headers: Record<string, string> = {}
	for (const [key, value] of Object.entries(req.headers)) {
		if (typeof value === 'string') headers[key] = value
		else if (Array.isArray(value)) headers[key] = value.join(', ')
	}

	return baseEvent(
		{
			connectionId,
			domainName: config?.domainName ?? 'localhost',
			stage: config?.stage ?? 'local',
			routeKey: '$connect',
			eventType: 'CONNECT',
		} as any,
		{ headers }
	)
}

/** Synthesize a $disconnect event */
export function synthesizeDisconnectEvent(
	connectionId: ConnectionId,
	config?: { domainName?: string; stage?: string }
): APIGatewayProxyEvent {
	return baseEvent({
		connectionId,
		domainName: config?.domainName ?? 'localhost',
		stage: config?.stage ?? 'local',
		routeKey: '$disconnect',
		eventType: 'DISCONNECT',
	} as any)
}

/** Synthesize a message event with body and routeKey */
export function synthesizeMessageEvent(
	connectionId: ConnectionId,
	body: string,
	routeKey: string,
	config?: { domainName?: string; stage?: string }
): APIGatewayProxyEvent {
	return baseEvent(
		{
			connectionId,
			domainName: config?.domainName ?? 'localhost',
			stage: config?.stage ?? 'local',
			routeKey,
			eventType: 'MESSAGE',
		} as any,
		{ body }
	)
}

/** Build a LocalRequestContext from parameters */
export function buildRequestContext(
	connectionId: ConnectionId,
	routeKey: string,
	eventType: LocalRequestContext['eventType'],
	config?: { domainName?: string; stage?: string }
): LocalRequestContext {
	return {
		connectionId,
		domainName: config?.domainName ?? 'localhost',
		stage: config?.stage ?? 'local',
		routeKey,
		eventType,
	}
}
