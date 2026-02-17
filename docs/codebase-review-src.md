# Codebase Source Review (`packages/`)

## Overview

This document describes the source layout of the mono-labs monorepo. The codebase is
organized as a yarn workspaces monorepo with four packages under `packages/`. Each
package has its own `src/` directory containing TypeScript source files.

---

## Package Map

| Package | Directory | Description |
|---------|-----------|-------------|
| `@mono-labs/cli` | `packages/cli/` | CLI runtime -- reads `.mono/` definitions and executes commands |
| `@mono-labs/project` | `packages/project/` | Project config & env utilities -- root discovery, config loading, env merging |
| `@mono-labs/expo` | `packages/expo/` | Expo/EAS build utilities -- env filtering, config setup, token replacement |
| `@mono-labs/dev` | `packages/dev/` | Local dev server & WebSocket adapter -- Lambda mapping, Redis caching |

---

## `packages/cli/src/`

Minimal public API surface. The bulk of CLI logic lives in `lib/` (see
[lib-review.md](lib-review.md)).

### `index.ts`

Exports data-layer utilities for programmatic use:

```typescript
function setData(key: string, value: unknown): void
function getData(key?: string): unknown
function mergeData(obj?: Record<string, unknown>): Record<string, unknown>
function hasData(key: string): boolean
function replaceTokens(str: unknown, env?: Record<string, string | undefined>): unknown
```

---

## `packages/project/src/`

```
packages/project/src/
├── index.ts            — Barrel exports
├── loadFromRoot.ts     — Root discovery, .mono config loading
├── project/
│   ├── index.ts        — loadAppConfig(), loadProjectConfig()
│   ├── merge-env.ts    — loadMergedEnv()
│   ├── filter-env.ts   — filterEnvByPrefixes(), filterEnvByConfig()
│   ├── generate-docs.ts    — generateDocsIndex()
│   ├── build-readme.ts     — Script entrypoint
│   └── build-mono-readme.ts — Mono command markdown generation
└── stack/
    └── index.ts        — CustomStack CDK base class
```

### Key Exports

**Root discovery** (`loadFromRoot.ts`):

```typescript
function findProjectRoot(startDir?: string): string
function getRootDirectory(): string
function getRootJson(): Record<string, unknown>
function resolveMonoDirectory(): string | null
function getMonoFiles(): string[]
function getMonoConfig(): MonoConfig
function clearMonoConfigCache(): void
```

**App configuration** (`project/index.ts`):

```typescript
function loadAppConfig<TCustom, TType extends string>(
  configType?: TType,
  startDir?: string
): { config: ResolveConfig<TType, TCustom>; meta: WorkspaceDetectResult }

const loadProjectConfig = loadAppConfig
```

Supports both local development (workspace discovery) and Lambda runtime (bundled
config). Subpath export: `@mono-labs/project/project`.

**Environment** (`project/merge-env.ts`, `project/filter-env.ts`):

```typescript
function loadMergedEnv(): NodeJS.ProcessEnv
function filterEnvByPrefixes(env: Record<string, string | undefined>, prefixes: string[], include?: string[]): Record<string, string>
function filterEnvByConfig(env?: Record<string, string | undefined>, include?: string[]): Record<string, string>
```

Default filter prefixes: `MONO_`, `EAS_`, `APP_`, `TAMAGUI_`.

**CDK** (`stack/index.ts`):

```typescript
abstract class CustomStack extends cdk.Stack {
  public ownerName: string
  public region: string
  public domainName?: string
  protected enableNATGateway: boolean
  constructor(scope: Construct, id: string, props?: CustomStackProps)
  public initializeStackConfig(): void
}
```

Subpath export: `@mono-labs/project/stack`.

**Types**: `MonoConfig`, `MonoProjectConfig`, `MonoWorkspaceConfig`, `MonoFiles`,
`CustomStackProps`, `ICustomStack`.

---

## `packages/expo/src/`

