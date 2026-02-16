// Boot logic: load root + mono configuration
import { getMonoConfig, getRootDirectory, getRootJson } from '../loadFromRoot'

export type BootResult = {
  rootDir: unknown
  rootJson: unknown
  files: Record<string, unknown>
  config: Record<string, unknown>
}

export function boot(): BootResult {
  const rootDir = getRootDirectory()
  const rootJson = getRootJson()
  const { files, config } = getMonoConfig() as {
    files: Record<string, unknown>
    config: Record<string, unknown>
  }
  return { rootDir, rootJson, files, config }
}

export default boot
