declare const dataLayer: Record<string, unknown>;
export declare function setData(key: string, value: unknown): void;
export declare function mergeData(obj?: Record<string, unknown>): Record<string, unknown>;
export declare function getData(key?: string): unknown;
export declare function hasData(key: string): boolean;
export declare function replaceTokens(str: unknown, env?: Record<string, unknown>): unknown;
export default dataLayer;
