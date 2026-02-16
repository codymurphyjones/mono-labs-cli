# @mono-labs/cli

The CLI runtime for Mono. Reads `.mono/` JSON command definitions and executes them with environment management, token replacement, and process orchestration.

## Installation

```bash
yarn add -D @mono-labs/cli
```

This makes the `mono` binary available in your project:

```bash
yarn mono <command> [argument] [--options]
```

## Usage

```bash
# Run a command defined in .mono/dev.json
yarn mono dev

# Pass an argument
yarn mono deploy stage

# Use options
yarn mono deploy --region us-west-2

# Run a workspace command (falls back to yarn workspace)
yarn mono web dev

# Built-in tools
yarn mono tools prune

# Config management
yarn mono config list
```

## Exports

The package provides several subpath exports for use in other packages:

| Export | Description |
|--------|-------------|
| `@mono-labs/cli` | Core utilities: `setData`, `getData`, `mergeData`, `hasData`, `replaceTokens`, `generateNewEnvList`, `filterUnwantedEnvVars`, `filterUnwantedEnvVarsEAS`, `boot`, `getMonoConfig`, `getRootDirectory`, `getRootJson`, `buildCommands`, `runMonoCommand`, `verifyOptionValue` |
| `@mono-labs/cli/project` | Re-exports from `@mono-labs/project`: `findProjectRoot`, `getRootDirectory`, `getRootJson`, `resolveMonoDirectory`, `getMonoFiles`, `getMonoConfig`, `loadAppConfig`, `loadProjectConfig`, `loadMergedEnv` |
| `@mono-labs/cli/expo` | Re-exports from `@mono-labs/expo`: `replaceTokens`, `setUpConfig`, `filterUnwantedEnvVarsEAS` |
| `@mono-labs/cli/tools` | Tooling utilities: `replaceTokens`, `setUpConfig` |
| `@mono-labs/cli/cdk` | CDK helpers: `replaceTokens`, `setUpConfig` |
| `@mono-labs/cli/stack` | `CustomStack` abstract class for AWS CDK stacks |

### Core API

```typescript
import {
  setData,
  getData,
  mergeData,
  hasData,
  replaceTokens,
  generateNewEnvList,
  filterUnwantedEnvVars,
  filterUnwantedEnvVarsEAS
} from "@mono-labs/cli";
```

**Data Layer** -- Shared key-value store used during command execution:

- `setData(key, value)` -- Set a value
- `getData(key?)` -- Get a value (or all data if no key)
- `mergeData(obj)` -- Merge an object into the data layer
- `hasData(key)` -- Check if a key exists

**Token Replacement:**

- `replaceTokens(str, env)` -- Replace `${key}` and `$KEY` patterns in a string using the data layer and environment

**Environment Utilities:**

- `generateNewEnvList(processEnv)` -- Map `MONO_*` vars to configured prefixes via `envMap`
- `filterUnwantedEnvVars(env)` -- Minimal env var filtering for local dev
- `filterUnwantedEnvVarsEAS(env)` -- Aggressive env var filtering for EAS builds

### Types

```typescript
import type {
  MonoConfig,
  OptionConfig,
  CommandConfig,
  MonoFiles,
  BootResult
} from "@mono-labs/cli";
```

## Development

Build the CLI package:

```bash
yarn build:cli
```

The binary entry point is `bin/mono.js`, which loads `dist/lib/index.js`. The command system is built on [Commander.js](https://github.com/tj/commander.js/).

See the [Contributing guide](../../CONTRIBUTING.md) for full development setup.
