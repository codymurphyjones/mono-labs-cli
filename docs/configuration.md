# Configuration Reference (.mono directory)

The CLI is driven entirely by JSON files inside a `.mono/` folder at the root of
your project.

```
.mono/
  config.json        # Global workspace + shared preactions
  dev.json           # Creates `yarn mono dev`
  deploy.json        # Creates `yarn mono deploy`
  test.json          # Creates `yarn mono test`
  watch.json         # Creates `yarn mono watch`
  expo.json          # Creates `yarn mono expo`
  post-install.json  # Creates `yarn mono post-install`
```

## File Types

There are TWO categories of files:

1. `config.json` (special)
2. Command definition files (every other `*.json`)

---

## 1. `config.json`

Holds global / workspace-level settings.

### Current Supported Fields

| Field                   | Type          | Required | Description                                                                                                                              |
| ----------------------- | ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `workspace.packageMaps` | object        | optional | Maps shorthand names to Yarn workspace package names. Example: `{ "web": "next-app" }`. Used by higher-level scripts (future expansion). |
| `workspace.preactions`  | array<string> | optional | Commands to run BEFORE ANY other command's own preactions. Useful for global setup like copying `.env` files. Tokens are supported.      |

Example:

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
	}
}
```

Notes:

- `${dir}` would need to be set by some preaction output (e.g.,
  `{out:dir value}`). If unset it remains literal.
- Additional global fields can be added later without breaking existing
  commands.

---

## 2. Command Definition Files

Any `.json` file other than `config.json` becomes a command: `<name>.json` ->
`yarn mono <name>`.

### Top-Level Fields

| Field          | Type          | Required    | Description                                                                                                                                        |
| -------------- | ------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actions`      | array<string> | recommended | The main commands. All but last run in background (detached). Last runs attached (interactive). If omitted, command does nothing after preactions. |
| `preactions`   | array<string> | optional    | Sequential setup commands. They can emit tokens via `{out:key value}`.                                                                             |
| `argument`     | object        | optional    | Defines a single positional argument. Stored in data layer as `arg`.                                                                               |
| `options`      | object        | optional    | Maps option name to metadata (type, description, default, shortcut, enumerations).                                                                 |
| `environments` | object        | optional    | Two nested objects: `dev` and/or `stage`; each key/value pair becomes an env var with token substitution.                                          |

### `argument` Object

| Field         | Type    | Default   | Description                                                           |
| ------------- | ------- | --------- | --------------------------------------------------------------------- |
| `type`        | string  | `string`  | Logical type label only (no coercion yet).                            |
| `description` | string  | ''        | Help text.                                                            |
| `default`     | any     | undefined | Used if user omits the argument. Accessible as `${arg}` in templates. |
| `required`    | boolean | false     | If true, the user must supply it or Commander will error.             |

Example:

```json
"argument": {
  "type": "string",
  "description": "Set environment to staging",
  "default": "dev"
}
```

### `options` Object

Each key becomes `--<key>`. Structure:

| Field         | Type            | Default   | Description                                      |
| ------------- | --------------- | --------- | ------------------------------------------------ | -------------------------------------------------------- |
| `description` | string          | ''        | Help text.                                       |
| `shortcut`    | string (1 char) | none      | Adds a `-x` alias.                               |
| `type`        | `"boolean"      | "string"` | `boolean`                                        | Determines if value required. `string` => `--key <key>`. |
| `default`     | any             | undefined | If provided, seeded into data layer immediately. |
| `options`     | array<string>   | none      | Enumerated allowed values (validation).          |

Boolean options: appear as flags. If present, Commander sets them true. String
options: require a value; accessible in data layer with same key.

### `environments`

Structure:

```json
"environments": {
  "dev": { "VAR": "value or ${token}" },
  "stage": { "VAR": "other value" }
}
```

Selection logic:

- If user passes `--stage`, use `stage`; else use `dev`.
- Adds `AWS_PROFILE` internally from
  `process.env.CDK_DEPLOY_PROFILE || 'default'`.

### Tokens & Data Layer

Tokens are placeholders like `${ngrok_api}` or `${arg}`.

Token Resolution Order:

1. Defaults from `options` (if `default` defined)
2. Parsed CLI flags and the final argument (`arg`)
3. Output tokens from preactions: any line containing `{out:key value}` stores
   `key -> value`

Substitution occurs in:

- Environment variable values
- Action commands
- Preactions are NOT mutated; they run literally (but can themselves contain
  shell-based expansions handled by your shell).

If a token isn't found, it stays as-is (no crash).

### Emitting Tokens from Preactions

Inside a preaction script, print lines like:

```
{out:ngrok_api https://xxxx.ngrok.io}
{out:region us-east-1}
```

These set `ngrok_api` and `region` for later substitution.

### Example: `dev.json`

```json
{
	"actions": [
		"yarn backend dynamodb-admin -p 8082 --dynamo-endpoint=http://localhost:8000",
		"yarn mono backend server"
	],
	"preactions": ["docker compose up -d", "node scripts/ngrok_setup"],
	"argument": {
		"type": "string",
		"description": "Set environment to staging",
		"default": "dev"
	},
	"options": {
		"dev": { "description": "Run in dev mode", "shortcut": "d" },
		"android": { "description": "Build to target android production profile" },
		"ios": { "description": "Build to target ios production profile" },
		"stage": { "description": "Set environment to staging" },
		"profile": { "type": "string", "description": "Set profile" }
	},
	"environments": {
		"dev": {
			"EXPO_PUBLIC_API_URL": "${ngrok_api}",
			"ApiUrl": "${ngrok_api}",
			"EXPO_FORCE_PROD": "false",
			"TEST_ENV_VAR": "${arg}"
		},
		"stage": {
			"EXPO_PUBLIC_API_URL": "${ngrok_api}",
			"ApiUrl": "${ngrok_api}",
			"EXPO_FORCE_PROD": "true",
			"TEST_ENV_VAR": "${arg}"
		}
	}
}
```

### Minimal Command File

```json
{ "actions": ["echo hello world"] }
```

Produces:

```
yarn mono echo hello world
```

(You still need to name the file, e.g. `hello.json` -> `yarn mono hello`.)

---

## Validation Rules

- Unknown fields are ignored (forward compatible).
- Enumerated values (`options.platform.options = ["ios","android"]`) throw an
  error if user passes something else.
- Only ONE positional argument is supported currently.
- All action commands are run via your system shell (`shell: true`).

---

## Reserved Keys

Avoid naming options or tokens that clash with core Node env vars unless
intentional: `PATH`, `HOME`, etc.

---

## Adding New Capabilities

Want multiple arguments? Extend `cliFactory.js` and update docs. Need JSON
schema validation? Integrate a library (e.g. `ajv`) in a future update.

---

## Summary Cheat Sheet

| Need                            | Do This                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Add a new command               | Create `name.json` with `actions` array.                                                                                |
| Share setup across all commands | Put commands in `config.json` under `workspace.preactions`. (Feature placeholder: ensure integration if not wired yet.) |
| Use a token in env              | Reference `${tokenName}` in `environments` block.                                                                       |
| Define a default option value   | Add `default` inside that option entry.                                                                                 |
| Emit dynamic token              | Print `{out:key value}` inside a preaction script.                                                                      |

See `examples.md` for practical walkthroughs.
