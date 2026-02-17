# CDK Foundation & Project Integration

## Overview

CDK and project utilities live in `@mono-labs/project` under two subpath exports:
- `@mono-labs/project/stack` -- Infrastructure definition (CDK)
- `@mono-labs/project/project` -- Configuration loading and environment management

These handle complementary responsibilities: CDK defines _what_ infrastructure
looks like, while project utilities load _how_ the application is configured at
runtime.

---

## CDK: `packages/project/src/stack/index.ts`

Provides `CustomStack`, an abstract base class extending `cdk.Stack` with
mono-labs conventions for multi-owner, multi-region deployments.

### `CustomStack`

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

**Constructor behavior:**
- Resolves AWS account from `props.env.account` -> `AWS_ACCOUNT` env var -> `cdk.Aws.ACCOUNT_ID`
- Resolves region from `props.env.region` -> `AWS_REGION` env var -> `us-east-2` (default)
- Sets `ownerName` from props (defaults to `'dev'`)
- Calls `loadMergedEnv()` at module load time to inject `.env` values

**`initializeStackConfig()`:**
- Reads CDK context overrides: `--context owner=<name>`, `--context region=<region>`, `--context enableNATGateway=<bool>`
- Production owners (`prod`/`production`) enable NAT Gateway by default

### `CustomStackProps`

```typescript
interface CustomStackProps extends cdk.StackProps {
  ownerName?: string
  region?: string
  enableNATGateway?: boolean
  domainName?: string
}
```

### Usage

```typescript
import { CustomStack, CustomStackProps } from '@mono-labs/project/stack'

class MyStack extends CustomStack {
  constructor(scope: Construct, id: string, props?: CustomStackProps) {
    super(scope, id, props)
    this.initializeStackConfig()
    // Define resources...
  }
}
```

---

## Project Utilities: `packages/project/src/project/`

### App Configuration

```typescript
import { loadAppConfig, loadProjectConfig } from '@mono-labs/project/project'
```

**`loadAppConfig(configType?, startDir?)`** loads typed config files
(`mono.app.json`, `mono.deployment.json`, etc.) with two modes:

1. **Local development** -- Walks up from `startDir` to find the workspace root,
   then resolves the config file relative to the project directory.
2. **Lambda runtime** -- Detects the Lambda environment and loads bundled config
   from the function's directory.

Returns `{ config, meta }` where `meta` includes workspace detection details.

`loadProjectConfig` is an alias for `loadAppConfig`.

### Environment Merging

```typescript
import { loadMergedEnv } from '@mono-labs/project/project'
```

**`loadMergedEnv()`** reads `.env` and `.env.local` from the project root, merges
them (`.env.local` takes precedence), and injects into `process.env` without
overwriting existing variables.

### Environment Filtering

```typescript
import { filterEnvByPrefixes, filterEnvByConfig } from '@mono-labs/project/project'
```

**`filterEnvByPrefixes(env, prefixes, include?)`** returns only env vars whose keys
start with one of the given prefixes (or are in the `include` list).

**`filterEnvByConfig(env?, include?)`** reads prefixes from `.mono/config.json`
`envMap` and combines them with default prefixes (`MONO_`, `EAS_`, `APP_`,
`TAMAGUI_`).

---

## Architectural Distinction

| Concern | Module | Responsibility |
|---------|--------|---------------|
| Infrastructure _definition_ | `@mono-labs/project/stack` | Abstract CDK base class, region/owner resolution, NAT Gateway config |
| Configuration _loading_ | `@mono-labs/project/project` | Config file discovery (local + Lambda), env merging, env filtering |

Both are exported from `@mono-labs/project` via subpath exports and share no
runtime state. CDK stacks call `loadMergedEnv()` at import time to ensure
environment variables are available during synthesis.
