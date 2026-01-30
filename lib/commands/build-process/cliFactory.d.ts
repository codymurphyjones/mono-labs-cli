import { Command } from 'commander';
type MonoFileDefinition = {
    name?: string;
    description?: string;
    argument?: {
        required?: boolean;
        type?: string;
        description?: string;
        default?: unknown;
        options?: string[];
        allowAll?: boolean;
    };
    options?: Record<string, {
        type?: 'string' | 'boolean';
        shortcut?: string;
        description?: string;
        default?: unknown;
        options?: string[];
        allowAll?: boolean;
    }>;
    environments?: Record<string, Record<string, unknown>>;
    preactions?: string[];
    actions?: string[];
};
/**
 * Register commander commands for each mono file definition.
 * Handles argument, options, validation, and action wiring.
 */
export declare function createConfigCommands(): Command;
export declare function createCliCommands(): Command;
export declare function buildCommands(files: Record<string, MonoFileDefinition>): void;
export default buildCommands;
