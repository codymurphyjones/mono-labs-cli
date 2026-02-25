import https from 'https'
import type { Notation } from '../types'

interface JiraConfig {
	baseUrl: string
	project: string
}

const PRIORITY_MAP: Record<string, string> = {
	critical: 'Highest',
	high: 'High',
	medium: 'Medium',
	low: 'Low',
	minimal: 'Lowest',
}

export async function createJiraIssue(
	config: JiraConfig,
	token: string,
	notation: Notation
): Promise<string> {
	const summary = `[${notation.type}] ${notation.description}`.slice(0, 255)
	const description = buildJiraDescription(notation)

	const data = JSON.stringify({
		fields: {
			project: { key: config.project },
			summary,
			description,
			issuetype: { name: notation.type === 'BUG' ? 'Bug' : 'Task' },
			...(notation.priority && PRIORITY_MAP[notation.priority]
				? { priority: { name: PRIORITY_MAP[notation.priority] } }
				: {}),
		},
	})

	const url = new URL(config.baseUrl)

	return new Promise((resolve, reject) => {
		const req = https.request(
			{
				hostname: url.hostname,
				path: '/rest/api/3/issue',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Basic ${token}`,
					'Accept': 'application/json',
					'Content-Length': Buffer.byteLength(data),
				},
				timeout: 15000,
			},
			(res) => {
				let body = ''
				res.on('data', (chunk) => { body += chunk })
				res.on('end', () => {
					try {
						const parsed = JSON.parse(body)
						if (res.statusCode === 201 && parsed.key) {
							const issueUrl = `${config.baseUrl}/browse/${parsed.key}`
							resolve(issueUrl)
						} else {
							reject(new Error(`Jira API error: ${res.statusCode} ${JSON.stringify(parsed.errors || parsed)}`))
						}
					} catch {
						reject(new Error(`Jira API error: ${res.statusCode}`))
					}
				})
			}
		)

		req.on('error', reject)
		req.on('timeout', () => {
			req.destroy()
			reject(new Error('Jira API timeout'))
		})
		req.write(data)
		req.end()
	})
}

function buildJiraDescription(notation: Notation): string {
	const lines: string[] = []
	lines.push(`*Type:* ${notation.type}`)
	lines.push(`*File:* {{${notation.location.file}:${notation.location.line}}}`)
	if (notation.priority) lines.push(`*Priority:* ${notation.priority}`)
	if (notation.assignee) lines.push(`*Assignee:* ${notation.assignee}`)
	lines.push('')
	lines.push(`h3. Description`)
	lines.push(notation.description)
	if (notation.body.length > 0) {
		lines.push('')
		lines.push(notation.body.join('\n'))
	}
	if (notation.codeContext.length > 0) {
		lines.push('')
		lines.push(`h3. Code Context`)
		lines.push('{code}')
		lines.push(notation.codeContext.join('\n'))
		lines.push('{code}')
	}
	return lines.join('\n')
}
