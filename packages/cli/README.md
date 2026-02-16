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

The package provides the following export:

| Export | Description |
|--------|-------------|
| `@mono-labs/cli` | Core utilities: `setData`, `getData`, `mergeData`, `hasData`, `replaceTokens`, `boot`, `getMonoConfig`, `getRootDirectory`, `getRootJson`, `buildCommands`, `runMonoCommand`, `verifyOptionValue` |

### Core API

```typescript
import {
  setData,
  getData,
  mergeData,
  hasData,
  replaceTokens,
} from "@mono-labs/cli";
```

**Data Layer** -- Shared key-value store used during command execution:

- `setData(key, value)` -- Set a value
- `getData(key?)` -- Get a value (or all data if no key)
- `mergeData(obj)` -- Merge an object into the data layer
- `hasData(key)` -- Check if a key exists

**Token Replacement:**

- `replaceTokens(str, env)` -- Replace `${key}` and `$KEY` patterns in a string using the data layer and environment

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
