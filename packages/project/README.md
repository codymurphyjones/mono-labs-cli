# @mono-labs/project

Foundational utility package for Mono. Provides project root discovery, `.mono` config loading, and environment variable merging.

## Installation

```bash
yarn add @mono-labs/project
```

## API Reference

### Project Root

```typescript
import {
  findProjectRoot,
  getRootDirectory,
  getRootJson
} from "@mono-labs/project";
```

- **`findProjectRoot(startDir?)`** -- Walk up the directory tree from `startDir` (or `cwd`) to find the nearest `package.json`. Returns the directory path.
- **`getRootDirectory()`** -- Returns the project root directory path.
- **`getRootJson()`** -- Reads and returns the root `package.json` as a parsed object.

### Mono Configuration

```typescript
import {
  resolveMonoDirectory,
  getMonoFiles,
  getMonoConfig
} from "@mono-labs/project";
```

- **`resolveMonoDirectory()`** -- Resolves the path to the `.mono/` directory (checks project root and cwd).
- **`getMonoFiles()`** -- Returns a `MonoFiles` record of all `.mono/*.json` command definitions (excluding `config.json`).
- **`getMonoConfig()`** -- Loads and returns the parsed `.mono/config.json` as a `MonoConfig` object.
- **`clearMonoConfigCache()`** -- Clears the cached mono config, forcing a fresh read on the next call to `getMonoConfig()`.

### App Configuration

```typescript
import {
  loadAppConfig,
  loadProjectConfig
} from "@mono-labs/project";
```

- **`loadAppConfig(configType?, startDir?)`** -- Loads a typed config file (`mono.app.json`, `mono.deployment.json`, etc.) from the project. Supports both local development (workspace discovery) and Lambda runtime (bundled config).
- **`loadProjectConfig()`** -- Alias for `loadAppConfig()`.

### Environment Merging

```typescript
import { loadMergedEnv } from "@mono-labs/project";
```

- **`loadMergedEnv()`** -- Loads `.env` and `.env.local` from the project root, merges them (`.env.local` takes precedence), and injects into `process.env` without overwriting existing variables.

### Environment Filtering

```typescript
import {
  filterEnvByPrefixes,
  filterEnvByConfig
} from "@mono-labs/project";
```

- **`filterEnvByPrefixes(env, prefixes, include?)`** -- Returns only env vars whose keys start with one of the given prefixes. Pass an optional `include` array for specific keys that should always be kept regardless of prefix.
- **`filterEnvByConfig(env?, include?)`** -- Reads prefixes from `.mono/config.json` `envMap` and combines them with default prefixes (`MONO_`, `EAS_`, `APP_`, `TAMAGUI_`). Defaults to `process.env` if `env` is omitted.

### Subpath Export

The `@mono-labs/project/project` subpath provides access to app config loading, environment filtering, and documentation generation utilities.

## Config Types

```typescript
import type {
  MonoConfig,
  MonoProjectConfig,
  MonoWorkspaceConfig,
  MonoFiles
} from "@mono-labs/project";
```

- **`MonoConfig`** -- Full mono configuration: `envMap?: string[]`, `workspace?: MonoWorkspaceConfig`, `prodFlag?: string`
- **`MonoWorkspaceConfig`** -- Workspace settings: `packageMaps?: Record<string, string>`, `preactions?: string[]`
- **`MonoProjectConfig`** -- Project config with `envMap`, `workspace`, and `prodFlag`
- **`MonoFiles`** -- Record of command definition objects keyed by filename

## Development

Build the project package:

```bash
yarn build:project
```

This package has no internal dependencies -- it sits at the base of the dependency graph. Both `@mono-labs/expo` and `@mono-labs/cli` depend on it.

See the [Contributing guide](../../CONTRIBUTING.md) for full development setup.
