import { Command } from 'commander';
export declare const program: Command;
export declare const generateEnvValues: (forceProd?: boolean, ngrokUrl?: string, useAtlas?: boolean) => NodeJS.ProcessEnv;
