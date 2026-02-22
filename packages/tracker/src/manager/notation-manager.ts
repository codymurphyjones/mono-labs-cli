import * as path from 'path'
import type { Notation, NotationQuery, NotationStats, TrackerConfig } from '../types'
import { JsonlStorage } from '../storage'
import { isOverdue } from '../utils'
import { isBlocked } from './relationship-manager'
import { validateAll, type ValidationError } from './validator'
import { computeStats } from './stats'

export class NotationManager {
	private storage: JsonlStorage
	private notations: Notation[] = []
	private config: TrackerConfig

	constructor(config: TrackerConfig) {
		this.config = config
		const storagePath = path.isAbsolute(config.storagePath)
			? config.storagePath
			: path.join(config.rootDir, config.storagePath)
		this.storage = new JsonlStorage(storagePath)
	}

	async load(): Promise<void> {
		this.notations = await this.storage.readAll()
	}

	async save(): Promise<void> {
		await this.storage.writeAll(this.notations)
	}

	getAll(): Notation[] {
		return [...this.notations]
	}

	setAll(notations: Notation[]): void {
		this.notations = [...notations]
	}

	getById(id: string): Notation | undefined {
		return this.notations.find((n) => n.id === id)
	}

	query(q: NotationQuery): Notation[] {
		return this.notations.filter((n) => {
			if (q.type) {
				const types = Array.isArray(q.type) ? q.type : [q.type]
				if (!types.includes(n.type)) return false
			}
			if (q.tags && q.tags.length > 0) {
				if (!q.tags.some((t) => n.tags.includes(t))) return false
			}
			if (q.priority) {
				const priorities = Array.isArray(q.priority) ? q.priority : [q.priority]
				if (!n.priority || !priorities.includes(n.priority)) return false
			}
			if (q.status) {
				const statuses = Array.isArray(q.status) ? q.status : [q.status]
				if (!statuses.includes(n.status)) return false
			}
			if (q.file) {
				if (!n.location.file.includes(q.file)) return false
			}
			if (q.assignee) {
				if (n.assignee !== q.assignee) return false
			}
			if (q.overdue === true) {
				if (!n.dueDate || !isOverdue(n.dueDate) || n.status === 'resolved') return false
			}
			if (q.blocked === true) {
				if (!isBlocked(n, this.notations)) return false
			}
			if (q.search) {
				const lower = q.search.toLowerCase()
				const searchable = `${n.description} ${n.body.join(' ')} ${n.tags.join(' ')}`.toLowerCase()
				if (!searchable.includes(lower)) return false
			}
			if (q.dueBefore) {
				if (!n.dueDate || n.dueDate > q.dueBefore) return false
			}
			if (q.dueAfter) {
				if (!n.dueDate || n.dueDate < q.dueAfter) return false
			}
			return true
		})
	}

	update(id: string, updates: Partial<Notation>): boolean {
		const idx = this.notations.findIndex((n) => n.id === id)
		if (idx === -1) return false
		this.notations[idx] = { ...this.notations[idx], ...updates }
		return true
	}

	validate(): ValidationError[] {
		return validateAll(this.notations)
	}

	stats(): NotationStats {
		return computeStats(this.notations)
	}
}
