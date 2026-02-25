import * as fs from 'fs'
import * as path from 'path'
import type { NotationStats } from '../types'

export interface Snapshot {
	date: string
	stats: NotationStats
	healthScore: number
}

const MAX_SNAPSHOTS = 365

export class SnapshotStorage {
	private filePath: string

	constructor(filePath: string) {
		this.filePath = filePath
	}

	private async ensureDirectory(): Promise<void> {
		const dir = path.dirname(this.filePath)
		await fs.promises.mkdir(dir, { recursive: true })
	}

	async readAll(): Promise<Snapshot[]> {
		try {
			const content = await fs.promises.readFile(this.filePath, 'utf-8')
			const lines = content.trim().split('\n').filter(Boolean)
			const snapshots: Snapshot[] = []
			for (const line of lines) {
				try {
					snapshots.push(JSON.parse(line))
				} catch {
					// Skip corrupt lines
				}
			}
			return snapshots
		} catch (err: any) {
			if (err.code === 'ENOENT') return []
			throw err
		}
	}

	async readRange(days: number): Promise<Snapshot[]> {
		const all = await this.readAll()
		if (days <= 0) return all
		const cutoff = new Date()
		cutoff.setDate(cutoff.getDate() - days)
		const cutoffStr = cutoff.toISOString().slice(0, 10)
		return all.filter((s) => s.date >= cutoffStr)
	}

	async append(snapshot: Snapshot): Promise<void> {
		await this.ensureDirectory()
		let snapshots = await this.readAll()

		// Replace existing entry for the same date
		const existingIdx = snapshots.findIndex((s) => s.date === snapshot.date)
		if (existingIdx !== -1) {
			snapshots[existingIdx] = snapshot
		} else {
			snapshots.push(snapshot)
		}

		// Prune to max entries
		if (snapshots.length > MAX_SNAPSHOTS) {
			snapshots = snapshots.slice(snapshots.length - MAX_SNAPSHOTS)
		}

		const tmpPath = this.filePath + '.tmp'
		const content = snapshots.map((s) => JSON.stringify(s)).join('\n') + '\n'
		await fs.promises.writeFile(tmpPath, content, 'utf-8')
		await fs.promises.rename(tmpPath, this.filePath)
	}

	async getLatestDate(): Promise<string | null> {
		const all = await this.readAll()
		if (all.length === 0) return null
		return all[all.length - 1].date
	}
}