```
packages/expo/src/
├── index.ts                — Barrel: replaceTokens, setUpConfig, filterUnwantedEnvVarsEAS
├── expo.ts                 — Core functions
├── tools.ts                — Re-exports replaceTokens, setUpConfig
├── cdk/
│   ├── index.ts            — Re-exports from cdk.ts
│   └── cdk.ts              — Re-exports from tools.ts
└── expo-files/
    └── filterUnwantedEnvVars.ts — filterUnwantedEnvVars(), generateNewEnvList()
```

### Key Exports

**Main** (`expo.ts`):

```typescript
function replaceTokens(input: string, tokens: Record<string, string>): string
function setUpConfig(config: AppJSONConfig): ExpoConfig
function filterUnwantedEnvVarsEAS(envVars: Record<string, string>): Record<string, string>
```

**Env utilities** (`expo-files/filterUnwantedEnvVars.ts`):

```typescript
function filterUnwantedEnvVars(env: Record<string, string>): Record<string, string>
function filterUnwantedEnvVarsEAS(env: Record<string, string>): Record<string, string>
function generateNewEnvList(processEnv: Record<string, string>): Record<string, string>
```

Subpath exports: `@mono-labs/expo/tools`, `@mono-labs/expo/cdk`.

---

## `packages/dev/src/`

```
packages/dev/src/
├── index.ts                — Barrel exports
├── cache-relay.ts          — CacheRelay Redis abstraction
├── local-server/
│   ├── index.ts            — LocalServer class
│   ├── types.ts            — Handler & config types
│   └── event-synthesizer.ts — API Gateway V2 & ALB event synthesis
├── websocket/
│   ├── index.ts            — attachSocketAdapter()
│   ├── types.ts            — WebSocket types
│   ├── connection-registry.ts — ConnectionRegistry class
│   ├── action-router.ts    — ActionRouter class
│   ├── socket-gateway-client.ts — SocketGatewayClient (local + API Gateway modes)
│   ├── socket-emitter.ts   — SocketEmitter class
│   ├── channel-store.ts    — InMemoryChannelStore, RedisChannelStore
│   └── event-synthesizer.ts — WebSocket event synthesis ($connect, $disconnect, message)
└── aws-event-synthesis/
    └── index.ts            — Shared utilities (flattenHeaders, createMockLambdaContext, etc.)
```

### Key Exports

**LocalServer** (`local-server/index.ts`):

```typescript
class LocalServer {
  readonly app: express.Express
  constructor(config?: LocalServerConfig)
  lambda(path: string, handler: ApiGatewayHandler): this
  lambda(path: string, handler: ApiGatewayHandler, options: LambdaOptionsApiGateway): this
  lambda(path: string, handler: ALBHandler, options: LambdaOptionsALB): this
  attachSocket(adapterFn: typeof attachSocketAdapter, config?: SocketAdapterConfig): ReturnType<typeof attachSocketAdapter>
  listen(port: number, hostname?: string): void
}
```

**WebSocket** (`websocket/index.ts`):

```typescript
function attachSocketAdapter(wss: WebSocketServer, config?: SocketAdapterConfig): {
  postToConnection: PostToConnectionFn
  connectionRegistry: ConnectionRegistry
  actionRouter: ActionRouter
  channelStore: ChannelStore
  socketEmitter: SocketEmitter
  getConnectionId: (ws: WebSocket) => ConnectionId | undefined
}
```

**SocketGatewayClient** -- dual-mode client accepting either a `ConnectionRegistry`
(local WebSocket mode) or a URL string (AWS API Gateway mode).

**CacheRelay** (`cache-relay.ts`):

```typescript
function initCacheRelay(connectionString?: string): CacheRelay
function getCacheRelay(): CacheRelay
```

Namespaced Redis operations: `strings`, `hashes`, `lists`, `sets`, `sortedSets`,
`keys`, `pubsub`, `transactions`, `scripts`, `geo`, `hyperloglog`, `bitmaps`,
`streams`.

See [`packages/dev/README.md`](../packages/dev/README.md) for the full API reference.
