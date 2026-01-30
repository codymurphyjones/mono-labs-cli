import type { ExpoConfig, AppJSONConfig } from 'expo/config';
export declare function replaceTokens(input: string, tokens: Record<string, string>): string;
export declare function setUpConfig(config: AppJSONConfig): ExpoConfig;
