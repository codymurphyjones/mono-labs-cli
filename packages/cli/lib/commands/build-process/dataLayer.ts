// Shared mutable key/value store for build-process commands.
// Extracts dynamic values from preactions and holds defaults from options.

import { testFlag } from './testflag'

const dataLayer: Record<string, unknown> = {}

export function setData(key: string, value: unknown): void {
  if (testFlag) {
    console.log(`→ dataLayer set: ${key} = ${String(value)}`)
  }
  if (value !== undefined) dataLayer[key] = value
}

export function mergeData(obj: Record<string, unknown> = {}): Record<string, unknown> {
  if (testFlag) {
    console.log(`→ dataLayer mergeData: ${JSON.stringify(obj)}`)
  }
  Object.entries(obj).forEach(([k, v]) => setData(k, v))

  return dataLayer
}

export function getData(key?: string): unknown {
  if (testFlag) {
    console.log(`→ dataLayer get: ${String(key)}`)
  }
  return key ? dataLayer[key] : dataLayer
}

export function hasData(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(dataLayer, key)
}

export function replaceTokens(str: unknown, env?: Record<string, unknown>): unknown {
  if (typeof str !== 'string') return str

  console.log('→ replaceTokens called')
  console.log('dataLayer:', dataLayer)

  return str.replace(/\$\{([^}]+)\}|\$([A-Z0-9_]+)/g, (_m, k1, k2) => {
    const k = (k1 || k2) as string

    // existing data layer takes priority
    if (hasData(k)) {
      const val = getData(k)
      return val == null ? '' : String(val)
    }

    // environment variables
    if (env && Object.prototype.hasOwnProperty.call(env, k)) {
      const val = env[k]
      return val == null ? '' : String(val)
    }

    // fallback
    return ''
  })
}

export default dataLayer
