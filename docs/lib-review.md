# CLI Library Source Tree (`packages/cli/lib/`)

## Overview

The `packages/cli/lib/` directory contains the TypeScript source for the CLI runtime.
It is compiled to `dist/lib/` and loaded by the `bin/mono.js` entry point. All source
files are `.ts`; the compiled `.js` counterparts live in `dist/`.

---

## Directory Structure

```
packages/cli/lib/
├── index.ts
├── app.ts
├── config.ts
├── filterUnwantedEnvVars.ts
├── generateNewEnvList.ts
├── commands/
│   ├── loadFromRoot.ts
│   ├── prune/
│   │   ├── index.ts
│   │   └── prune.ts
│   └── build-process/
│       ├── index.ts
│       ├── boot.ts
│       ├── cliFactory.ts
│       ├── runMonoCommand.ts
│       ├── dataLayer.ts
│       ├── validators.ts
│       ├── readEnv.ts
│       ├── test.ts
│       ├── testflag.ts
│       └── runners/
│           ├── processManager.ts
│           ├── runForeground.ts
│           └── runBackground.ts
```

---

## Top-Level Files

### `index.ts`

CLI bootstrap. Imports `app.ts` (the Commander program), registers the `prune` and
`build-process` command modules, and sets up a fallback handler for unknown commands
(delegates to `yarn workspace` commands).

### `app.ts`

Creates the Commander.js `program` instance and exports it. Also exports:

```typescript
function findNearestPackageJson(startDir: string): string
function getBinFromPackageJSON(): string
function generateEnvValues(forceProd?: boolean, ngrokUrl?: string, useAtlas?: boolean): NodeJS.ProcessEnv
```

### `config.ts`

Exports URL constants used for environment configuration:

```typescript
export const STAGE_URL: string
export const STAGING_URL: string
```

### `filterUnwantedEnvVars.ts`

Filters OS/tool-specific environment variables before passing them to child processes:

```typescript
function filterUnwantedEnvVars(env: NodeJS.ProcessEnv): Record<string, string | undefined>
function filterUnwantedEnvVarsEAS(env: NodeJS.ProcessEnv): Record<string, string | undefined>
```

### `generateNewEnvList.ts`

Maps `MONO_*` prefixed environment variables to additional prefixes defined in
`.mono/config.json` `envMap`:

```typescript
function generateNewEnvList(processEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv
```

---

## Commands

### `commands/loadFromRoot.ts`

Discovers the project root and loads `.mono/` configuration:

```typescript
function getRootDirectory(): string
function getRootJson(): any
function getMonoFiles(): string[]
function getMonoConfig(): { files: Record<string, any>; config: any }
```

### `commands/prune/index.ts`

Registers the `prune` command on the Commander program.

### `commands/prune/prune.ts`

Git branch cleanup -- removes local branches that no longer exist on `origin`:

```typescript
function pruneRepo(): void
```

---

## Build Process

### `commands/build-process/index.ts`

Orchestrator. Calls `boot()` to discover `.mono` files, then `buildCommands()` to
register them as CLI commands, and `ensureSignalHandlers()` for cleanup.

### `commands/build-process/boot.ts`

Loads root configuration and mono config files:

```typescript
type BootResult = {
  rootDir: unknown
  rootJson: unknown
  files: Record<string, unknown>
  config: Record<string, unknown>
}

function boot(): BootResult
```

### `commands/build-process/cliFactory.ts`

Dynamically builds Commander commands from `.mono/*.json` definitions:

```typescript
function buildCommands(files: Record<string, MonoFileDefinition>): void
function createConfigCommands(): Command
function createCliCommands(): Command
```

Types: `MonoFileDefinition`, `ArgumentConfig`, `OptionConfig`, `CommandConfig`.

### `commands/build-process/runMonoCommand.ts`

Orchestrates command execution -- preactions (sequential via `runForeground`), then
actions (background except last, last attached via `runBackground`):

```typescript
function getAllowAllKeys(cfg: any): string[]
async function runMonoCommand(configObject: any, options?: any): Promise<void>
```

### `commands/build-process/dataLayer.ts`

Central mutable key/value store for dynamic tokens and option defaults:

```typescript
function setData(key: string, value: unknown): void
function mergeData(obj?: Record<string, unknown>): Record<string, unknown>
function getData(key?: string): unknown
function hasData(key: string): boolean
function replaceTokens(str: unknown, env?: Record<string, unknown>): unknown
```

### `commands/build-process/validators.ts`

Enforces enumerated option values (e.g., `--platform` must be `ios` or `android`):

```typescript
function verifyOptionValue(optionKey: string, value: any, optionsData: any): any
```

### `commands/build-process/readEnv.ts`

Parses `.env` files into key/value records:

```typescript
function parseEnvFile(filePath: string): Record<string, string>
```

### `commands/build-process/test.ts`

Executes pre-action commands in a workspace context:

```typescript
function executeCommandsIfWorkspaceAction(
  action: any,
  commands?: string[],
  fullEnv?: NodeJS.ProcessEnv
): void
```

### `commands/build-process/testflag.ts`

Exports a constant test-mode flag:

```typescript
export const testFlag = true as const
```

---

## Runners

### `runners/processManager.ts`

Tracks background child processes and ensures cleanup on signals:

```typescript
const bgChildren: Set<ChildProcess>
function registerBackground(child: ChildProcess): void
function killAllBackground(): void
function ensureSignalHandlers(): void
```

On POSIX, background processes are killed via `process.kill(-pid, 'SIGTERM')`.
On Windows, `taskkill /PID <pid> /T /F` is used.

### `runners/runForeground.ts`

Spawns a command, captures stdout/stderr, and extracts `{out:field value}` tokens
into the `dataLayer`:

```typescript
function runForeground(
  cmd: string,
  envObj?: NodeJS.ProcessEnv,
  _options?: Record<string, unknown>
): Promise<string>
```

### `runners/runBackground.ts`

Spawns a command as a background or attached process with token replacement in
environment values and the command string itself:

```typescript
function runBackground(
  cmd: string,
  envObj?: Record<string, unknown>,
  logName?: string,
  attached?: boolean
): Promise<void>
```

---

See [Architecture](architecture.md) for the full execution lifecycle.
