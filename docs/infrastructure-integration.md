# Infrastructure & CI Integration (src/cdk)

This document explains the role of the `src/cdk` module.

---

## What This Module Is

`src/cdk` provides **infrastructure and deployment primitives** designed to
integrate directly with mono-labs workflows.

It is not a wrapper around AWS CDK. It is a set of utilities that allow
infrastructure to participate in the same orchestration model as local
development.

---

## Core Responsibilities

- Define reusable CDK helpers
- Compose stacks programmatically
- Share infra logic between dev and CI
- Avoid duplicating deployment logic in pipelines

---

## Why This Exists

In most projects:

- infra logic lives only in CI
- dev workflows can’t run infra safely
- deployment scripts are not reusable

mono-labs fixes this by making infrastructure:

- importable
- composable
- testable
- environment-aware

---

## CI & Deployment Integration

The same primitives can be used to:

- synthesize stacks
- deploy resources
- tear down environments
- manage stage-specific behavior

This allows CI pipelines to:

- reuse local tooling
- share configuration with dev
- avoid YAML sprawl

---

## Relationship to .mono

`.mono` defines _when_ infrastructure runs. `src/cdk` defines _how_
infrastructure is built.

They are intentionally separate.

---

## Example Use Cases

- Local developers deploying ephemeral stacks
- CI deploying preview environments
- Shared infra logic across environments
- Consistent region/account handling

---

## Design Principle

Infrastructure should be:

- code-first
- reusable
- environment-aware
- integrated into developer workflows

If infra behaves differently in CI than locally, the system has failed.

---

## Local WebSocket Emulation

`@mono-labs/dev` extends the infrastructure integration story to WebSockets.
It provides local API Gateway WebSocket emulation, allowing the same
`$connect`/`$disconnect`/message event flow used in production to be tested
locally against a real WebSocket server.

This means infrastructure integration patterns -- action routing, connection
lifecycle, channel subscriptions -- can be developed and debugged without
deploying to AWS.

See [`packages/dev/README.md`](../packages/dev/README.md) for the full API.
