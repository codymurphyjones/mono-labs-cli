import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { SnapshotStorage, type Snapshot } from './snapshot-storage'

function makeSnapshot(date: string, total: number = 10, healthScore: number = 80): Snapshot {
	return {
		date,
		stats: {
			total,
			byType: { TODO: total },
			byPriority: {},
			byStatus: { open: total },
			byTag: {},
			byAssignee: {},
			overdue: 0,
			blocked: 0,
			totalDebtHours: 0,
		},
		healthScore,
	}
}

describe('SnapshotStorage', () => {
	let tmpDir: string
	let filePath: string
	let storage: SnapshotStorage

	beforeEach(async () => {
		tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tracker-snap-'))
		filePath = path.join(tmpDir, 'snapshots.jsonl')
		storage = new SnapshotStorage(filePath)
	})

	afterEach(async () => {
		await fs.promises.rm(tmpDir, { recursive: true, force: true })
	})

	it('readAll returns empty array when file missing', async () => {
		const result = await storage.readAll()
		expect(result).toEqual([])
	})

	it('append and readAll round-trip', async () => {
		const snap = makeSnapshot('2026-01-15')
		await storage.append(snap)
		const all = await storage.readAll()
		expect(all).toHaveLength(1)
		expect(all[0].date).toBe('2026-01-15')
		expect(all[0].healthScore).toBe(80)
	})

	it('replaces existing entry for the same date', async () => {
		await storage.append(makeSnapshot('2026-01-15', 10, 80))
		await storage.append(makeSnapshot('2026-01-15', 20, 60))
		const all = await storage.readAll()
		expect(all).toHaveLength(1)
		expect(all[0].stats.total).toBe(20)
		expect(all[0].healthScore).toBe(60)
	})

	it('readRange filters by days', async () => {
		const today = new Date().toISOString().slice(0, 10)
		const oldDate = '2020-01-01'
		await storage.append(makeSnapshot(oldDate))
		await storage.append(makeSnapshot(today))
		const recent = await storage.readRange(30)
		expect(recent).toHaveLength(1)
		expect(recent[0].date).toBe(today)
	})

	it('prunes to 365 entries', async () => {
		for (let i = 0; i < 370; i++) {
			const date = `2025-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`
			await storage.append(makeSnapshot(date, i))
		}
		const all = await storage.readAll()
		expect(all.length).toBeLessThanOrEqual(365)
	})

	it('getLatestDate returns null when empty', async () => {
		const date = await storage.getLatestDate()
		expect(date).toBeNull()
	})

	it('getLatestDate returns last date', async () => {
		await storage.append(makeSnapshot('2026-01-01'))
		await storage.append(makeSnapshot('2026-02-15'))
		const date = await storage.getLatestDate()
		expect(date).toBe('2026-02-15')
	})
})
