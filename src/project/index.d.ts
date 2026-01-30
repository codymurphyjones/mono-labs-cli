type WorkspaceDetectResult = {
  cwd: string
  workspaceRoot: string | null
  isWorkspaceRoot: boolean
  configDir: string
  configPath: string
}
type DefaultAppConfig = {
  appleAppId?: string
  androidAppId?: string
  appName?: string
  easProjectId?: string
  appScheme?: string
}
type DefaultDeployConfig = {
  baseDomain?: string
  webSubdomain?: string
  apiSubdomain?: string
  defaultKeyPair?: string
  regions: string[]
  ec2User: string
  warehouseRegion: string
  dbInstanceType: string
  appInstanceType: string
}
type ConfigTypeMap = {
  app: DefaultAppConfig
  deployment: DefaultDeployConfig
}
/**
 * If TType is a known key, use the mapped type.
 * Otherwise use TCustom (default = unknown).
 */
type ResolveConfig<TType extends string, TCustom = unknown> = TType extends keyof ConfigTypeMap
  ? ConfigTypeMap[TType]
  : TCustom
export declare function loadAppConfig<TCustom = unknown, TType extends string = 'app'>(
  configType?: TType,
  startDir?: string
): {
  config: ResolveConfig<TType, TCustom>
  meta: WorkspaceDetectResult
}
export declare const loadProjectConfig: typeof loadAppConfig
export { loadMergedEnv } from './merge-env'
