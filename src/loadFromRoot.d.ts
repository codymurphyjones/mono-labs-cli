export interface MonoWorkspaceConfig {
    packageMaps: Record<string, string>;
}
export interface MonoProjectConfig {
    envMap: string[];
    workspace: MonoWorkspaceConfig;
    prodFlag: string;
}
export type MonoFiles = Record<string, unknown>;
export interface MonoConfig {
    config: MonoProjectConfig;
    files: MonoFiles;
}
/**
 * Walk up from cwd until we find a directory containing package.json.
 * This is treated as the project root.
 */
export declare function findProjectRoot(startDir?: string): string;
export declare function getRootDirectory(): string;
export declare function getRootJson(): Record<string, unknown>;
/**
 * Resolve the .mono directory.
 * Priority:
 *  1. project root/.mono
 *  2. cwd/.mono
 */
export declare function resolveMonoDirectory(): string | null;
export declare function getMonoFiles(): string[];
/**
 * Load and validate mono configuration.
 */
export declare function getMonoConfig(): MonoConfig;
