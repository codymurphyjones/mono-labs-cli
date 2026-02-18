import http from 'node:http';

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';

import {
	createMockLambdaContext,
	sendLambdaResult,
} from '../aws-event-synthesis';
import {
	synthesizeApiGatewayEvent,
	synthesizeALBEvent,
} from './event-synthesizer';

import { attachSocketAdapter } from '../websocket';
import type { SocketAdapterConfig } from '../websocket/types';
import type {
	ApiGatewayHandler,
	ALBHandler,
	LambdaOptionsApiGateway,
	LambdaOptionsALB,
	LocalServerConfig,
} from './types';

export type { ApiGatewayHandler, ALBHandler, LocalServerConfig } from './types';

export class LocalServer {
	readonly app: express.Express;
	private httpServer: http.Server;
	private config: LocalServerConfig;

	constructor(config?: LocalServerConfig) {
		this.config = config ?? {};
		this.app = express();

		this.app.use(express.json());
		this.app.use(cors());

		this.app.get('/', (_req, res) => {
			res.send('Hello from Express HTTP Server');
		});

		this.httpServer = http.createServer(this.app);
	}

	// --- Type-safe overloads ---

	lambda(path: string, handler: ApiGatewayHandler): this;
	lambda(
		path: string,
		handler: ApiGatewayHandler,
		options: LambdaOptionsApiGateway
	): this;
	lambda(path: string, handler: ALBHandler, options: LambdaOptionsALB): this;
	lambda(
		path: string,
		handler: ApiGatewayHandler | ALBHandler,
		options?: LambdaOptionsApiGateway | LambdaOptionsALB
	): this {
		const eventType = options?.eventType ?? 'api-gateway';

		this.app.use(path, async (req: express.Request, res: express.Response) => {
			try {
				const context = createMockLambdaContext();

				if (eventType === 'alb') {
					const event = synthesizeALBEvent(req);
					const result = await (handler as ALBHandler)(event, context);
					sendLambdaResult(res, result);
				} else {
					const event = synthesizeApiGatewayEvent(req);
					const result = await (handler as ApiGatewayHandler)(event, context);
					sendLambdaResult(res, result ?? {});
				}
			} catch (err) {
				console.error(
					`[LocalServer] Error handling ${req.method} ${req.originalUrl}:`,
					err
				);
				if (!res.headersSent) {
					res.status(500).json({ error: 'Internal Server Error' });
				}
			}
		});

		return this;
	}

	attachSocket(
		//adapterFn: typeof attachSocketAdapter,
		config?: SocketAdapterConfig
	): ReturnType<typeof attachSocketAdapter> {
		const wss = new WebSocketServer({ server: this.httpServer });
		const mergedConfig: SocketAdapterConfig = {
			...config,
			useRedis: config?.useRedis ?? this.config.useRedis,
			debug: config?.debug ?? this.config.debug,
		};
		return attachSocketAdapter(wss, mergedConfig);
	}

	listen(port: number, hostname?: string): void {
		const host = hostname ?? '0.0.0.0';
		this.httpServer.listen(port, host, () => {
			if (this.config.debug) {
				console.info(`HTTP Server running at http://localhost:${port}`);
				console.info(`WebSocket server running on ws://localhost:${port}`);
			}
		});
	}
}
