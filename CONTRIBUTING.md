# Contributing to Mono

Thanks for your interest in contributing to Mono! This guide covers everything you need to get started.

## Getting Started

```bash
git clone https://github.com/codymurphyjones/mono-labs-cli.git
cd mono-labs-cli
yarn install
yarn build
```

## Repository Structure

```
mono-labs-cli/
  packages/
    cli/           # @mono-labs/cli - The CLI runtime
    project/       # @mono-labs/project - Project config & env utilities
    expo/          # @mono-labs/expo - Expo/EAS build utilities
  scripts/
    bump-version.js  # Automated version bumping
  docs/            # Documentation
  .mono-exanples/  # Example command definitions
```

This is a yarn workspaces monorepo. All three packages are published to npm under the `@mono-labs` scope.

## Package Dependency Graph

```
@mono-labs/project  (no internal deps)
       |
       v
@mono-labs/expo     (depends on project)
       |
       v
@mono-labs/cli      (depends on project + expo)
```

Build order matters -- `project` must build before `expo`, and both before `cli`.

## Development Workflow

### Building

Build all packages (respects TypeScript project references):

```bash
yarn build
```

Build individual packages:

```bash
yarn build:project
yarn build:expo
yarn build:cli
```

### Making Changes

1. Make your changes in the relevant `packages/*/src/` directory
2. Run `yarn build` to compile
3. Test locally by running `yarn mono` commands in a test project that depends on `@mono-labs/cli`

### Testing Locally

To test the CLI in another project, link it:

```bash
cd packages/cli
yarn link
# In your test project:
yarn link @mono-labs/cli
```

## Code Style

- TypeScript with CommonJS output (ES2022 target)
- No specific linter is configured -- follow existing patterns in the codebase
- Keep functions focused and files reasonably sized

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes and build: `yarn build`
4. Commit with a descriptive message
5. Push to your fork and open a pull request against `main`
6. Describe what your PR does and why

## Deployment

The deploy process is handled via a single command at the repo root:

```bash
yarn deploy
```

This runs the `scripts/bump-version.js` script to increment the patch version across all packages, commits the version bump, and publishes all three packages to npm. Only maintainers with npm publish access can deploy.
