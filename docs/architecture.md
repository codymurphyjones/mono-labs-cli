# Architecture: mono-labs CLI

This document explains HOW the CLI works internally so you can safely extend or
debug it.

## High-Level Flow

1. Root process loads `lib/index.js`, which imports all command modules
   (including `build-process`).
2. The `build-process` orchestrator (`lib/commands/build-process/index.js`)
   calls `boot()` to discover configuration under the `.mono/` directory.
3. Each JSON file (except `config.json`) becomes a CLI command:
   `yarn mono <fileName> [argument] [--flags]`.
4. The command definition is registered with Commander via `cliFactory.js`.
5. When a command runs:
   - Options & argument defaults are merged into a shared `dataLayer`.
   - `runMonoCommand()` executes preactions sequentially (foreground) and
     actions (background + final foreground) with token replacement.
   - Outputs like `{out:ngrok_api https://1234.ngrok.io}` from preactions
     populate the `dataLayer` automatically for later substitution.

## Module Responsibilities

> **Note:** Source files are TypeScript (`.ts`). The `.js` references below refer to
> their compiled counterparts in `dist/`.

| Module                      | Responsibility                                                                 |
| --------------------------- | ------------------------------------------------------------------------------ | ---------- |
| `boot.js`                   | Loads `.mono` config files and returns `{ rootDir, rootJson, files, config }`. |
| `cliFactory.js`             | Dynamically builds Commander commands from each config file.                   |
| `dataLayer.js`              | Central mutable key/value store for dynamic tokens and defaults.               |
| `validators.js`             | Enforces enumerated option values (e.g., platform must be one of `ios          | android`). |
| `runMonoCommand.js`         | Orchestrates preactions + actions and environment selection.                   |
| `runners/runForeground.js`  | Spawns a command; captures output; extracts `{out:key value}` tokens.          |
| `runners/runBackground.js`  | Spawns background or attached commands with environment + token substitution.  |
| `runners/processManager.js` | Tracks background processes and ensures cleanup on signals.                    |

## Execution Lifecycle

```
boot() -> discover .mono files
  files = { dev: {...}, deploy: {...}, test: {...}, ... }
  config = contents of config.json (workspace/global rules)

buildCommands(files)
  for each (name, configObject):
    program.command(name)
      .argument(if defined)
      .option(derived from configObject.options)
      .action(handler)

handler(arg, cmd)
  opts = cmd.opts()
  verifyOptionValue for each enumerated option
  mergeData({ ...opts, arg }) // shared store
  runMonoCommand(configObject, opts)

runMonoCommand()
  envObj = options.stage ? environments.stage : environments.dev
  envObj.AWS_PROFILE = CDK_DEPLOY_PROFILE || 'default'

  // Phase A
  for preaction in preactions: runForeground(preaction)
    - capture stdout/stderr
    - parse {out:key value} tokens -> dataLayer[key] = value

  // Phase B
  background actions: runBackground(detached)
  last action: runBackground(attached=true) (interactive)
  finally killAllBackground()
```

## Data Layer & Token Substitution

- `dataLayer` starts with defaults from option definitions (if `default`
  provided) and the final argument (`arg`).
- Preactions can inject dynamic values using structured output:
  `{out:tokenName value}` (must appear on stdout/stderr line).
- These values are substituted in two places:
  1. Environment variable values in `environments.dev` / `environments.stage`
     using `${token}`.
  2. Action command strings themselves, e.g.
     `yarn workspace infra deploy -c owner=${arg}`.

If a token isn't found, the literal `${token}` text remains (no crash).

## Environment Selection

If the user passes `--stage`, the `stage` environment block is used; otherwise
`dev`.

Added automatically:
`AWS_PROFILE = process.env.CDK_DEPLOY_PROFILE || 'default'`.

## Preactions vs Actions

| Phase                    | Purpose                                       | Blocking?                                   | Output Handling                   |
| ------------------------ | --------------------------------------------- | ------------------------------------------- | --------------------------------- |
| Preactions               | Setup tasks (start services, generate values) | Sequential & awaited                        | Token parsing populates dataLayer |
| Background Actions       | Long-running services                         | Started and awaited individually until exit | No output (ignored)               |
| Foreground Action (last) | Primary interactive job                       | Attached to terminal                        | Live output                       |

## Signals & Cleanup

- `SIGINT` (Ctrl+C) or `SIGTERM` triggers `killAllBackground()`.
- On POSIX, background processes are spawned detached in their own group; group
  kill uses `process.kill(-pid, 'SIGTERM')`.
- On Windows, `taskkill /PID <pid> /T /F` is used.

## Adding a New Internal Capability

1. Need another token format? Edit `TOKEN_RX` in `runForeground.js`.
2. Want parallel preactions? Replace the sequential `for..of` with `Promise.all`
   (mind race conditions with tokens).
3. Need validation beyond enumerations? Extend `validators.js` and call from
   `cliFactory.js`.

## Error Propagation

- Foreground failures reject the promise with exit code and last line for
  context.
- Background failures reject individually; you can wrap calls with `.catch()` if
  you want a tolerant mode.

## Design Goals

- Declarative behavior via `.mono/*.json`.
- Zero code changes required to add new commands.
- Deterministic, log-rich execution with simple extension points.

---

## Related Packages

The CLI is one of four packages in the mono-labs monorepo:

- **[`@mono-labs/project`](../packages/project/README.md)** -- Project config & env utilities. Root discovery, `.mono` config loading, env merging, CDK base class. Sits at the base of the dependency graph.
- **[`@mono-labs/expo`](../packages/expo/README.md)** -- Expo/EAS build utilities. Token replacement, Expo config setup, env filtering for EAS builds. Depends on `@mono-labs/project`.
- **[`@mono-labs/dev`](../packages/dev/README.md)** -- Local dev server & WebSocket adapter. Maps Lambda handlers to Express routes, emulates API Gateway WebSocket connections, provides Redis caching. Independent (no internal deps).

---

See `configuration.md` next for the JSON schema details.
