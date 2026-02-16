// Backward-compatible re-export from @mono-labs/project
export {
  findProjectRoot,
  getRootDirectory,
  getRootJson,
  resolveMonoDirectory,
  getMonoFiles,
  getMonoConfig,
  loadAppConfig,
  loadProjectConfig,
  loadMergedEnv,
} from '@mono-labs/project'

export type {
  MonoWorkspaceConfig,
  MonoProjectConfig,
  MonoFiles,
  MonoConfig,
} from '@mono-labs/project'
