import https from 'https'
import type { Notation } from '../types'

interface GitHubConfig {
	owner: string
	repo: string
}

export async function createGitHubIssue(
	config: GitHubConfig,
	token: string,
	notation: Notation
): Promise<string> {
	const title = `[${notation.type}] ${notation.description}`
	const body = buildIssueBody(notation)

	const data = JSON.stringify({
		title,
		body,
		labels: [notation.type.toLowerCase(), notation.priority || 'medium'].filter(Boolean),
	})

	return new Promise((resolve, reject) => {
		const req = https.request(
			{
				hostname: 'api.github.com',
				path: `/repos/${config.owner}/${config.repo}/issues`,
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
					'User-Agent': 'mono-labs-tracker',
					'Accept': 'application/vnd.github.v3+json',
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
						if (res.statusCode === 201 && parsed.html_url) {
							resolve(parsed.html_url)
						} else {
							reject(new Error(`GitHub API error: ${res.statusCode} ${parsed.message || body}`))
						}
					} catch {
						reject(new Error(`GitHub API error: ${res.statusCode}`))
					}
				})
			}
		)

		req.on('error', reject)
		req.on('timeout', () => {
			req.destroy()
			reject(new Error('GitHub API timeout'))
		})
		req.write(data)
		req.end()
	})
}

function buildIssueBody(notation: Notation): string {
	const lines: string[] = []
	lines.push(`**Type:** ${notation.type}`)
	lines.push(`**File:** \`${notation.location.file}:${notation.location.line}\``)
	if (notation.priority) lines.push(`**Priority:** ${notation.priority}`)
	if (notation.assignee) lines.push(`**Assignee:** ${notation.assignee}`)
	if (notation.dueDate) lines.push(`**Due Date:** ${notation.dueDate}`)
	lines.push('')
	lines.push('## Description')
	lines.push(notation.description)
	if (notation.body.length > 0) {
		lines.push('')
		lines.push(notation.body.join('\n'))
	}
	if (notation.codeContext.length > 0) {
		lines.push('')
		lines.push('## Code Context')
		lines.push('```')
		lines.push(notation.codeContext.join('\n'))
		lines.push('```')
	}
	lines.push('')
	lines.push('---')
	lines.push('*Created by [@mono-labs/tracker](https://github.com/mono-labs/tracker)*')
	return lines.join('\n')
}
