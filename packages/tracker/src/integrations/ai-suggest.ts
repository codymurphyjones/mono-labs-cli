import https from 'https'
import type { Notation } from '../types'

export interface SuggestedFix {
	explanation: string
	diff: string
	confidence: 'low' | 'medium' | 'high'
}

export async function suggestFix(
	apiKey: string,
	model: string,
	notation: Notation,
	sourceContext: string
): Promise<SuggestedFix> {
	const prompt = buildPrompt(notation, sourceContext)

	const data = JSON.stringify({
		model,
		max_tokens: 2048,
		messages: [
			{
				role: 'user',
				content: prompt,
			},
		],
	})

	const response = await callAnthropicAPI(apiKey, data)
	return parseResponse(response)
}

function buildPrompt(notation: Notation, sourceContext: string): string {
	return `You are a code analysis assistant. A code notation of type "${notation.type}" was found in the source code.

Notation ID: ${notation.id}
Description: ${notation.description}
${notation.body.length > 0 ? `Details:\n${notation.body.join('\n')}` : ''}
File: ${notation.location.file}:${notation.location.line}

Code context around the notation:
\`\`\`
${sourceContext}
\`\`\`

Please suggest a fix for this ${notation.type} notation. Respond in exactly this JSON format:
{
  "explanation": "Brief explanation of what the fix does and why",
  "diff": "A unified diff showing the changes needed",
  "confidence": "low|medium|high"
}

Only respond with the JSON object, nothing else.`
}

function callAnthropicAPI(apiKey: string, data: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const req = https.request(
			{
				hostname: 'api.anthropic.com',
				path: '/v1/messages',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
					'Content-Length': Buffer.byteLength(data),
				},
				timeout: 30000,
			},
			(res) => {
				let body = ''
				res.on('data', (chunk) => { body += chunk })
				res.on('end', () => {
					if (res.statusCode === 200) {
						resolve(body)
					} else {
						reject(new Error(`Anthropic API error: ${res.statusCode} ${body}`))
					}
				})
			}
		)

		req.on('error', reject)
		req.on('timeout', () => {
			req.destroy()
			reject(new Error('Anthropic API timeout (30s)'))
		})
		req.write(data)
		req.end()
	})
}

function parseResponse(responseBody: string): SuggestedFix {
	try {
		const parsed = JSON.parse(responseBody)
		const content = parsed.content?.[0]?.text || ''

		// Try to parse the JSON from the response
		const jsonMatch = content.match(/\{[\s\S]*\}/)
		if (jsonMatch) {
			const fix = JSON.parse(jsonMatch[0])
			return {
				explanation: fix.explanation || 'No explanation provided',
				diff: fix.diff || '',
				confidence: ['low', 'medium', 'high'].includes(fix.confidence) ? fix.confidence : 'low',
			}
		}

		return {
			explanation: content || 'Unable to parse AI response',
			diff: '',
			confidence: 'low',
		}
	} catch {
		return {
			explanation: 'Failed to parse AI response',
			diff: '',
			confidence: 'low',
		}
	}
}
