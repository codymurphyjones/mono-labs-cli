import type http from 'http'
import type { TrackerConfig, NotationManager } from '..'

export interface DashboardConfig {
	projectRoot: string
	config: TrackerConfig
	port?: number
}

export interface DashboardServer {
	server: http.Server
	manager: NotationManager
	close: () => Promise<void>
}
