// Type definitions for mono-labs CLI

export interface HasteConfig {
	envMap?: Record<string, string>;
	workspace?: {
		packageMaps?: Record<string, string>;
		preactions?: string[];
	};
}

export interface HasteFiles {
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
}

export interface BootResult {
	rootDir: string;
	rootJson: any;
	files: HasteFiles;
	config: HasteConfig;
}

// Function type declarations
export declare function generateNewEnvList(
	envMapList: Record<string, string>,
	processEnv: NodeJS.ProcessEnv
): NodeJS.ProcessEnv;

export declare function boot(): BootResult;

export declare function getHasteConfig(): {
	files: HasteFiles;
	config: HasteConfig;
};

export declare function getRootDirectory(): string;
export declare function getRootJson(): any;

export declare function buildCommands(files: HasteFiles): void;

export declare function runHasteCommand(
	configObject: CommandConfig,
	options: Record<string, any>
): Promise<void>;

export declare function verifyOptionValue(
	optionKey: string,
	value: any,
	optionsData: Record<string, OptionConfig>
): any;
