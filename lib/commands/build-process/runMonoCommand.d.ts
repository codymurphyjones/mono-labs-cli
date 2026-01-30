export declare function getAllowAllKeys(cfg: any): string[];
/**
 * Orchestrate execution of a single mono command definition.
 * Phases:
 *  1. Preactions (sequential, blocking) via runForeground
 *  2. Actions (background except last; last attached) via runBackground
 * Environment selection based on --stage flag and injection of AWS_PROFILE.
 */
export declare function runMonoCommand(configObject: any, options?: any): Promise<void>;
export default runMonoCommand;
