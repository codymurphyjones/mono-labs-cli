# Troubleshooting Guide

Common issues and how to resolve them when using the mono-labs CLI.

## 1. Command Not Found

Run:

```bash
yarn mono dev
```

Error:

```
error: unknown command 'dev'
```

Causes:

- File `.mono/dev.json` missing or misnamed (`dev.JSON` case matters on some
  systems).
- JSON syntax error preventing load.

Fixes:

1. Check file exists: `.mono/dev.json`.
2. Validate JSON (use an online validator or
   `node -e "JSON.parse(fs.readFileSync('.mono/dev.json','utf8'))"`).
3. Re-run with verbose logging (add temporary `console.log` in `boot.js`).

## 2. Token Not Substituted

You expected `${ngrok_api}` to resolve but saw literal `${ngrok_api}`.

Checklist:

- Did a preaction emit `{out:ngrok_api https://some.url}` EXACTLY? (Format
  matters: `{out:token value}`.)
- Was the emitting command listed in `preactions`, NOT `actions`?
- Did the token appear after the command finished? (Only final output state
  used.)

## 3. Option Validation Error

```
Invalid value for --platform: web. Valid options are: ios, android
```

Solution: Use a valid enumerated value or update the command JSON to include
`"web"` in the `options` array.

## 4. Background Process Keeps Running After Exit

If a foreground action is force-killed, some detached processes might persist
(rare on Windows).

Remedies:

- Press `Ctrl+C` again to trigger cleanup.
- Manually kill by process name (`tasklist` / `taskkill` on Windows, `ps` /
  `kill` on POSIX).

## 5. Windows PATH / Shell Issues

Some commands behave differently on Windows. If an action fails:

- Try prefixing with `npx` (e.g., `npx tsc`).
- Ensure tools are installed globally or available in workspace
  `node_modules/.bin`.

## 6. Docker Not Starting

If a preaction runs `docker compose up -d` and fails:

- Run manually to see error: `docker compose up -d`.
- Ensure Docker Desktop is running.

## 7. AWS Credentials Missing

If a command expects AWS credentials (due to `AWS_PROFILE` injection):

- Set `CDK_DEPLOY_PROFILE` or ensure `default` profile exists in
  `~/.aws/credentials`.

## 8. Preaction Fails but Actions Still Start

Actions should NOT start if a preaction fails (foreground rejects). If they do,
verify you didn't manually modify `runMonoCommand.js` error handling.

## 9. Need to Inspect Data Layer

Add a debug action at the start of `actions`:

```json
"actions": ["node -e \"console.log(process.env)\"", "echo next"]
```

Or temporarily add inside `runMonoCommand.js`:

```js
import { getData } from './dataLayer.js';
console.log('DATA LAYER SNAPSHOT', getData());
```

## 10. JSON Comments Not Allowed

Remember: JSON spec does NOT allow comments. Use pure JSON (no `//` or `/* */`).

## 11. Shell Expansion Differences

`${token}` inside JSON is replaced by the CLI. But native shell expansions (like
`$HOME`) depend on your OS and shell.

## 12. Foreground Hangs Forever

Likely your last action runs a dev server (intended). Press `Ctrl+C` to exit;
background services will be cleaned up.

## 13. Ngrok Token Not Captured

Ensure your script prints EXACTLY:

```
{out:ngrok_api https://1234.ngrok.dev}
```

NOT:

```
NGROK_URL=https://1234.ngrok.dev
```

## 14. How to Dry Run

Currently no built-in dry-run. You can simulate by:

- Copying `runMonoCommand.js` and logging planned commands without spawning.
- Or modify temporarily to `console.log('WOULD RUN', cmd)`.

## 15. Reverting Changes

If you break internal modules, delete them and reinstall from a clean git clone
or reset via version control.

---

## Quick Diagnostic Script

Create `.mono/debug.json`:

```json
{
	"preactions": ["echo {out:sample_value 123}"],
	"actions": ["echo token=${sample_value} arg=${arg}"],
	"argument": { "default": "zzz" },
	"options": { "mode": { "type": "string", "default": "alpha" } }
}
```

Run:

```bash
yarn mono debug --mode beta
```

Expected output includes:

```
token=123 arg=zzz
```

If not, check token formatting or JSON structure.

---

## Need More Help?

Open an issue with:

- Node version (`node -v`)
- OS
- The failing `.mono/*.json` file
- Command you ran
- Full error output

That context allows quick reproduction and fixes.
