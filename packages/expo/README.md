# @mono-labs/expo

Expo and EAS build utilities for Mono. Provides environment variable filtering, Expo config setup, and token replacement for Expo/React Native projects.

## Installation

```bash
yarn add @mono-labs/expo
```

**Peer dependency:** `expo >= 52` (optional)

## API Reference

### Config Setup

```typescript
import { setUpConfig } from "@mono-labs/expo";
```

- **`setUpConfig(config)`** -- Transforms an Expo `app.json` config into a fully resolved `ExpoConfig` with environment variable injection. Filters `NEXT_PUBLIC_*` vars, sets up EAS project ID, and configures router settings.

### Token Replacement

```typescript
import { replaceTokens } from "@mono-labs/expo";
```

- **`replaceTokens(input, tokens)`** -- Replaces `${KEY}` and `$KEY` patterns in a string using the provided tokens object. Data layer values take priority over environment variables.

### Environment Filtering

```typescript
import {
  filterUnwantedEnvVars,
  filterUnwantedEnvVarsEAS,
  generateNewEnvList
} from "@mono-labs/expo";
```

- **`filterUnwantedEnvVars(env)`** -- Minimal filtering for local development. Removes only `npm_config_force`.
- **`filterUnwantedEnvVarsEAS(env)`** -- Aggressive filtering for EAS cloud builds. Removes 50+ system and developer tool variables (Windows paths, VS Code, Git, Node internals, etc.) to keep the EAS build environment clean.
- **`generateNewEnvList(processEnv)`** -- Maps `MONO_*` prefixed environment variables to configured prefixes using the `envMap` from `.mono/config.json`. Variables containing `SECRET` in the name are excluded from mapping.

## Subpath Exports

| Export | Description |
|--------|-------------|
| `@mono-labs/expo` | All utilities: `replaceTokens`, `setUpConfig`, `filterUnwantedEnvVars`, `filterUnwantedEnvVarsEAS`, `generateNewEnvList` |
| `@mono-labs/expo/tools` | `replaceTokens`, `setUpConfig` |
| `@mono-labs/expo/cdk` | `replaceTokens`, `setUpConfig` |

## Development

Build the expo package:

```bash
yarn build:expo
```

This package depends on `@mono-labs/project` for config loading. Build `project` first if making changes to both.

See the [Contributing guide](../../CONTRIBUTING.md) for full development setup.
