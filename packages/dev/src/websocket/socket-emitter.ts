import type { ConnectionRegistry } from './connection-registry'
import type { ChannelStore } from './channel-store'
import type { ConnectionId, PostToConnectionFn } from './types'

export type EmitTarget =
	| { userId: string }
	| { orgId: string }
	| { connectionId: string }
	| { channel: string }
	| 'broadcast'

export class SocketEmitter {
	private postToConnection: PostToConnectionFn
	private connectionRegistry: ConnectionRegistry
	private channelStore: ChannelStore

	constructor(deps: {
		postToConnection: PostToConnectionFn
		connectionRegistry: ConnectionRegistry
		channelStore: ChannelStore
	}) {
		this.postToConnection = deps.postToConnection
		this.connectionRegistry = deps.connectionRegistry
		this.channelStore = deps.channelStore
	}

	async emit(target: EmitTarget, data: unknown): Promise<void> {
		const connectionIds = await this.resolveConnectionIds(target)
		if (connectionIds.length === 0) return

		const payload = typeof data === 'string' ? data : JSON.stringify(data)

		await Promise.allSettled(
			connectionIds.map(async (connId) => {
				try {
					await this.postToConnection(connId, payload)
				} catch (err: unknown) {
					const e = err as { statusCode?: number; name?: string }
					if (e?.statusCode === 410 || e?.name === 'GoneException') return
					console.error(`[SocketEmitter] failed to send to ${connId}:`, err)
				}
			})
		)
	}

	private async resolveConnectionIds(target: EmitTarget): Promise<ConnectionId[]> {
		if (target === 'broadcast') {
			return this.connectionRegistry.getAll()
		}
		if ('connectionId' in target) {
			return [target.connectionId]
		}
		if ('userId' in target) {
			return this.connectionRegistry.getConnectionsByUserId(target.userId)
		}
		if ('orgId' in target) {
			return this.connectionRegistry.getConnectionsByOrgId(target.orgId)
		}
		if ('channel' in target) {
			return this.channelStore.getSubscribers(target.channel)
		}
		return []
	}
}
