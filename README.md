# mono-labs

Declarative monorepo orchestration, project tooling, and infrastructure
integration — built to scale real systems, not just scripts.

---

## What This Is

mono-labs is a monorepo control plane.

It combines:

- a declarative, token-aware CLI runtime
- project-level orchestration utilities
- infrastructure and CI integration primitives

The goal is to make a monorepo behave like a single, coordinated system across:

- local development
- CI pipelines
- deployments
- infrastructure management

---

## What Problems It Solves

Most monorepos suffer from:

- duplicated scripts across packages
- environment drift between dev and CI
- infrastructure logic isolated in pipelines
- brittle bash scripts
- slow onboarding

mono-labs solves this by providing:

- declarative command definitions
- shared runtime state via tokens
- reusable project utilities
- programmatic CDK helpers
- one mental model for dev, CI, and deploy

---

## High-Level Architecture

mono-labs is intentionally layered:

1. `.mono/` Declarative command definitions (JSON).

2. CLI Runtime (`bin` + `lib`) Loads `.mono`, builds commands, executes
   workflows, manages processes.

3. Project Orchestration (`src/project`) Environment merging, configuration
   management, monorepo utilities.

4. Infrastructure Integration (`src/cdk`) CDK helpers, stack orchestration,
   CI-friendly deployment primitives.

Each layer can be used independently, but they are designed to work together.

---

## Quick Start

Create a `.mono` directory and add:

.mono/hello.json

{ "actions": ["echo Hello World"] }

Run:

yarn mono hello

---

## Typical Developer Workflow

yarn mono dev yarn mono serve yarn mono mobile

If unsure:

yarn mono help

---

## Documentation Index

Start here:

- docs/README.txt

Key docs:

- docs/architecture.md
- docs/configuration.md
- docs/examples.md
- docs/troubleshooting.md

Advanced:

- docs/project-orchestration.md
- docs/infrastructure-integration.md

---

## Who This Is For

mono-labs is designed for teams that:

- run full-stack systems
- manage real infrastructure
- care about reproducibility
- want dev and CI to behave the same

---

## License

MIT © Contributors
