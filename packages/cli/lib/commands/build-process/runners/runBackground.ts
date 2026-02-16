import { spawn } from 'child_process'
import { replaceTokens } from '../dataLayer'
import { registerBackground } from './processManager'

function createdExpandedEnv(envObj: Record<string, unknown>): Record<string, unknown> {
  const expandedEnv: Record<string, unknown> = {}
  for (const k of Object.keys(envObj)) {
    const v = envObj[k]
    expandedEnv[k] = typeof v === 'string' ? (replaceTokens(v) as string) : v
  }
  return expandedEnv
}

export function runBackground(
  cmd: string,
  envObj: Record<string, unknown> = {},
  logName = 'background',
  attached = false
): Promise<void> {
  const isWin = process.platform === 'win32'

  // Replace ${field} tokens in env values using dataLayer
  const expandedEnv = createdExpandedEnv(envObj)

  console.log(`→ ${logName} action ${attached ? '(attached)' : ''}: ${cmd}`)

  // Replace in command string
  const outCmd = replaceTokens(cmd) as string
  console.log(`→ ${logName} action ${attached ? '(attached)' : ''}: ${outCmd}`)

  return new Promise((resolve, reject) => {
    const child = spawn(outCmd, {
      shell: true,
      stdio: attached ? 'inherit' : 'ignore',
      env: { ...process.env, ...(expandedEnv as any) },
      detached: !attached && !isWin,
      windowsHide: !attached && isWin,
    })

    if (!attached && !isWin) child.unref()

    registerBackground(child)

    child.once('error', (err) => {
      reject(err)
    })

    child.once('exit', (code, signal) => {
      if (signal) return reject(new Error(`${cmd} exited via signal ${signal}`))
      if (code === 0) return resolve()
      reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

export default runBackground
