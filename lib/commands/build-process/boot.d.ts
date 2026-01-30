export type BootResult = {
    rootDir: unknown;
    rootJson: unknown;
    files: Record<string, unknown>;
    config: Record<string, unknown>;
};
export declare function boot(): BootResult;
export default boot;
