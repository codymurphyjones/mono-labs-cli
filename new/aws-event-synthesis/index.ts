import type { Context as LambdaContext } from 'aws-lambda'
import type { Response } from 'express'

// --- Header utilities ---

/** Flatten Node.js IncomingHttpHeaders to Record<string, string> */
export function flattenHeaders(
	headers: Record<string, string | string[] | undefined>
): Record<string, string> {
	const flat: Record<string, string> = {}
	for (const [key, value] of Object.entries(headers)) {
		if (typeof value === 'string') flat[key] = value
		else if (Array.isArray(value)) flat[key] = value.join(', ')
	}
	return flat
}

/** Serialize a request body to string (passthrough if already string, JSON.stringify if object) */
export function serializeBody(body: unknown): string | null {
	if (body === undefined || body === null) return null
	if (typeof body === 'string') return body
	return JSON.stringify(body)
}

/** Convert Express parsed query to Record<string, string | undefined> */
export function extractQueryParams(
	query: Record<string, unknown>
): Record<string, string | undefined> {
	const params: Record<string, string | undefined> = {}
	for (const [key, value] of Object.entries(query)) {
		if (typeof value === 'string') params[key] = value
		else if (value !== undefined) params[key] = String(value)
	}
	return params
}

/** Split a URL into path and raw query string */
export function splitUrl(originalUrl: string): { path: string; queryString: string } {
	const qIndex = originalUrl.indexOf('?')
	if (qIndex === -1) return { path: originalUrl, queryString: '' }
	return {
		path: originalUrl.slice(0, qIndex),
		queryString: originalUrl.slice(qIndex + 1),
	}
}

// --- Mock Lambda context ---

/** Generate a local request ID */
export function generateRequestId(): string {
	return `local-${Date.now()}`
}

/** Create a minimal mock Lambda Context */
export function createMockLambdaContext(functionName?: string): LambdaContext {
	const name = functionName ?? 'local-handler'
	return {
		callbackWaitsForEmptyEventLoop: true,
		functionName: name,
		functionVersion: '$LATEST',
		invokedFunctionArn: `arn:aws:lambda:us-east-1:000000000000:function:${name}`,
		memoryLimitInMB: '128',
		awsRequestId: generateRequestId(),
		logGroupName: `/aws/lambda/${name}`,
		logStreamName: 'local',
		getRemainingTimeInMillis: () => 30_000,
		done: () => {},
		fail: () => {},
		succeed: () => {},
	}
}

// --- Result -> Express response ---

/** Send a Lambda-style result (API Gateway V2 or ALB) back through Express */
export function sendLambdaResult(
	res: Response,
	result: {
		statusCode?: number
		headers?: Record<string, any>
		body?: string
		isBase64Encoded?: boolean
	}
): void {
	const statusCode = result.statusCode ?? 200

	if (result.headers) {
		for (const [key, value] of Object.entries(result.headers)) {
			res.setHeader(key, value)
		}
	}

	if (result.isBase64Encoded && result.body) {
		const buffer = Buffer.from(result.body, 'base64')
		res.status(statusCode).send(buffer)
	} else {
		res.status(statusCode).send(result.body ?? '')
	}
}
