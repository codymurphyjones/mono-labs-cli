<div align="center">

# mono-labs CLI

Declarative, token-aware task runner for JavaScript/TypeScript monorepos.
Configure commands with simple JSON – no custom scripting required.

</div>

## Why This Exists

You often need a repeatable set of steps to bootstrap or run your full stack
(web, mobile, backend, infra). Traditional npm scripts become tangled. This CLI
lets you:

- Describe commands in `.mono/*.json` files
- Emit dynamic values from scripts (`{out:token value}`)
- Inject those values into later commands & environment variables
- Run multiple background services + one attached foreground process

No publishing needed: you can link and iterate locally.

---

## Quick Start (Beginner Friendly)

1. Install dependencies:

```bash
yarn install
```

2. Create a `.mono` directory in your project root.
3. Add a file `.mono/hello.json`:

```json
{ "actions": ["echo Hello World"] }
```

4. Run the command:

```bash
yarn mono hello
```

You should see `Hello World`.

### Adding a Command with an Argument

```json
// .mono/greet.json
{
	"actions": ["echo Hi ${arg}"],
	"argument": { "description": "Name to greet", "default": "friend" }
}
```

```bash
yarn mono greet        # Hi friend
yarn mono greet Alice  # Hi Alice
```

### Adding an Option

```json
// .mono/build.json
{
	"actions": ["echo Building for ${platform} debug=${debug}"],
	"options": {
		"platform": { "type": "string", "default": "ios" },
		"debug": { "description": "Enable debug mode" }
	}
}
```

```bash
yarn mono build --platform android --debug
```

---

## Core Concepts

| Concept        | Summary                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------- |
| `.mono/*.json` | Each file (except `config.json`) becomes a command. `dev.json` -> `yarn mono dev`.            |
| `preactions`   | Sequential setup commands whose output can define tokens.                                     |
| `actions`      | Main workload commands. All but last run detached; last is attached (interactive).            |
| Tokens         | Printed from preactions as `{out:key value}` and later substituted as `${key}`.               |
| Environments   | `environments.dev` / `environments.stage` provide token-aware env vars. Use `--stage` switch. |
| Data Layer     | Merges defaults, user flags, argument, and emitted tokens.                                    |

Full schemas & rules: see `docs/configuration.md`.

---

## Documentation Index

| Topic                    | File                      |
| ------------------------ | ------------------------- |
| Architecture / internals | `docs/architecture.md`    |
| Configuration schema     | `docs/configuration.md`   |
| Practical examples       | `docs/examples.md`        |
| Troubleshooting          | `docs/troubleshooting.md` |

---

## How It Works (Short Version)

1. CLI scans `.mono/` at startup.
2. Builds Commander commands for each JSON file.
3. When invoked: merges defaults + flags + argument into data layer.
4. Runs `preactions` (foreground) capturing `{out:key value}` tokens.
5. Spawns each action (background except last). Performs `${token}`
   substitution.
6. Cleans background processes on exit or Ctrl+C.

Details: `docs/architecture.md`.

---

## Local Development / Linking

From this repo root:

```bash
yarn link
```

In a target project:

```bash
yarn link "@mono-labs/cli"
```

Then use:

```bash
yarn mono <command>
```

To unlink later:

```bash
yarn unlink "@mono-labs/cli"
```

Alternative (direct file install):

```bash
yarn add file:/absolute/path/to/mono-labs-cli
```

---

## Emitting Dynamic Values

Inside a `preactions` script output lines like:

```
{out:ngrok_api https://1234.ngrok.dev}
{out:region us-east-1}
```

Then reference in actions or environments as `${ngrok_api}` or `${region}`.

---

## Example Advanced Command

```json
// .mono/dev.json
{
	"preactions": ["docker compose up -d", "node scripts/ngrok_setup"],
	"actions": [
		"yarn backend dynamodb-admin -p 8082 --dynamo-endpoint=http://localhost:8000",
		"yarn mono backend server"
	],
	"argument": { "type": "string", "default": "dev" },
	"options": {
		"stage": { "description": "Use stage env" },
		"profile": { "type": "string", "description": "Profile name" }
	},
	"environments": {
		"dev": { "API_URL": "${ngrok_api}", "MODE": "dev" },
		"stage": { "API_URL": "${ngrok_api}", "MODE": "stage" }
	}
}
```

Run:

```bash
yarn mono dev --profile alpha
```

---

## Design Decisions

- JSON over JS: simpler, toolable, safer for newcomers.
- Single positional argument: keeps mental model small.
- Token system: decouples script output from later steps.
- Background/foreground split: stable dev server orchestration.

---

## Extending

| Need                   | Approach                                      |
| ---------------------- | --------------------------------------------- |
| Multiple arguments     | Extend `cliFactory.js` to parse more.         |
| JSON schema validation | Add Ajv in `boot()` loader.                   |
| Parallel preactions    | Modify `runHasteCommand.js` to `Promise.all`. |
| Different token syntax | Adjust regex in `runForeground.js`.           |

---

## Contributing

1. Fork & clone
2. Create a feature branch
3. Add/adjust tests (future roadmap)
4. Submit PR with clear description

---

## FAQ (Fast Answers)

| Question                         | Answer                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| How do I list commands?          | Look at filenames in `.mono/` or run `yarn mono --help`.                                                                  |
| How do I pass env vars manually? | `MY_VAR=1 yarn mono dev` (POSIX) or `set MY_VAR=1 && yarn mono dev` (CMD) or `$env:MY_VAR=1; yarn mono dev` (PowerShell). |
| Does it support Windows?         | Yes; process cleanup uses `taskkill`.                                                                                     |
| What if a token is missing?      | It stays literal (`${token}`); no crash.                                                                                  |

---

## License

MIT © Contributors

---

## Next Steps

Jump to: `docs/examples.md` for hands-on learning.
