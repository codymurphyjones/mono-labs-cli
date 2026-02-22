import { randomUUID, createHash } from 'crypto'

export function generateId(prefix: string = 'N'): string {
	return `${prefix}-${randomUUID().slice(0, 8)}`
}

export function generateStableId(prefix: string, file: string, line: number): string {
	const hash = createHash('sha256').update(`${file}:${line}`).digest('hex').slice(0, 8)
	return `${prefix}-${hash}`
}
