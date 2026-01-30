import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

export function loadMergedEnv(): NodeJS.ProcessEnv {
  const ENV_PATH = path.resolve(process.cwd(), '.env')
  const ENV_LOCAL_PATH = path.resolve(process.cwd(), '.env.local')

  const base = fs.existsSync(ENV_PATH) ? dotenv.parse(fs.readFileSync(ENV_PATH)) : {}
  const local = fs.existsSync(ENV_LOCAL_PATH) ? dotenv.parse(fs.readFileSync(ENV_LOCAL_PATH)) : {}

  const merged = {
    ...base,
    ...local,
  }

  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }

  return process.env
}
