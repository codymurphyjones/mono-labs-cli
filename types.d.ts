// Type definitions for mono-labs CLI

declare module '@mono-labs/cli' {
	export interface MonoConfig {
		envMap?: Record<string, string>;
		workspace?: {
			packageMaps?: Record<string, string>;
			preactions?: string[];
		};
	}

	export interface MonoFiles {
		[commandName: string]: CommandConfig;
	}

	export interface CommandConfig {
		description?: string;
		argument?: {
			type?: string;
			description?: string;
			default?: string;
			required?: boolean;
		};
		options?: Record<string, OptionConfig>;
		preactions?: string[];
		actions?: string[];
		environments?: {
			dev?: Record<string, string>;
			stage?: Record<string, string>;
		};
	}

	export interface OptionConfig {
		type?: 'string' | 'boolean';
		description?: string;
		default?: string | boolean;
		shortcut?: string;
		options?: string[];
		allowAll?: boolean;
	}

	export interface BootResult {
		rootDir: string;
		rootJson: any;
		files: MonoFiles;
		config: MonoConfig;
	}

	export function filterUnwantedEnvVarsEAS(env: string): NodeJS.ProcessEnv;
	export function filterUnwantedEnvVars(env: string): NodeJS.ProcessEnv;

	export function replaceTokens(
		input: string,
		tokens: Record<string, string>
	): string;
	// Function type declarations
	export function generateNewEnvList(
		processEnv: NodeJS.ProcessEnv
	): NodeJS.ProcessEnv;

	export function boot(): BootResult;

	export function getMonoConfig(): {
		files: MonoFiles;
		config: MonoConfig;
	};

	export function getRootDirectory(): string;
	export function getRootJson(): any;

	export function buildCommands(files: MonoFiles): void;

	export function runMonoCommand(
		configObject: CommandConfig,
		options: Record<string, any>
	): Promise<void>;

	export function verifyOptionValue(
		optionKey: string,
		value: any,
		optionsData: Record<string, OptionConfig>
	): any;
}
