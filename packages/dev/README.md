# @mono-labs/dev

Local development server and WebSocket adapter for mono-labs. Maps Lambda handlers to Express routes, emulates API Gateway WebSocket connections, and provides a Redis caching abstraction.

## Installation

```bash
yarn add @mono-labs/dev
```

### Optional Peer Dependencies

```bash
# For Redis-backed channel store and CacheRelay
yarn add ioredis

# For API Gateway WebSocket mode (SocketGatewayClient)
yarn add @aws-sdk/client-apigatewaymanagementapi
```

## API Reference

### LocalServer

Express-based HTTP server that maps Lambda handlers to local routes.

```typescript
import { LocalServer } from '@mono-labs/dev'

const server = new LocalServer({ debug: true })
```

- **`constructor(config?)`** -- Creates a new server. `LocalServerConfig` options: `debug?: boolean`, `useRedis?: boolean`, `redis?: RedisConfig`.
- **`.app`** -- The underlying `express.Express` instance for custom middleware.

#### `.lambda(path, handler, options?)`

Registers a Lambda handler at the given HTTP path. Supports two event types:

```typescript
// API Gateway V2 (default)
server.lambda('/api/*', myApiGatewayHandler)
server.lambda('/api/*', myApiGatewayHandler, { eventType: 'api-gateway' })

// Application Load Balancer
server.lambda('/alb/*', myALBHandler, { eventType: 'alb' })
```

#### `.attachSocket(adapterFn, config?)`

Attaches the WebSocket adapter to the server's HTTP instance:

```typescript
import { attachSocketAdapter } from '@mono-labs/dev'

const socket = server.attachSocket(attachSocketAdapter, {
  debug: true,
  connectHandler: async (connectionId, { token }) => ({
    response: { statusCode: 200 },
    userContext: { userId: '123', organizationId: 'org-1' }
  }),
  routes: {
    ping: async (body, ctx) => ({ statusCode: 200, body: 'pong' })
  }
})
```

Returns the same object as `attachSocketAdapter()` (see below).

#### `.listen(port, hostname?)`

Starts the HTTP server:

```typescript
server.listen(3000)
```

---

### WebSocket System

#### `attachSocketAdapter(wss, config?)`

Wires a `WebSocketServer` instance with connection tracking, action routing, and event synthesis:

```typescript
import { WebSocketServer } from 'ws'
import { attachSocketAdapter } from '@mono-labs/dev'

const wss = new WebSocketServer({ noServer: true })
const {
  postToConnection,
  connectionRegistry,
  actionRouter,
  channelStore,
  socketEmitter,
  getConnectionId,
} = attachSocketAdapter(wss, { debug: true })
```

**`SocketAdapterConfig`** options:
- `domainName?: string` -- Domain for synthesized events (default: `'localhost'`)
- `stage?: string` -- Stage for synthesized events (default: `'local'`)
- `debug?: boolean` -- Enable debug logging
- `connectHandler?: ConnectHandlerFn` -- Custom $connect handler
- `disconnectHandler?: DisconnectHandlerFn` -- Custom $disconnect handler
- `routes?: Record<string, ActionHandler>` -- Action routes
- `defaultHandler?: ActionHandler` -- Fallback for unmatched actions
- `channelStore?: ChannelStore` -- Custom channel store implementation
- `useRedis?: boolean` -- Use Redis-backed channel store
- `redis?: RedisConfig` -- Redis connection options

#### `ConnectionRegistry`

Tracks WebSocket connections and their user contexts:

```typescript
registry.register(ws): ConnectionId
registry.unregister(connectionId): void
registry.get(connectionId): WebSocket | undefined
registry.getAll(): ConnectionId[]
registry.setUserContext(connectionId, ctx): void
registry.getUserContext(connectionId): WebSocketUserContext | undefined
registry.getConnectionsByUserId(userId): ConnectionId[]
registry.getConnectionsByOrgId(orgId): ConnectionId[]
```

#### `ActionRouter`

Routes incoming WebSocket messages to handlers based on the `action` field:

```typescript
router.addRoute('chat:send', async (body, ctx) => {
  return { statusCode: 200, body: 'ok' }
})
router.setDefaultHandler(async (body, ctx) => {
  return { statusCode: 400, body: 'Unknown action' }
})
```

**`ActionHandlerContext`**: `{ connectionId, requestContext, postToConnection, userContext }`

#### `SocketGatewayClient`

Dual-mode client for posting messages to WebSocket connections. Accepts either a `ConnectionRegistry` for local mode or a URL string for AWS API Gateway mode:

