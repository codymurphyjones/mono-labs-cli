# Project Orchestration Utilities (src/project)

This document explains the purpose and design of the `src/project` module.

---

## What This Module Is

`src/project` contains **project-level orchestration utilities**.

It is not CLI logic. It is not infrastructure code.

It is the glue that allows a monorepo to behave consistently across:

- packages
- environments
- tools
- workflows

---

## Core Responsibilities

The project module is responsible for:

- Merging environment variables
- Normalizing configuration across packages
- Managing project-level state
- Coordinating toolchains
- Supporting multi-environment setups

This logic intentionally lives outside `.mono` so it can be:

- reused programmatically
- shared with CI
- imported by infra tooling

---

## Key Capabilities

### Environment Merging

Combines multiple `.env` sources into a deterministic result:

- base env
- environment-specific overrides
- injected runtime values

This prevents env drift across:

- dev machines
- CI runners
- deployment environments

---

### Project Initialization & Configuration

Provides helpers to:

- bootstrap new environments
- validate configuration
- manage project metadata

This ensures every environment starts from the same assumptions.

---

### Monorepo Coordination

Used to:

- align tooling across packages
- share configuration safely
- avoid per-package duplication

---

## Why This Matters

Without a project layer:

- logic leaks into CI YAML
- scripts become duplicated
- configuration becomes implicit

With `src/project`:

- configuration is explicit
- behavior is testable
- tooling is reusable

---

## When to Extend This Module

Extend `src/project` when:

- adding new environment strategies
- integrating new tooling
- normalizing behavior across packages

Do NOT put CLI parsing or command execution logic here.

---

## Relationship to CLI

The CLI uses this module. CI pipelines can use this module. Infrastructure
tooling can use this module.

This is intentional.

---

## Design Principle

Project orchestration should be:

- boring
- predictable
- reusable
- invisible to end users

If developers notice it, it’s doing too much.
