import type { Request } from 'express'
import type { APIGatewayProxyEventV2, ALBEvent } from 'aws-lambda'

import {
	flattenHeaders,
	serializeBody,
	extractQueryParams,
	splitUrl,
	generateRequestId,
} from '../aws-event-synthesis'

/** Synthesize an API Gateway V2 event from an Express request */
export function synthesizeApiGatewayEvent(req: Request): APIGatewayProxyEventV2 {
	const headers = flattenHeaders(req.headers)
	const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
	const body = hasBody ? serializeBody(req.body) : null
	const queryParams = extractQueryParams(req.query as Record<string, unknown>)
	const { path, queryString } = splitUrl(req.originalUrl)
	const requestId = generateRequestId()
	const now = Date.now()

	return {
		version: '2.0',
		routeKey: `$default`,
		rawPath: path,
		rawQueryString: queryString,
		headers,
		queryStringParameters: Object.keys(queryParams).length > 0 ? queryParams as Record<string, string> : undefined,
		requestContext: {
			accountId: 'local',
			apiId: 'local',
			domainName: req.hostname ?? 'localhost',
			domainPrefix: 'local',
			http: {
				method: req.method,
				path,
				protocol: req.protocol ?? 'HTTP/1.1',
				sourceIp: req.ip ?? '127.0.0.1',
				userAgent: req.headers['user-agent'] ?? '',
			},
			requestId,
			routeKey: '$default',
			stage: 'local',
			time: new Date(now).toISOString(),
			timeEpoch: now,
		},
		body: body ?? undefined,
		isBase64Encoded: false,
	}
}

/** Synthesize an ALB event from an Express request */
export function synthesizeALBEvent(req: Request): ALBEvent {
	const headers = flattenHeaders(req.headers)
	const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
	const body = hasBody ? serializeBody(req.body) : null
	const queryParams = extractQueryParams(req.query as Record<string, unknown>)
	const { path } = splitUrl(req.originalUrl)

	return {
		requestContext: {
			elb: {
				targetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:000000000000:targetgroup/local/local',
			},
		},
		httpMethod: req.method,
		path,
		headers,
		queryStringParameters: queryParams as Record<string, string | undefined>,
		body: body ?? '',
		isBase64Encoded: false,
	}
}
