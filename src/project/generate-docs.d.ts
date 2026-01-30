export interface GenerateDocsIndexOptions {
    docsDir: string;
    excludeFile?: string;
}
/**
 * Generate a docs index from markdown files.
 *
 * @param options - Options for docs index generation
 * @returns Markdown-formatted index
 */
export declare function generateDocsIndex({ docsDir, excludeFile, }: GenerateDocsIndexOptions): Promise<string>;
