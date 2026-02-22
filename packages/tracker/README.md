# @mono-labs/tracker

Code notation tracker for scanning, parsing, and managing structured comment markers across your codebase.

<!-- Badges -->
![npm version](https://img.shields.io/npm/v/@mono-labs/tracker)
![license](https://img.shields.io/npm/l/@mono-labs/tracker)
![tests](https://img.shields.io/badge/tests-102%20passing-brightgreen)

---

## Table of Contents

- [Quick Start](#quick-start)
- [What is Tracker?](#what-is-tracker)
- [Notation Syntax Guide](#notation-syntax-guide)
  - [Basic Syntax](#basic-syntax)
  - [Inline IDs](#inline-ids)
  - [Multi-line Notations](#multi-line-notations)
  - [Code Context Capture](#code-context-capture)
  - [Attribute Styles](#attribute-styles)
  - [Actions](#actions)
  - [Relationships](#relationships)
  - [Performance Impact](#performance-impact)
  - [Technical Debt](#technical-debt)
  - [Priority Shorthand](#priority-shorthand)
  - [Risk Shorthand](#risk-shorthand)
- [Configuration](#configuration)
- [Core API Walkthrough](#core-api-walkthrough)
  - [Scanning Files](#scanning-files)
  - [NotationManager](#notationmanager)
  - [Querying](#querying)
  - [Storage](#storage)
  - [Utilities](#utilities)
  - [Relationships & Validation](#relationships--validation)
  - [Mutation Helpers](#mutation-helpers)
  - [Executor Framework](#executor-framework)
- [Full Type Reference](#full-type-reference)
- [Architecture](#architecture)
- [Contributor Guide](#contributor-guide)
- [License](#license)

---

## Quick Start

Install the package:

```bash
yarn add @mono-labs/tracker
```

Scan your project and view results in three steps:

```ts
import { loadConfig, scanFiles, NotationManager } from '@mono-labs/tracker'

// 1. Load config (reads tracker.config.json or uses defaults)
const config = loadConfig(process.cwd())

// 2. Scan source files for notations
const notations = await scanFiles(config)

// 3. Manage and query results
const manager = new NotationManager(config)
manager.setAll(notations)
await manager.save()

console.log(manager.stats())
console.log(manager.query({ type: 'TODO', priority: 'high' }))
```

---

## What is Tracker?

Codebases accumulate structured comments — `TODO`, `FIXME`, `BUG`, `HACK`, `NOTE`, `OPTIMIZE`, `SECURITY` — scattered across hundreds of files. These carry intent, ownership, deadlines, and technical debt information, but they're invisible to your tooling.

**Tracker** solves this by providing a pipeline to:

1. **Scan** — Discover notation comments via configurable glob patterns
2. **Parse** — Extract structured data: priority, assignee, tags, due dates, actions, relationships, performance impact, and technical debt
3. **Persist** — Store results in append-friendly JSONL format with atomic writes
4. **Query** — Filter notations by any combination of fields
5. **Validate** — Check for missing fields, duplicate IDs, broken references, and circular dependencies
6. **Report** — Compute aggregate statistics across your notations
7. **Execute** — Dispatch parsed actions to registered handler functions

### Supported Marker Types

| Marker     | Purpose                              |
|------------|--------------------------------------|
| `TODO`     | Planned work                         |
| `FIXME`    | Known issue needing a fix            |
| `BUG`      | Confirmed defect                     |
| `HACK`     | Temporary workaround                 |
| `NOTE`     | Informational annotation             |
| `OPTIMIZE` | Performance improvement opportunity  |
| `SECURITY` | Security-related concern             |

---

## Notation Syntax Guide

### Basic Syntax

Single-line notation with a marker and description:

```ts
// TODO: Refactor this function to use async/await
```

The colon after the marker is optional:

```ts
// FIXME Broken on empty input
```

### Inline IDs

Assign a stable external ID using square brackets:

```ts
// TODO [TASK-123] Migrate to the new API
```

When no inline ID is provided, Tracker generates a deterministic ID from the file path and line number using SHA-256.

### Multi-line Notations

Continuation comment lines immediately following a marker are collected as the notation body:

```ts
// TODO: Refactor authentication module
// This function has grown too complex and handles
// both session management and token refresh.
// @author: Alice
// @priority: high
```

Continuation stops at blank lines, non-comment lines, or a new marker.

### Code Context Capture

Non-comment, non-empty lines immediately following the notation block are captured as code context:

```ts
// TODO: This query is too slow
// @priority: high
// Performance: 2000ms->100ms
const results = db.query('SELECT * FROM users')
const filtered = results.filter(u => u.active)
```

Here `results` and `filtered` lines are captured in the `codeContext` array.

### Attribute Styles

Tracker supports three attribute formats. All can be mixed within the same notation body.

#### 1. `@` Prefix Style

```ts
// TODO: Implement caching layer
// @author: Alice
// @assignee: Bob
// @priority: high
// @tags: performance, api
// @due: +2w
// @risk: moderate
```

#### 2. Compact Bracket Style

Pack multiple attributes into a single bracketed line. Segments are separated by `|`.

```ts
// TODO: Fix login redirect
// [Alice → Bob | high | 3d | due: 2/24/2026 | tags: auth, ui]
```

- **Arrow assignment** (`→` or `->`): sets `author` and `assignee`
- **Duration shorthand** (`3d`, `2w`, `1m`): sets due date relative to today (hours like `8h` set debt instead)
- **Key-value** (`due: 2/24/2026`): same as `@` prefix keys
- **Bare words** (`high`, `critical`): matched against priority/risk maps

#### 3. Key-Value Style

Capitalized key followed by colon and value:

```ts
// TODO: Update error handling
// Priority: critical
// Tags: ui, api
// Assignee: Charlie
// Debt: 8h | compounding: high
```

### Actions

Declare code transformation intentions with `Action:` lines:

```ts
// TODO: Clean up legacy code
// Action: replace(oldFunction, newFunction)
```

Chained calls for positional actions:

```ts
// TODO: Add error boundary
// Action: insert(ErrorBoundary).before(App)
```

Supported action verbs: `replace`, `remove`, `rename`, `insert`, `extract`, `move`, `wrapIn`. Unrecognized verbs are parsed as `generic`.

```ts
// Action: remove(legacyHelper)
// Action: rename(fetchData, loadData)
// Action: extract(validateInput).to(validators.ts)
// Action: move(utils).to(shared/utils.ts)
// Action: wrapIn(rawQuery, sanitize)
```

### Relationships

Declare dependencies between notations:

```ts
// TODO: Implement logout
// Blocks: N-abc12345
// Depends on: N-def45678
// Related: N-ghi78901, N-jkl01234
```

Relationship keys: `Blocks`, `Blocked by`, `Depends on`, `Related`. All populate the `relationships` array with referenced IDs. Notation is considered _blocked_ if any related notation has a non-resolved status.

### Performance Impact

Track measured or expected performance changes:

```ts
// OPTIMIZE: Replace N+1 query with batch load
// Performance: 2000ms->100ms
```

Parsed into a `PerformanceImpact` object with `before`, `after`, and `unit` fields. Supported units: `ms`, `s`, `us`.

### Technical Debt

Estimate and track accumulated debt:

```ts
// HACK: Hardcoded timeout
// Debt: 8h | compounding: high
```

The hours value must use the `h` suffix. Compounding rate is `low`, `medium`, or `high` (defaults to `low`).

### Priority Shorthand

| Shorthand | Full Value |
|-----------|-----------|
| `m1`      | `minimal` |
| `l2`      | `low`     |
| `m3`, `med` | `medium`  |
| `h4`      | `high`    |
| `c5`      | `critical`|

### Risk Shorthand

| Shorthand | Full Value  |
|-----------|------------|
| `m1`      | `minimal`  |
| `l2`      | `low`      |
| `m3`, `mod` | `moderate` |
| `s2`      | `severe`   |
| `c3`      | `critical` |

---

## Configuration

Create a `tracker.config.json` in your project root:

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["**/node_modules/**", "**/dist/**", "**/*.test.ts"],
  "markers": ["TODO", "FIXME", "BUG"],
  "storagePath": ".tracker/notations.jsonl",
  "idPrefix": "N"
}
```

### Default Configuration

If no config file is found, or for any omitted fields, these defaults apply:

```ts
const DEFAULT_CONFIG: TrackerConfig = {
  rootDir: '.',
  include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  markers: ['TODO', 'FIXME', 'BUG', 'HACK', 'NOTE', 'OPTIMIZE', 'SECURITY'],
  storagePath: '.tracker/notations.jsonl',
  idPrefix: 'N',
}
```

### `loadConfig(projectRoot: string): TrackerConfig`

Reads `tracker.config.json` from `projectRoot`, merges with `DEFAULT_CONFIG`, and sets `rootDir` to `projectRoot`. If the file is missing or contains invalid JSON, defaults are used silently.

### `TrackerConfig` Interface

| Field         | Type         | Description                                      |
|---------------|--------------|--------------------------------------------------|
| `rootDir`     | `string`     | Absolute root directory (set by `loadConfig`)     |
| `include`     | `string[]`   | Glob patterns for files to scan                   |
| `exclude`     | `string[]`   | Glob patterns for files to skip                   |
| `markers`     | `MarkerType[]` | Which marker types to recognize                 |
| `storagePath` | `string`     | Path to the JSONL storage file (relative to root) |
| `idPrefix`    | `string`     | Prefix for generated notation IDs                 |

---

## Core API Walkthrough

### Scanning Files

#### `scanFiles(config: TrackerConfig, rootDir?: string): Promise<Notation[]>`

Discovers files matching `config.include` (excluding `config.exclude`) using [fast-glob](https://github.com/mrmlnc/fast-glob), reads each file, and parses all notations.

```ts
import { loadConfig, scanFiles } from '@mono-labs/tracker'

const config = loadConfig('/path/to/project')
const notations = await scanFiles(config)
console.log(`Found ${notations.length} notations`)
```

The optional `rootDir` parameter overrides `config.rootDir` for the scan.

#### `parseFileContent(filePath: string, content: string, idPrefix?: string): Notation[]`

Parses notation markers from a raw file string. Useful when you already have file content in memory.

```ts
import { parseFileContent } from '@mono-labs/tracker'

const source = `
// TODO: Implement validation
// @priority: high
function validate() {}
`

const notations = parseFileContent('src/validate.ts', source, 'N')
// notations[0].description === 'Implement validation'
// notations[0].priority === 'high'
// notations[0].codeContext === ['function validate() {}']
```

#### `parseAttributes(bodyLines: string[]): ParsedAttributes`

Parses attribute lines from a notation body independently. Returns a `ParsedAttributes` object.

```ts
import { parseAttributes } from '@mono-labs/tracker'

const attrs = parseAttributes([
  '@author: Alice',
  '@priority: high',
  '@tags: ui, perf',
])
// attrs.author === 'Alice'
// attrs.priority === 'high'
// attrs.tags === ['ui', 'perf']
```

#### `parseActions(bodyLines: string[]): NotationAction[]`

Parses `Action:` lines from a notation body independently.

```ts
import { parseActions } from '@mono-labs/tracker'

const actions = parseActions([
  'Action: replace(oldFn, newFn)',
  'Action: insert(guard).before(handler)',
])
// actions[0].args.verb === 'replace'
// actions[1].args.verb === 'insert'
// actions[1].args.position === 'before'
```

### NotationManager

The `NotationManager` class is the primary facade for loading, querying, mutating, and persisting notations.

#### Constructor

```ts
import { NotationManager, loadConfig } from '@mono-labs/tracker'

const config = loadConfig(process.cwd())
const manager = new NotationManager(config)
```

The storage file path is resolved from `config.storagePath` (relative paths resolve against `config.rootDir`).

#### `load(): Promise<void>`

Reads all notations from the JSONL storage file into memory.

```ts
await manager.load()
console.log(manager.getAll().length)
```

#### `save(): Promise<void>`

Writes all in-memory notations to the JSONL storage file (atomic write via tmp + rename).

```ts
manager.setAll(notations)
await manager.save()
```

#### `getAll(): Notation[]`

Returns a shallow copy of all notations currently in memory.

#### `getById(id: string): Notation | undefined`

Returns a single notation by its ID, or `undefined` if not found.

```ts
const notation = manager.getById('N-abc12345')
```

#### `setAll(notations: Notation[]): void`

Replaces all in-memory notations with a new array (shallow copy).

#### `query(q: NotationQuery): Notation[]`

Filters notations by any combination of query fields. See [Querying](#querying) for full filter reference.

```ts
const critical = manager.query({ priority: 'critical', status: 'open' })
```

#### `update(id: string, updates: Partial<Notation>): boolean`

Merges `updates` into the notation with the given ID. Returns `true` if the notation was found and updated, `false` otherwise.

```ts
manager.update('N-abc12345', { status: 'resolved', assignee: 'Bob' })
```

#### `validate(): ValidationError[]`

Runs full validation across all notations: field checks, duplicate IDs, broken references, and circular dependency detection.

```ts
const errors = manager.validate()
if (errors.length > 0) {
  console.error('Validation errors:', errors)
}
```

#### `stats(): NotationStats`

Computes aggregate statistics over all in-memory notations.

```ts
const s = manager.stats()
console.log(`Total: ${s.total}, Overdue: ${s.overdue}, Debt: ${s.totalDebtHours}h`)
```

### Querying

The `query()` method accepts a `NotationQuery` object. All fields are optional; multiple fields combine with AND logic.

| Field       | Type                           | Behavior                                                    |
|-------------|--------------------------------|-------------------------------------------------------------|
| `type`      | `MarkerType \| MarkerType[]`   | Match one or more marker types                              |
| `tags`      | `string[]`                     | Match notations containing _any_ of the specified tags      |
| `priority`  | `Priority \| Priority[]`       | Match one or more priority levels                           |
| `status`    | `Status \| Status[]`           | Match one or more statuses                                  |
| `file`      | `string`                       | Substring match against `location.file`                     |
| `assignee`  | `string`                       | Exact match against `assignee`                              |
| `overdue`   | `boolean`                      | If `true`, return only overdue non-resolved notations       |
| `blocked`   | `boolean`                      | If `true`, return only blocked notations                    |
| `search`    | `string`                       | Case-insensitive substring search in description, body, tags|
| `dueBefore` | `string`                       | ISO date string — notations due on or before this date      |
| `dueAfter`  | `string`                       | ISO date string — notations due on or after this date       |

Array values enable multi-select filtering:

```ts
manager.query({ type: ['TODO', 'BUG'], priority: ['high', 'critical'] })
```

### Storage

#### `JsonlStorage`

Low-level storage engine that persists notations as newline-delimited JSON.

```ts
import { JsonlStorage } from '@mono-labs/tracker'

const storage = new JsonlStorage('.tracker/notations.jsonl')
```

##### `readAll(): Promise<Notation[]>`

Reads and parses all lines from the JSONL file. Corrupt lines are silently skipped. Returns an empty array if the file doesn't exist.

##### `writeAll(notations: Notation[]): Promise<void>`

Atomically writes all notations: writes to a `.tmp` file first, then renames over the target. Creates parent directories if needed.

##### `append(notation: Notation): Promise<void>`

Appends a single notation as a new line to the file.

##### `appendBatch(notations: Notation[]): Promise<void>`

Appends multiple notations in a single write operation. No-ops on empty arrays.

### Utilities

#### `generateId(prefix?: string): string`

Generates a random ID using UUID v4. Default prefix is `'N'`.

```ts
import { generateId } from '@mono-labs/tracker'

generateId()      // 'N-a1b2c3d4'
generateId('T')   // 'T-e5f6a7b8'
```

#### `generateStableId(prefix: string, file: string, line: number): string`

Generates a deterministic ID from a file path and line number using SHA-256. Re-scanning the same file produces the same IDs, enabling incremental updates.

```ts
import { generateStableId } from '@mono-labs/tracker'

generateStableId('N', 'src/app.ts', 42)  // 'N-<8-char hash>'
```

#### `parseDate(input: string): string | null`

Parses date strings in multiple formats. Returns an ISO date string (`YYYY-MM-DD`) or `null`.

| Format           | Example        | Notes                          |
|------------------|----------------|--------------------------------|
| ISO              | `2026-02-24`   | Returned as-is                 |
| US               | `2/24/2026`    | `MM/DD/YYYY`, zero-padding optional |
| Relative days    | `+3d`          | 3 days from today              |
| Relative weeks   | `+2w`          | 14 days from today             |
| Relative months  | `+1m`          | 1 month from today             |
| Relative years   | `+1y`          | 1 year from today              |

```ts
import { parseDate } from '@mono-labs/tracker'

parseDate('2026-02-24')  // '2026-02-24'
parseDate('2/24/2026')   // '2026-02-24'
parseDate('+2w')         // ISO date 14 days from now
```

#### `isOverdue(dateStr: string): boolean`

Returns `true` if the given ISO date string is in the past (compared at end of day, 23:59:59).

```ts
import { isOverdue } from '@mono-labs/tracker'

isOverdue('2020-01-01')  // true
isOverdue('2099-12-31')  // false
```

### Relationships & Validation

#### `getBlockers(notation: Notation, allNotations: Notation[]): Notation[]`

Returns all notations referenced in `notation.relationships` that have a non-resolved status.

#### `isBlocked(notation: Notation, allNotations: Notation[]): boolean`

Returns `true` if the notation has any unresolved blockers.

```ts
import { isBlocked, getBlockers } from '@mono-labs/tracker'

const blockers = getBlockers(myNotation, allNotations)
if (isBlocked(myNotation, allNotations)) {
  console.log('Blocked by:', blockers.map(b => b.id))
}
```

#### `detectCircularDependencies(notations: Notation[]): string[][]`

Uses DFS to detect cycles in the relationship graph. Returns an array of cycles, where each cycle is an array of notation IDs forming the loop.

```ts
import { detectCircularDependencies } from '@mono-labs/tracker'

const cycles = detectCircularDependencies(allNotations)
// [['N-abc', 'N-def', 'N-abc']]
```

#### `validateNotation(notation: Notation): ValidationError[]`

Validates a single notation for:
- Missing `id`, `description`, or `location.file`
- Invalid `type`, `status`, `priority`, or `risk` values

#### `validateAll(notations: Notation[]): ValidationError[]`

Validates all notations and additionally checks for:
- Duplicate IDs
- Broken relationship references (IDs not in the set)
- Circular dependencies

```ts
import { validateAll } from '@mono-labs/tracker'

const errors = validateAll(notations)
for (const err of errors) {
  console.error(`${err.notationId} [${err.field}]: ${err.message}`)
}
```

#### `computeStats(notations: Notation[]): NotationStats`

Standalone function to compute statistics from a notation array (same logic as `manager.stats()`).

### Mutation Helpers

Immutable helper functions that return new `Notation` objects:

#### `updateStatus(notation: Notation, status: Status): Notation`

```ts
import { updateStatus, Status } from '@mono-labs/tracker'

const resolved = updateStatus(notation, Status.RESOLVED)
```

#### `addTag(notation: Notation, tag: string): Notation`

Adds a tag if not already present. Returns the same object if the tag exists.

```ts
import { addTag } from '@mono-labs/tracker'

const tagged = addTag(notation, 'urgent')
```

#### `removeTag(notation: Notation, tag: string): Notation`

```ts
import { removeTag } from '@mono-labs/tracker'

const untagged = removeTag(notation, 'stale')
```

#### `setAssignee(notation: Notation, assignee: string): Notation`

```ts
import { setAssignee } from '@mono-labs/tracker'

const assigned = setAssignee(notation, 'Alice')
```

### Executor Framework

The executor provides a plugin-based system for dispatching parsed actions to handler functions.

#### `registerActionHandler(verb: string, handler: ActionHandler): void`

Registers a handler function for a specific action verb.

```ts
import { registerActionHandler } from '@mono-labs/tracker'
import type { ActionHandler } from '@mono-labs/tracker'

const myHandler: ActionHandler = async (action) => {
  // Implement your logic here
  return { success: true, message: 'Done', verb: action.verb }
}

registerActionHandler('replace', myHandler)
```

#### `executeAction(action: NotationAction): Promise<ActionResult>`

Dispatches an action to the registered handler for its verb. Returns `{ success: false }` if no handler is registered.

```ts
import { executeAction } from '@mono-labs/tracker'

for (const action of notation.actions) {
  const result = await executeAction(action)
  if (!result.success) {
    console.error(`Failed: ${result.message}`)
  }
}
```

#### Built-in Stubs

Three stub handlers are exported for reference and testing. They return `success: true` with a descriptive message but perform no actual file operations:

- `handleReplace` — Stub for `replace` actions
- `handleRemove` — Stub for `remove` actions
- `handleRename` — Stub for `rename` actions

Register them if you want safe no-op handling:

```ts
import { registerActionHandler, handleReplace, handleRemove, handleRename } from '@mono-labs/tracker'

registerActionHandler('replace', handleReplace)
registerActionHandler('remove', handleRemove)
registerActionHandler('rename', handleRename)
```

#### Writing a Custom Handler

```ts
import { registerActionHandler } from '@mono-labs/tracker'
import type { ActionHandler, NotationAction, ActionResult } from '@mono-labs/tracker'

const handleExtract: ActionHandler = async (action: NotationAction): Promise<ActionResult> => {
  if (action.args.verb !== 'extract') {
    return { success: false, message: 'Wrong verb', verb: action.verb }
  }
  const { target, destination } = action.args
  // ... perform extraction logic ...
  return { success: true, message: `Extracted ${target} to ${destination}`, verb: 'extract' }
}

registerActionHandler('extract', handleExtract)
```

---

## Full Type Reference

### Enums

All enums are defined as `const` objects with matching type aliases, enabling both runtime access and type safety.

#### `MarkerType`

```ts
'TODO' | 'FIXME' | 'BUG' | 'HACK' | 'NOTE' | 'OPTIMIZE' | 'SECURITY'
```

#### `Priority`

```ts
'minimal' | 'low' | 'medium' | 'high' | 'critical'
```

#### `RiskLevel`

```ts
'minimal' | 'low' | 'moderate' | 'severe' | 'critical'
```

#### `Status`

```ts
'open' | 'in_progress' | 'blocked' | 'resolved'
```

#### `CompoundingRate`

```ts
'low' | 'medium' | 'high'
```

#### `ActionVerb`

```ts
'replace' | 'remove' | 'rename' | 'insert' | 'extract' | 'move' | 'wrapIn' | 'generic'
```

### Interfaces

#### `Notation`

| Field         | Type                | Required | Description                                |
|---------------|---------------------|----------|--------------------------------------------|
| `id`          | `string`            | yes      | Unique identifier (inline or generated)    |
| `type`        | `MarkerType`        | yes      | The marker type                            |
| `description` | `string`            | yes      | First-line description text                |
| `body`        | `string[]`          | yes      | Continuation comment lines                 |
| `codeContext`  | `string[]`          | yes      | Code lines following the notation block    |
| `location`    | `SourceLocation`    | yes      | File, line, column, and optional endLine   |
| `author`      | `string`            | no       | Author name from attributes                |
| `assignee`    | `string`            | no       | Assignee name                              |
| `priority`    | `Priority`          | no       | Priority level                             |
| `risk`        | `RiskLevel`         | no       | Risk level                                 |
| `status`      | `Status`            | yes      | Current status (default: `'open'`)         |
| `tags`        | `string[]`          | yes      | Tags parsed from attributes                |
| `dueDate`     | `string`            | no       | ISO date string                            |
| `createdDate` | `string`            | no       | ISO date string                            |
| `performance` | `PerformanceImpact` | no       | Performance before/after measurement       |
| `debt`        | `TechnicalDebt`     | no       | Estimated debt hours and compounding rate  |
| `actions`     | `NotationAction[]`  | yes      | Parsed action instructions                 |
| `relationships` | `string[]`        | yes      | IDs of related notations                   |
| `rawBlock`    | `string`            | yes      | Original raw text of the notation block    |
| `scannedAt`   | `string`            | yes      | ISO timestamp of when the notation was scanned |

#### `SourceLocation`

| Field     | Type     | Required | Description                    |
|-----------|----------|----------|--------------------------------|
| `file`    | `string` | yes      | File path                      |
| `line`    | `number` | yes      | Start line (1-indexed)         |
| `column`  | `number` | yes      | Column offset (1-indexed)      |
| `endLine` | `number` | no       | End line of the notation block |

#### `PerformanceImpact`

| Field    | Type     | Description                          |
|----------|----------|--------------------------------------|
| `before` | `string` | Value before (e.g., `'2000ms'`)      |
| `after`  | `string` | Value after (e.g., `'100ms'`)        |
| `unit`   | `string` | Unit from the "after" value (`ms`, `s`, `us`) |

#### `TechnicalDebt`

| Field         | Type              | Description                    |
|---------------|-------------------|--------------------------------|
| `hours`       | `number`          | Estimated debt in hours        |
| `compounding` | `CompoundingRate` | How fast the debt grows        |

#### `NotationQuery`

| Field       | Type                           | Description                          |
|-------------|--------------------------------|--------------------------------------|
| `type`      | `MarkerType \| MarkerType[]`   | Filter by marker type(s)             |
| `tags`      | `string[]`                     | Filter by tag (OR match)             |
| `priority`  | `Priority \| Priority[]`       | Filter by priority level(s)          |
| `status`    | `Status \| Status[]`           | Filter by status(es)                 |
| `file`      | `string`                       | Substring match on file path         |
| `assignee`  | `string`                       | Exact assignee match                 |
| `overdue`   | `boolean`                      | Only overdue, non-resolved notations |
| `blocked`   | `boolean`                      | Only blocked notations               |
| `search`    | `string`                       | Full-text search (description, body, tags) |
| `dueBefore` | `string`                       | Due on or before this ISO date       |
| `dueAfter`  | `string`                       | Due on or after this ISO date        |

#### `NotationStats`

| Field            | Type                    | Description                      |
|------------------|-------------------------|----------------------------------|
| `total`          | `number`                | Total notation count             |
| `byType`         | `Record<string, number>`| Count per marker type            |
| `byPriority`     | `Record<string, number>`| Count per priority level         |
| `byStatus`       | `Record<string, number>`| Count per status                 |
| `byTag`          | `Record<string, number>`| Count per tag                    |
| `byAssignee`     | `Record<string, number>`| Count per assignee               |
| `overdue`        | `number`                | Number of overdue notations      |
| `blocked`        | `number`                | Number of blocked notations      |
| `totalDebtHours` | `number`                | Sum of all debt hours            |

#### `NotationAction`

| Field  | Type         | Description                    |
|--------|--------------|--------------------------------|
| `verb` | `ActionVerb` | The action verb                |
| `raw`  | `string`     | Original raw action string     |
| `args` | `ActionArgs` | Parsed arguments (discriminated union) |

#### `ActionArgs` Variants

| Variant       | Fields                                          |
|---------------|-------------------------------------------------|
| `ReplaceArgs` | `verb: 'replace'`, `target`, `replacement`      |
| `RemoveArgs`  | `verb: 'remove'`, `target`                      |
| `RenameArgs`  | `verb: 'rename'`, `from`, `to`                  |
| `InsertArgs`  | `verb: 'insert'`, `content`, `position` (`'before' \| 'after'`), `anchor` |
| `ExtractArgs` | `verb: 'extract'`, `target`, `destination`      |
| `MoveArgs`    | `verb: 'move'`, `target`, `destination`          |
| `WrapInArgs`  | `verb: 'wrapIn'`, `target`, `wrapper`            |
| `GenericArgs` | `verb: 'generic'`, `description`                 |

#### `TrackerConfig`

| Field         | Type           | Description                       |
|---------------|----------------|-----------------------------------|
| `rootDir`     | `string`       | Project root directory             |
| `include`     | `string[]`     | Glob patterns to include           |
| `exclude`     | `string[]`     | Glob patterns to exclude           |
| `markers`     | `MarkerType[]` | Marker types to recognize          |
| `storagePath` | `string`       | JSONL file path                    |
| `idPrefix`    | `string`       | Prefix for generated IDs           |

#### `ValidationError`

| Field        | Type     | Description                         |
|--------------|----------|-------------------------------------|
| `notationId` | `string` | ID of the notation with the error   |
| `field`      | `string` | Field name that failed validation   |
| `message`    | `string` | Human-readable error message        |

#### `ActionResult`

| Field     | Type      | Description                      |
|-----------|-----------|----------------------------------|
| `success` | `boolean` | Whether the action succeeded     |
| `message` | `string`  | Result or error message          |
| `verb`    | `string`  | The action verb that was executed|

#### `ActionHandler`

```ts
type ActionHandler = (action: NotationAction) => Promise<ActionResult>
```

#### `ParsedAttributes`

| Field          | Type                | Description                    |
|----------------|---------------------|--------------------------------|
| `author`       | `string \| undefined` | Parsed author                |
| `assignee`     | `string \| undefined` | Parsed assignee              |
| `priority`     | `Priority \| undefined` | Parsed priority            |
| `risk`         | `RiskLevel \| undefined` | Parsed risk level          |
| `tags`         | `string[]`            | Parsed tags                  |
| `dueDate`      | `string \| undefined` | Parsed due date (ISO)        |
| `createdDate`  | `string \| undefined` | Parsed created date (ISO)    |
| `performance`  | `PerformanceImpact \| undefined` | Parsed performance    |
| `debt`         | `TechnicalDebt \| undefined` | Parsed debt              |
| `relationships`| `string[]`            | Parsed relationship IDs      |

---

## Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                       Executor                          │
│         registerActionHandler · executeAction            │
├─────────────────────────────────────────────────────────┤
│                       Manager                           │
│  NotationManager · query · validate · stats · updaters  │
├─────────────────────────────────────────────────────────┤
│                       Scanner                           │
│    scanFiles · parseFileContent · parseAttributes       │
├─────────────────────────────────────────────────────────┤
│                       Storage                           │
│           JsonlStorage · loadConfig                     │
├─────────────────────────────────────────────────────────┤
│                       Utils                             │
│      generateId · generateStableId · parseDate          │
├─────────────────────────────────────────────────────────┤
│                       Types                             │
│    enums · Notation · Action · Config · Query · Stats   │
└─────────────────────────────────────────────────────────┘
```

Each layer depends only on layers below it.

### Source Tree

```
packages/tracker/
├── src/
│   ├── index.ts                          # Public barrel export
│   ├── types/
│   │   ├── index.ts                      # Type barrel
│   │   ├── enums.ts                      # MarkerType, Priority, RiskLevel, Status, CompoundingRate
│   │   ├── notation.ts                   # Notation, SourceLocation, NotationQuery, NotationStats
│   │   ├── action.ts                     # ActionVerb, NotationAction, all ActionArgs variants
│   │   └── config.ts                     # TrackerConfig, DEFAULT_CONFIG
│   ├── utils/
│   │   ├── index.ts                      # Utils barrel
│   │   ├── id-generator.ts              # generateId, generateStableId
│   │   ├── id-generator.test.ts
│   │   ├── date-parser.ts              # parseDate, isOverdue
│   │   └── date-parser.test.ts
│   ├── storage/
│   │   ├── index.ts                      # Storage barrel
│   │   ├── jsonl-storage.ts             # JsonlStorage class
│   │   ├── jsonl-storage.test.ts
│   │   └── config-loader.ts            # loadConfig
│   ├── scanner/
│   │   ├── index.ts                      # Scanner barrel
│   │   ├── file-scanner.ts             # scanFiles (glob + read + parse)
│   │   ├── notation-parser.ts          # parseFileContent
│   │   ├── notation-parser.test.ts
│   │   ├── attribute-parser.ts         # parseAttributes (3 style strategies)
│   │   ├── attribute-parser.test.ts
│   │   ├── action-parser.ts            # parseActions (chained call parser)
│   │   └── action-parser.test.ts
│   ├── manager/
│   │   ├── index.ts                      # Manager barrel
│   │   ├── notation-manager.ts         # NotationManager class
│   │   ├── notation-manager.test.ts
│   │   ├── notation-updater.ts         # updateStatus, addTag, removeTag, setAssignee
│   │   ├── relationship-manager.ts     # getBlockers, isBlocked, detectCircularDependencies
│   │   ├── validator.ts                # validateNotation, validateAll
│   │   └── stats.ts                    # computeStats
│   └── executor/
│       ├── index.ts                      # Executor barrel
│       ├── action-executor.ts           # registerActionHandler, executeAction
│       └── actions/
│           ├── index.ts                  # Action stubs barrel
│           ├── replace-action.ts        # handleReplace stub
│           ├── remove-action.ts         # handleRemove stub
│           └── rename-action.ts         # handleRename stub
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Design Decisions

- **JSONL storage** — Append-friendly format; each line is an independent JSON object, making it resilient to partial writes and easy to stream
- **Atomic writes** — `writeAll` writes to a `.tmp` file then renames, preventing data corruption on crash
- **Stable IDs** — `generateStableId` uses SHA-256 of `file:line`, so re-scanning produces the same IDs for unchanged notations
- **Corrupt line resilience** — `readAll` silently skips unparseable lines, so a single corrupt entry doesn't break the entire store
- **Immutable updaters** — Mutation helpers (`updateStatus`, `addTag`, etc.) return new objects, leaving originals unchanged
- **Plugin executor** — The handler registry decouples action parsing from execution, allowing consumers to implement their own file-modification logic

---

## Contributor Guide

### Prerequisites

- **Node.js** 20+
- **Yarn** 1.x (classic)
- **TypeScript** 5.9+

### Setup

```bash
git clone <repo-url>
cd mono-labs-cli
yarn install
yarn workspace @mono-labs/tracker build
```

### Project Structure

| Directory      | Purpose                                                |
|----------------|--------------------------------------------------------|
| `src/types/`   | All TypeScript types, enums, and config defaults       |
| `src/utils/`   | Pure utility functions (ID generation, date parsing)   |
| `src/storage/` | JSONL persistence and config file loading              |
| `src/scanner/` | File discovery, notation parsing, attribute/action extraction |
| `src/manager/` | High-level facade, querying, validation, stats, mutation helpers |
| `src/executor/`| Action dispatch registry and built-in handler stubs    |

### Development Workflow

```bash
# Edit source files in src/
# Build the package
yarn workspace @mono-labs/tracker build

# Run tests
yarn workspace @mono-labs/tracker test
```

### Testing

Tests use [Vitest](https://vitest.dev/) with colocated `.test.ts` files. Run them with:

```bash
yarn workspace @mono-labs/tracker test
```

#### Test Files

| File                                | Covers                                                     |
|-------------------------------------|------------------------------------------------------------|
| `utils/id-generator.test.ts`       | `generateId`, `generateStableId` — format, uniqueness, determinism |
| `utils/date-parser.test.ts`        | `parseDate`, `isOverdue` — ISO, US, relative formats       |
| `scanner/notation-parser.test.ts`  | `parseFileContent` — marker extraction, multi-line, code context, inline IDs |
| `scanner/attribute-parser.test.ts` | `parseAttributes` — all 3 styles, priority/risk maps, relationships |
| `scanner/action-parser.test.ts`    | `parseActions` — all verbs, chained calls, edge cases      |
| `storage/jsonl-storage.test.ts`    | `JsonlStorage` — read/write/append, atomic writes, corrupt line handling |
| `manager/notation-manager.test.ts` | `NotationManager`, `computeStats`, relationships, updaters, validation |

#### Writing Tests

Tests follow these patterns:

```ts
// Helper factory — override only what you need
function makeNotation(overrides: Partial<Notation> = {}): Notation {
  return {
    id: 'N-test001',
    type: 'TODO',
    description: 'Test notation',
    body: [],
    codeContext: [],
    location: { file: 'test.ts', line: 1, column: 1 },
    status: 'open',
    tags: [],
    actions: [],
    relationships: [],
    rawBlock: '// TODO: Test',
    scannedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Notation
}

// Temp directory pattern for storage tests
let tmpDir: string
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tracker-test-'))
})
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})
```

### Adding a New Marker Type

1. **`src/types/enums.ts`** — Add the new value to the `MarkerType` const object
2. **`src/types/config.ts`** — Add it to `DEFAULT_CONFIG.markers`
3. **`src/scanner/notation-parser.ts`** — Add it to the `MARKER_REGEX` alternation
4. **Tests** — Add test cases in `notation-parser.test.ts`

### Adding a New Attribute

1. **`src/scanner/attribute-parser.ts`** — Add a case in `applyKeyValue()` for the new key
2. **`src/scanner/attribute-parser.ts`** — Update `ParsedAttributes` interface if a new field is needed
3. **`src/types/notation.ts`** — Add the field to `Notation` if it's a new top-level field
4. **`src/scanner/notation-parser.ts`** — Map the parsed attribute to the `Notation` object
5. **Tests** — Add test cases in `attribute-parser.test.ts`

### Adding a New Action Verb

1. **`src/types/action.ts`** — Add the verb to `ActionVerb` and create a new `*Args` interface; add it to the `ActionArgs` union
2. **`src/scanner/action-parser.ts`** — Add a case in `buildActionArgs()` for the new verb
3. **`src/executor/actions/`** — Create a stub handler file
4. **`src/executor/actions/index.ts`** — Export the new stub
5. **`src/executor/index.ts`** — Re-export the new stub
6. **`src/index.ts`** — Export the new type and handler
7. **Tests** — Add test cases in `action-parser.test.ts`

### Adding a New Query Filter

1. **`src/types/notation.ts`** — Add the field to `NotationQuery`
2. **`src/manager/notation-manager.ts`** — Add the filter logic in the `query()` method's filter chain
3. **Tests** — Add test cases in `notation-manager.test.ts`

### Code Style

- **Tabs** for indentation
- **Single quotes** for strings
- **Trailing commas** in multi-line constructs
- **No semicolons**
- Match the existing style — when in doubt, look at surrounding code

### Monorepo Integration

The tracker package lives within the `mono-labs-cli` monorepo:

- **`scripts/bump-version.js`** — Bumps version across all packages (root, shared, project, expo, cli, dev, tracker) in lockstep. Usage: `node scripts/bump-version.js [patch|minor|major]`
- **Deploy** — `yarn workspace @mono-labs/tracker deploy` builds and publishes to npm
- **Release scripts** — `release:patch`, `release:minor`, `release:major` handle version bump + publish in one command

### PR Checklist

- [ ] `yarn workspace @mono-labs/tracker build` passes with no errors
- [ ] `yarn workspace @mono-labs/tracker test` passes (all 102+ tests green)
- [ ] New types are exported from barrel files (`src/*/index.ts` and `src/index.ts`)
- [ ] No regressions in existing tests
- [ ] Code follows existing style (tabs, single quotes, no semicolons, trailing commas)
- [ ] Tests added for new functionality

---

## License

MIT
