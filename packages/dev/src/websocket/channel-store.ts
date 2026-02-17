import type { ConnectionId } from './types'

// ---- Interface -------------------------------------------------------------

export interface ChannelStore {
	subscribe(connectionId: ConnectionId, channel: string): Promise<void>
	unsubscribe(connectionId: ConnectionId, channel: string): Promise<void>
	getSubscribers(channel: string): Promise<ConnectionId[]>
	removeAll(connectionId: ConnectionId): Promise<void>
}

// ---- InMemoryChannelStore --------------------------------------------------

export class InMemoryChannelStore implements ChannelStore {
	private channelToConnections = new Map<string, Set<ConnectionId>>()
	private connectionToChannels = new Map<ConnectionId, Set<string>>()

	async subscribe(connectionId: ConnectionId, channel: string): Promise<void> {
		let conns = this.channelToConnections.get(channel)
		if (!conns) {
			conns = new Set()
			this.channelToConnections.set(channel, conns)
		}
		conns.add(connectionId)

		let channels = this.connectionToChannels.get(connectionId)
		if (!channels) {
			channels = new Set()
			this.connectionToChannels.set(connectionId, channels)
		}
		channels.add(channel)
	}

	async unsubscribe(connectionId: ConnectionId, channel: string): Promise<void> {
		const conns = this.channelToConnections.get(channel)
		if (conns) {
			conns.delete(connectionId)
			if (conns.size === 0) this.channelToConnections.delete(channel)
		}

		const channels = this.connectionToChannels.get(connectionId)
		if (channels) {
			channels.delete(channel)
			if (channels.size === 0) this.connectionToChannels.delete(connectionId)
		}
	}

	async getSubscribers(channel: string): Promise<ConnectionId[]> {
		const conns = this.channelToConnections.get(channel)
		return conns ? Array.from(conns) : []
	}

	async removeAll(connectionId: ConnectionId): Promise<void> {
		const channels = this.connectionToChannels.get(connectionId)
		if (!channels) return

		for (const channel of channels) {
			const conns = this.channelToConnections.get(channel)
			if (conns) {
				conns.delete(connectionId)
				if (conns.size === 0) this.channelToConnections.delete(channel)
			}
		}

		this.connectionToChannels.delete(connectionId)
	}
}

// ---- RedisChannelStore -----------------------------------------------------

export class RedisChannelStore implements ChannelStore {
	private channelKeyPrefix: string
	private connChannelsPrefix: string

	constructor(options?: { keyPrefix?: string }) {
		const prefix = options?.keyPrefix ?? 'ws:'
		this.channelKeyPrefix = `${prefix}channel:`
		this.connChannelsPrefix = `${prefix}conn-channels:`
	}

	private getRelay() {
		// Lazy import to avoid circular dependency and to defer until Redis is initialized
		const { getCacheRelay } = require('../cache-relay') as typeof import('../cache-relay')
		return getCacheRelay()
	}

	async subscribe(connectionId: ConnectionId, channel: string): Promise<void> {
		const relay = this.getRelay()
		await relay.raw.sadd(`${this.channelKeyPrefix}${channel}`, connectionId)
		await relay.raw.sadd(`${this.connChannelsPrefix}${connectionId}`, channel)
	}

	async unsubscribe(connectionId: ConnectionId, channel: string): Promise<void> {
		const relay = this.getRelay()
		await relay.raw.srem(`${this.channelKeyPrefix}${channel}`, connectionId)
		await relay.raw.srem(`${this.connChannelsPrefix}${connectionId}`, channel)
	}

	async getSubscribers(channel: string): Promise<ConnectionId[]> {
		const relay = this.getRelay()
		return relay.raw.smembers(`${this.channelKeyPrefix}${channel}`)
	}

	async removeAll(connectionId: ConnectionId): Promise<void> {
		const relay = this.getRelay()
		const channels: string[] = await relay.raw.smembers(`${this.connChannelsPrefix}${connectionId}`)

		await Promise.allSettled(
			channels.map((channel) =>
				relay.raw.srem(`${this.channelKeyPrefix}${channel}`, connectionId)
			)
		)

		await relay.raw.del(`${this.connChannelsPrefix}${connectionId}`)
	}
}
