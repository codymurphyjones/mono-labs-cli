/**
 * Run a command in the foreground, capturing stdout/stderr. Extracts token patterns
 * of the form {out:field value} and stores them in the shared dataLayer.
 */
export declare function runForeground(cmd: string, envObj?: NodeJS.ProcessEnv, _options?: Record<string, unknown>): Promise<string>;
export default runForeground;
