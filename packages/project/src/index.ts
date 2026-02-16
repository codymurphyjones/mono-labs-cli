// @mono-labs/project barrel export

export {
  findProjectRoot,
  getRootDirectory,
  getRootJson,
  resolveMonoDirectory,
  getMonoFiles,
  getMonoConfig,
} from './loadFromRoot'

export type {
  MonoWorkspaceConfig,
  MonoProjectConfig,
  MonoFiles,
  MonoConfig,
} from './loadFromRoot'

export { loadAppConfig, loadProjectConfig, loadMergedEnv } from './project/index'
