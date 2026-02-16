import { Command } from 'commander'

import { STAGING_URL } from './config'

import fs from 'node:fs'
import { dirname as pathDirname, join } from 'node:path'

function findNearestPackageJson(startDir: string): string {
  let current = startDir
  while (true) {
    const candidate = join(current, 'package.json')
    if (fs.existsSync(candidate)) return candidate
    const parent = pathDirname(current)
    if (parent === current) {
      throw new Error('Unable to locate package.json for CLI')
    }
    current = parent
  }
}

const pkgPath = findNearestPackageJson(__dirname)
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const version = pkg.version || '0.0.1'
export const program = new Command()

const getBinFromPackageJSON = (): string => {
  const keyList = Object.keys(pkg.bin ?? {})
  if (keyList.length === 0) {
    throw new Error('No bin field found in package.json')
  }
  return keyList[0]
}

const programName = getBinFromPackageJSON()

program
  .name(programName)
  .description(pkg.description || '')
  .version(version)

const NEXT_PUBLIC_API_URL = ((process.env.NEXT_PUBLIC_API_URL &&
  process.env.NEXT_PUBLIC_API_URL.length > 0) ||
  STAGING_URL) as string

export const generateEnvValues = (
  forceProd = false,
  ngrokUrl = 'localhost:3000',
  useAtlas = false
): NodeJS.ProcessEnv => {
  return {
    ...process.env,
    NEXT_PUBLIC_API_URL,
    NEXT_FORCE_PROD: String(forceProd),
    EXPO_PRIVATE_API_URL: ngrokUrl,
    EXPO_UNSTABLE_ATLAS: String(useAtlas),
  }
}
