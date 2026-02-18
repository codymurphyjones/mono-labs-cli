import type { Context } from 'aws-lambda'
import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyStructuredResultV2,
	ALBEvent,
	ALBResult,
} from 'aws-lambda'

// --- Handler types ---

export type ApiGatewayHandler = (
	event: APIGatewayProxyEventV2,
	context: Context,
) => Promise<APIGatewayProxyStructuredResultV2>

export type ALBHandler = (
	event: ALBEvent,
	context: Context,
) => Promise<ALBResult>

// --- Lambda options (discriminated) ---

export interface LambdaOptionsApiGateway {
	eventType?: 'api-gateway'
}

export interface LambdaOptionsALB {
	eventType: 'alb'
}

// --- Server config ---

export interface LocalServerConfig {
	debug?: boolean
	useRedis?: boolean
}