```typescript
import { SocketGatewayClient } from '@mono-labs/dev'

// Local mode (uses ConnectionRegistry to find WebSocket instances)
const localClient = new SocketGatewayClient(connectionRegistry)

// API Gateway mode (uses @aws-sdk/client-apigatewaymanagementapi)
const awsClient = new SocketGatewayClient('https://abc123.execute-api.us-east-1.amazonaws.com/prod')

await client.postToConnection(connectionId, { message: 'hello' })

// Get a bound function for dependency injection
const postFn = client.asFunction()
```

#### `SocketEmitter`

High-level emit API targeting users, orgs, connections, channels, or broadcast:

```typescript
import type { EmitTarget } from '@mono-labs/dev'

await socketEmitter.emit({ userId: 'user-1' }, { event: 'update' })
await socketEmitter.emit({ orgId: 'org-1' }, { event: 'notify' })
await socketEmitter.emit({ connectionId: 'conn-1' }, data)
await socketEmitter.emit({ channel: 'room-1' }, data)
await socketEmitter.emit('broadcast', data)
```

#### `ChannelStore`

Manages pub/sub channel subscriptions. Two implementations:

- **`InMemoryChannelStore`** -- Default. In-memory Maps, no dependencies.
- **`RedisChannelStore`** -- Redis-backed. Requires `ioredis` peer dependency.

```typescript
interface ChannelStore {
  subscribe(connectionId, channel): Promise<void>
  unsubscribe(connectionId, channel): Promise<void>
  getSubscribers(channel): Promise<ConnectionId[]>
  removeAll(connectionId): Promise<void>
}
```

---

### CacheRelay

Redis abstraction with namespaced operations. Requires `ioredis` peer dependency.

```typescript
import { initCacheRelay, getCacheRelay } from '@mono-labs/dev'

// Initialize (defaults to localhost:6379)
initCacheRelay()

// Or with a connection string (bare hostnames auto-normalized to redis://)
initCacheRelay('my-redis-host:6379')

// Get the singleton instance
const cache = getCacheRelay()
```

**Top-level convenience methods:**

```typescript
await cache.set('key', { foo: 'bar' }, { ttlSeconds: 300 })
const value = await cache.get('key')        // string | null
const parsed = await cache.gett<MyType>('key') // T | null
await cache.del('key1', 'key2')
```

**Namespaced operations:**

| Namespace | Operations |
|-----------|-----------|
| `cache.strings` | `get`, `set`, `mget`, `mset`, `incr`, `incrby`, `decr`, `decrby`, `append`, `strlen` |
| `cache.hashes` | `get`, `set`, `getAll`, `del`, `exists`, `keys`, `vals`, `len`, `mset`, `mget`, `incrby` |
| `cache.lists` | `push`, `lpush`, `pop`, `lpop`, `range`, `len`, `trim`, `index`, `set`, `rem` |
| `cache.sets` | `add`, `rem`, `members`, `isMember`, `card`, `union`, `inter`, `diff` |
| `cache.sortedSets` | `add`, `rem`, `range`, `rangeWithScores`, `rangeByScore`, `revRange`, `score`, `rank`, `card`, `incrby`, `remRangeByRank`, `remRangeByScore` |
| `cache.keys` | `exists`, `expire`, `ttl`, `pttl`, `persist`, `rename`, `type`, `scan` |
| `cache.pubsub` | `publish`, `subscribe`, `unsubscribe` |
| `cache.transactions` | `multi`, `exec` |
| `cache.scripts` | `eval`, `evalsha` |
| `cache.geo` | `add`, `pos`, `dist`, `radius` |
| `cache.hyperloglog` | `add`, `count`, `merge` |
| `cache.bitmaps` | `setbit`, `getbit`, `count`, `op` |
| `cache.streams` | `add`, `read`, `len`, `range`, `trim` |

Access the raw `ioredis` client via `cache.raw`.

---

## Types

All exported types from `@mono-labs/dev`:

```typescript
// LocalServer
type ApiGatewayHandler
type ALBHandler
interface LocalServerConfig

// WebSocket
type ConnectionId
type PostToConnectionFn
interface SocketAdapterConfig
interface RedisConfig
type ConnectHandlerFn
type DisconnectHandlerFn
type ActionHandler
interface ActionHandlerContext
interface ActionHandlerResult
interface LocalRequestContext
interface WebSocketUserContext
interface ChannelStore
type EmitTarget

// CacheRelay
interface CacheRelay
interface StringOps
interface HashOps
interface ListOps
interface SetOps
interface SortedSetOps
interface KeyOps
interface PubSubOps
interface TransactionOps
interface ScriptOps
interface GeoOps
interface HyperLogLogOps
interface BitmapOps
interface StreamOps
```

## Development

Build the dev package:

```bash
yarn build:dev
```

This package has no internal `@mono-labs` dependencies -- it is independent in the dependency graph.

See the [Contributing guide](../../CONTRIBUTING.md) for full development setup.
