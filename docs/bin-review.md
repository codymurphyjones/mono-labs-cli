# CLI Binary Entry Point

## Overview

The Mono CLI binary lives at `packages/cli/bin/mono.js`. It is a two-line Node.js
shebang script that bootstraps the CLI by requiring the compiled TypeScript output.

## File

### `packages/cli/bin/mono.js`

```js
#!/usr/bin/env node
require('../dist/lib/index.js')
```

- **Line 1** -- Standard Node.js shebang, allowing direct execution on Unix systems.
- **Line 2** -- Requires the compiled entry point (`dist/lib/index.js`), which loads
  Commander, registers all commands, and starts parsing `process.argv`.

The binary performs no logic itself. All CLI behavior is defined in the `lib/`
TypeScript source tree and compiled to `dist/lib/`.

## Registration

The binary is registered in `packages/cli/package.json` via the `bin` field:

```json
{
  "bin": {
    "mono": "./bin/mono.js"
  }
}
```

When the package is installed (locally or globally), this makes the `mono` command
available. In a yarn workspaces monorepo, it is typically invoked as:

```bash
yarn mono <command> [argument] [--options]
```

## How It Connects to the Rest of the CLI

```
bin/mono.js
  -> require('../dist/lib/index.js')
     -> lib/index.ts (source)
        -> imports lib/app.ts (Commander program)
        -> imports lib/commands/prune/ (prune command)
        -> imports lib/commands/build-process/ (dynamic .mono commands)
```

See [Architecture](architecture.md) for the full execution lifecycle.
