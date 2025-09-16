# Examples & Walkthroughs

This guide walks you through real scenarios using the `.mono` configuration
system.

## 1. Smallest Possible Setup

Create `.mono/hello.json`:

```json
{ "actions": ["echo Hello Mono World"] }
```

Run:

```bash
yarn mono hello
```

Output:

```
Hello Mono World
```

Done. You created your first custom command.

## 2. Adding a Positional Argument

`.mono/greet.json`:

```json
{
	"actions": ["echo Hi ${arg}, welcome"],
	"argument": { "description": "Who to greet", "default": "friend" }
}
```

Usage:

```bash
yarn mono greet        # -> Hi friend, welcome
yarn mono greet Alice  # -> Hi Alice, welcome
```

## 3. Boolean & String Options

`.mono/build.json`:

```json
{
	"actions": ["echo Building for ${platform} (debug=${debug})"],
	"options": {
		"platform": {
			"type": "string",
			"default": "ios",
			"description": "Target platform"
		},
		"debug": { "description": "Enable debug build" }
	}
}
```

Run:

```bash
yarn mono build --platform android --debug
```

Output:

```
Building for android (debug=true)
```

## 4. Enumerated Option Validation

`.mono/test-platform.json`:

```json
{
	"actions": ["echo Platform = ${platform}"],
	"options": {
		"platform": {
			"type": "string",
			"default": "ios",
			"options": ["ios", "android"],
			"description": "Select target"
		}
	}
}
```

Invalid usage:

```bash
yarn mono test-platform --platform web
```

Error:

```
Invalid value for --platform: web. Valid options are: ios, android
```

## 5. Preactions Emitting Tokens

`.mono/dev.json` already demonstrates this pattern. Suppose
`node scripts/ngrok_setup` prints:

```
{out:ngrok_api https://1234.ngrok.dev}
```

Then your `environments.dev.NEXT_PUBLIC_API_URL` which contains `${ngrok_api}`
becomes `https://1234.ngrok.dev`.

## 6. Multi-Stage Environments

`.mono/deploy.json` (excerpt):

```json
{
	"actions": ["echo Deploying owner=${arg} to region=${region}"],
	"argument": { "default": "me" },
	"options": {
		"region": { "type": "string", "default": "us-east-2" },
		"stage": { "description": "Use stage environment" }
	},
	"environments": {
		"dev": { "DEPLOY_ENV": "development" },
		"stage": { "DEPLOY_ENV": "staging" }
	}
}
```

Run:

```bash
yarn mono deploy Alice --region us-west-1          # DEPLOY_ENV=development
yarn mono deploy Bob --region eu-central-1 --stage # DEPLOY_ENV=staging
```

## 7. Chaining Services: Background + Foreground

If you specify multiple `actions`:

```json
{
	"actions": [
		"docker compose up -d", // background
		"yarn workspace backend dev", // background
		"yarn workspace web dev" // foreground (attached)
	]
}
```

First two run detached; the last attaches so you see logs. When you exit the
last, background tasks are cleaned up.

## 8. Using Global Preactions (Future Ready)

In `config.json`:

```json
{
	"workspace": {
		"preactions": ["echo Setting up global resources"]
	}
}
```

(If not already applied, you can extend the code to run these before every
command.)

## 9. Token Fallback Behavior

If you reference `${not_set}` in an action or environment and it's never
defined, it remains literally `${not_set}`. No crash.

## 10. Debugging Tokens

Add a diagnostic action:

```json
{
	"actions": ["echo arg=${arg} region=${region} token=${ngrok_api}"],
	"options": { "region": { "type": "string", "default": "us-east-1" } }
}
```

Run after preactions produced tokens to verify substitution.

---

## Recap

You now know how to:

- Create commands
- Add arguments & options
- Validate option values
- Emit dynamic tokens from scripts
- Use environments with stage switching
- Launch multiple processes safely

Check `troubleshooting.md` if something behaves unexpectedly.
