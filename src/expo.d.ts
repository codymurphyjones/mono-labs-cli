import type { AppJSONConfig, ExpoConfig } from 'expo/config';
export declare function replaceTokens(input: string, tokens: Record<string, string>): string;
export declare function setUpConfig(config: AppJSONConfig): ExpoConfig;
export declare function filterUnwantedEnvVarsEAS(envVars: Record<string, string>): Record<string, string>;
