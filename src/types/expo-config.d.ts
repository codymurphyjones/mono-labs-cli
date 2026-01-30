// src/types/expo-config.d.ts
declare module 'expo/config' {
  /**
   * Shape of app.json / app.config.js
   * Mirrors Expo's internal AppJSONConfig
   */
  export interface AppJSONConfig {
    expo?: ExpoConfig
    name?: string
    slug?: string
    version?: string
    orientation?: string
    sdkVersion?: string
    ios?: Record<string, any>
    android?: Record<string, any>
    web?: Record<string, any>
    extra?: Record<string, any>
    updates?: Record<string, any>
    runtimeVersion?: string | Record<string, any>
    experiments?: Record<string, any>
    [key: string]: any
  }

  /**
   * Normalized Expo config (exp)
   */
  export interface ExpoConfig {
    name?: string
    slug?: string
    version?: string
    orientation?: string
    ios?: Record<string, any>
    android?: Record<string, any>
    web?: Record<string, any>
    extra?: Record<string, any>
    updates?: Record<string, any>
    runtimeVersion?: string | Record<string, any>
    experiments?: Record<string, any>
    [key: string]: any
  }

  export function getConfig(
    projectRoot: string,
    options?: any
  ): {
    exp: ExpoConfig
    rootConfig?: AppJSONConfig
  }
}
