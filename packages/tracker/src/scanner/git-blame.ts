import { execFile } from 'child_process'
import type { Notation } from '../types'

interface BlameInfo {
	author: string
	email: string
	date: string
	commitHash: string
}

// In-memory cache with TTL
const blameCache = new Map<string, { data: BlameInfo; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(key: string): BlameInfo | null {
	const entry = blameCache.get(key)
	if (!entry) return null
	if (Date.now() > entry.expires) {
		blameCache.delete(key)
		return null
	}
	return entry.data
}

function setCached(key: string, data: BlameInfo): void {
	blameCache.set(key, { data, expires: Date.now() + CACHE_TTL })
}

function blameFile(projectRoot: string, file: string, line: number): Promise<BlameInfo | null> {
	return new Promise((resolve) => {
		const args = ['blame', '-p', `-L${line},${line}`, '--', file]

		execFile('git', args, { cwd: projectRoot, timeout: 10000 }, (err, stdout) => {
			if (err) {
				resolve(null)
				return
			}

			try {
				const lines = stdout.split('\n')
				let author = ''
				let email = ''
				let date = ''
				let commitHash = ''

				// First line starts with the commit hash
				if (lines[0]) {
					commitHash = lines[0].split(' ')[0]
				}

				for (const l of lines) {
					if (l.startsWith('author ')) author = l.slice(7)
					if (l.startsWith('author-mail ')) email = l.slice(12).replace(/[<>]/g, '')
					if (l.startsWith('author-time ')) {
						const timestamp = parseInt(l.slice(12), 10)
						date = new Date(timestamp * 1000).toISOString()
					}
				}

				if (author && commitHash) {
					resolve({ author, email, date, commitHash })
				} else {
					resolve(null)
				}
			} catch {
				resolve(null)
			}
		})
	})
}

export async function batchBlame(projectRoot: string, notations: Notation[]): Promise<Notation[]> {
	const results: Notation[] = []

	for (const n of notations) {
		const cacheKey = `${n.location.file}:${n.location.line}`
		const cached = getCached(cacheKey)

		if (cached) {
			results.push({ ...n, blame: cached })
			continue
		}

		const blame = await blameFile(projectRoot, n.location.file, n.location.line)
		if (blame) {
			setCached(cacheKey, blame)
			results.push({ ...n, blame })
		} else {
			results.push(n)
		}
	}

	return results
}
