import {
  filterUnwantedEnvVars,
  filterUnwantedEnvVarsEAS,
  generateNewEnvList,
} from './expo-files/filterUnwantedEnvVars'
type DataLayer = Record<string, unknown>
export declare function setData(key: string, value: unknown): void
export declare function mergeData(obj?: Record<string, unknown>): DataLayer
export declare function getData(key?: string): unknown
export declare function hasData(key: string): boolean
export declare function replaceTokens(
  str: unknown,
  env?: Record<string, string | undefined>
): unknown
export { generateNewEnvList, filterUnwantedEnvVars, filterUnwantedEnvVarsEAS }
declare const _default: {
  generateNewEnvList: typeof generateNewEnvList
  replaceTokens: typeof replaceTokens
  filterUnwantedEnvVars: typeof filterUnwantedEnvVars
  filterUnwantedEnvVarsEAS: typeof filterUnwantedEnvVarsEAS
}
export default _default
