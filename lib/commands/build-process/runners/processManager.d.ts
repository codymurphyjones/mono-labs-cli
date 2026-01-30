import { type ChildProcess } from 'child_process';
export declare const bgChildren: Set<ChildProcess>;
export declare function registerBackground(child: ChildProcess): void;
export declare function killAllBackground(): void;
export declare function ensureSignalHandlers(): void;
