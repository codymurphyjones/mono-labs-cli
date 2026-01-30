import { spawn, type ChildProcess } from 'child_process'

// Track background processes so we can kill them on exit
export const bgChildren = new Set<ChildProcess>()

export function registerBackground(child: ChildProcess): void {
  bgChildren.add(child)
}

export function killAllBackground(): void {
  for (const child of Array.from(bgChildren)) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
          shell: true,
          stdio: 'ignore',
        })
      } else if (child.pid) {
        process.kill(-child.pid, 'SIGTERM')
      }
    } catch {
      // ignore
    }
  }
  bgChildren.clear()
}

let signalsRegistered = false
export function ensureSignalHandlers(): void {
  if (signalsRegistered) return
  signalsRegistered = true

  process.on('SIGINT', () => {
    killAllBackground()
    process.exit(130)
  })

  process.on('SIGTERM', () => {
    killAllBackground()
    process.exit(143)
  })
}
