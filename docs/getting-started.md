# Getting Started with Mono

This guide walks you through setting up Mono in your monorepo, creating command definitions, and understanding the configuration system.

## Prerequisites

- Node.js >= 20
- A yarn workspaces monorepo

## Installation

Install the CLI as a dev dependency at your monorepo root:

```bash
yarn add -D @mono-labs/cli
```

Verify the installation:

```bash
yarn mono --help
```

## Project Setup

Create a `.mono/` directory at your project root:

```bash
mkdir .mono
```

This is where all your command definitions and configuration live.

## Your First Command

Create `.mono/hello.json`:

```json
{
  "actions": ["echo Hello from Mono!"]
}
```

Run it:

```bash
yarn mono hello
```

The filename (minus `.json`) becomes the command name. Every JSON file in `.mono/` (except `config.json`) is registered as a CLI command.

### Adding Preactions

Preactions run sequentially before your main actions. They're useful for setup steps:

```json
{
  "preactions": ["docker compose up -d"],
  "actions": [
    "yarn workspace backend serve",
    "yarn workspace web dev"
  ]
}
```

- **Preactions** run one at a time in the foreground. Each must complete before the next starts.
- **Actions** run in parallel, except for the last one which runs in the foreground. When the foreground process exits, all background processes are cleaned up.

## Configuration

### `.mono/config.json`

This optional file configures global behavior. It does **not** create a command.

```json
{
  "workspace": {
    "packageMaps": {
      "web": "next-app",
      "app": "expo-app",
      "backend": "@my/backend",
      "ui": "@my/ui"
    },
    "preactions": ["cp .env ${dir}/.env"]
  },
  "envMap": ["NEXT_PUBLIC", "EXPO_PUBLIC"]
}
```

#### `workspace.packageMaps`

Maps short aliases to actual workspace package names. This lets you run:

```bash
yarn mono web dev
# equivalent to: yarn workspace next-app dev
```

#### `workspace.preactions`

Commands that run before any workspace action. The `${dir}` token is replaced with the resolved workspace directory.

#### `envMap`

An array of prefixes for the `MONO_*` environment variable mapping system. When you set `MONO_API_URL=https://example.com` and have `envMap: ["NEXT_PUBLIC"]`, Mono generates `NEXT_PUBLIC_API_URL=https://example.com` automatically.

## Command Definition Reference

Each `.mono/*.json` file (except `config.json`) defines a command. Here is the full schema:

### `argument`

A positional argument for the command:

```json
{
  "argument": {
    "type": "string",
    "description": "Target environment",
    "default": "dev",
    "options": ["dev", "stage", "prod"],
    "allowAll": false
  }
}
```

- `type` -- `"string"` (default)
- `default` -- Default value when not provided
- `options` -- Restrict to a set of allowed values
- `allowAll` -- Whether `"all"` is a valid value

### `options`

Named flags for the command:

```json
{
  "options": {
    "dev": {
      "description": "Run in dev mode",
      "shortcut": "d"
    },
    "region": {
      "type": "string",
      "description": "AWS region",
      "default": "us-east-2",
      "shortcut": "r",
      "options": ["us-east-1", "us-east-2", "us-west-2"]
    },
    "verbose": {
      "description": "Enable verbose output"
    }
  }
}
```

- Options without a `type` are boolean flags
- `shortcut` -- Single-character alias (e.g., `-d`)
- `options` -- Restrict to allowed values (string options only)

### `environments`

Environment variable sets keyed by environment name:

```json
{
  "environments": {
    "dev": {
      "API_URL": "http://localhost:3000",
      "DEBUG": "true"
    },
    "stage": {
      "API_URL": "https://staging.example.com",
      "DEBUG": "false"
    }
  }
}
```

The active environment is selected based on the command argument or option flags. The `dev` environment is used by default.

### `preactions`

An array of commands that run sequentially in the foreground before actions:

```json
{
  "preactions": [
    "docker compose up -d",
    "node scripts/setup"
  ]
}
```

Preactions can emit tokens for later use (see [Token System](#token-system)).

### `actions`

The main commands to execute:

```json
{
  "actions": [
    "yarn workspace backend serve",
    "yarn workspace web dev"
  ]
}
```

All actions except the last run as background processes. The last action runs in the foreground. When the foreground process exits, all background processes are terminated.

## Environment Variables

### `.env` / `.env.local` Merging

Mono automatically loads `.env` and `.env.local` files from your project root and merges them into `process.env`. Values in `.env.local` take precedence over `.env`, and existing environment variables are not overwritten.

### Token Replacement in Environment Values

Environment values support two forms of token replacement:

- `${token}` -- Replaced with a value from the data layer (set by preactions or options)
- `$ENV_VAR` -- Replaced with a value from `process.env`

Data layer values take priority over environment variables.

### `MONO_*` Prefix Mapping

When `envMap` is configured in `.mono/config.json`, environment variables prefixed with `MONO_` are automatically mapped to additional prefixed versions. For example, with `envMap: ["NEXT_PUBLIC"]`:

```
MONO_API_URL=https://example.com
```

Generates:

```
NEXT_PUBLIC_API_URL=https://example.com
```

Variables containing `SECRET` in the name are excluded from this mapping.

## Token System

The token system lets preactions pass data to subsequent actions and environment values.

### Emitting Tokens

In a preaction script, write to stdout in this format:

```
{out:field_name some value here}
```

For example, a script that sets up an ngrok tunnel might output:

```
{out:ngrok_api https://abc123.ngrok.io}
```

### Using Tokens

Reference captured tokens anywhere in your environment values or action commands:

```json
{
  "preactions": ["node scripts/ngrok_setup"],
  "actions": ["yarn workspace web dev"],
  "environments": {
    "dev": {
      "API_URL": "${ngrok_api}"
    }
  }
}
```

The `${ngrok_api}` token is replaced with the value captured from the preaction output. Command arguments and option values are also available as tokens -- `${arg}` for the positional argument, and `${option_name}` for each option.

## Workspace Integration

When you run a command that doesn't match any `.mono/*.json` file, Mono falls back to running it as a workspace command:

```bash
yarn mono web dev
# Resolves "web" via packageMaps -> "next-app"
# Runs: yarn workspace next-app dev
```

If `workspace.preactions` are configured, they run before the workspace command. The `${dir}` token in preactions is replaced with the resolved workspace directory path.

## Built-in Commands

### `mono tools prune`

Cleans up local git branches that have been deleted from the remote:

```bash
yarn mono tools prune
```

### Config Commands

Manage persistent CLI configuration:

```bash
yarn mono config set <key> <value>
yarn mono config get <key>
yarn mono config list
```

## Examples

The repository includes example command definitions in the `.mono-exanples/` directory that demonstrate common patterns:

- `config.json` -- Workspace aliases and global preactions
- `dev.json` -- Local development with Docker, preactions, and environment-specific variables
- `deploy.json` -- Infrastructure deployment with arguments and string options
- `expo.json` -- Expo development server with environment injection
- `test.json` -- Testing with platform selection via constrained option values
- `watch.json` -- File watching in dev mode

See the [Examples & Walkthroughs](examples.md) doc for detailed scenarios.
