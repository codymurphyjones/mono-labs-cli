export function writeLog(...args: unknown[]): void {
  if (process.env.MONO_DEV_LOGS === '1') {
    console.log(...args)
  }
}
