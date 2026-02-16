# Mono

A declarative CLI for monorepo orchestration. Define commands as JSON, run them with `yarn mono`.

## What is Mono?

Mono lets you define complex CLI commands as simple JSON files in a `.mono/` directory. Run `yarn mono <command>` to execute them with built-in support for environments, preactions, background processes, and workspace management. One mental model for dev, CI, and deploy.

## Quick Start

Install the CLI as a dev dependency:

```bash
yarn add -D @mono-labs/cli
```

Create a `.mono/` directory at your project root and add a command definition:

```jsonc
// .mono/dev.json
{
  "preactions": ["docker compose up -d"],
  "actions": [
    "yarn workspace backend serve",
    "yarn workspace web dev"
  ],
  "environments": {
    "dev": {
      "API_URL": "http://localhost:3000"
    }
  }
}
```

Run it:

```bash
yarn mono dev
```

## Core Concepts

- **`.mono/` directory** -- JSON files that define commands, placed at your project root
- **Command definitions** -- Each `.json` file becomes a CLI command with arguments, options, and environment configs
- **Environments** -- Define `dev`, `stage`, and `prod` environment variable sets per command
- **Preactions & actions** -- Preactions run sequentially first; actions run in parallel with the last one in the foreground
- **Token system** -- Capture output from preactions with `{out:field value}` and inject via `${field}` in environments and actions
- **Workspace mappings** -- Alias workspace names and run workspace commands with `yarn mono <alias> <script>`

## Packages

| Package | Description |
|---------|-------------|
| [`@mono-labs/cli`](packages/cli/README.md) | The CLI runtime -- reads `.mono/` definitions and executes commands |
| [`@mono-labs/project`](packages/project/README.md) | Project config & env utilities -- root discovery, `.mono` config loading, env merging |
| [`@mono-labs/expo`](packages/expo/README.md) | Expo/EAS build utilities -- env filtering, config setup, token replacement |

## Documentation

- [Getting Started Guide](docs/getting-started.md) -- Detailed walkthrough of setup, configuration, and command definitions
- [Contributing](CONTRIBUTING.md) -- Local dev setup, PR process, and repo structure

### Internal Reference

- [Architecture](docs/architecture.md) -- How the CLI works internally
- [Configuration Reference](docs/configuration.md) -- Full `.mono/` config schema
- [Examples & Walkthroughs](docs/examples.md) -- Real-world usage scenarios
- [Troubleshooting](docs/troubleshooting.md)
- [Project Orchestration](docs/project-orchestration.md)
- [Infrastructure Integration](docs/infrastructure-integration.md)

## CDK

Mono includes experimental CDK integration for infrastructure-as-code. See [CDK docs](docs/cdk.md).

## License

MIT
