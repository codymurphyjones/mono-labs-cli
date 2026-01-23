// scripts/generate-repo-help.mjs
// Generates a developer-friendly workspace command reference.
//
// Output: docs/workspaces.md
//
// Run (from repo root):
//   node ./scripts/generate-repo-help.mjs
//
// Philosophy:
// - Optimize for onboarding and day-to-day use
// - Keep raw yarn workspace commands for reference
// - Emphasize `yarn mono` as the primary interface

import { promises as fs } from 'node:fs';
import path from 'node:path';

// Type definitions
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
export async function generateDocsIndex({
	docsDir,
	excludeFile,
}: GenerateDocsIndexOptions): Promise<string> {
	// Always resolve docsDir relative to the working directory
	const dirPath = path.resolve(process.cwd(), docsDir);
	const entries = await fs.readdir(dirPath, { withFileTypes: true });

	const links: string[] = [];

	for (const entry of entries) {
		if (!entry.isFile()) continue;
		if (!entry.name.endsWith('.md')) continue;

		// Always ignore docs/readme.md (case-insensitive)
		if (entry.name.toLowerCase() === 'readme.md') continue;

		// Optionally ignore a caller-specified file
		if (excludeFile && entry.name === excludeFile) continue;

		const filePath = path.join(dirPath, entry.name);
		const contents = await fs.readFile(filePath, 'utf8');

		// Find first markdown H1
		const match = contents.match(/^#\s+(.+)$/m);
		if (!match) continue;

		const rawTitle = match[1].trim();
		const relativeLink = `./${entry.name}`;

		/**
		 * Detect leading non-alphanumeric characters (emoji / symbols).
		 * This matches one or more Unicode characters that are NOT letters or numbers.
		 */
		const leadingSymbolMatch = rawTitle.match(/^([^\p{L}\p{N}]+)\s*(.+)$/u);

		if (leadingSymbolMatch) {
			const [, symbol, title] = leadingSymbolMatch;
			links.push(`- ${symbol.trim()} [${title.trim()}](${relativeLink})`);
		} else {
			links.push(`- [${rawTitle.trim()}](${relativeLink})`);
		}
	}

	// Sort alphabetically by rendered text (stable output)
	links.sort((a, b) => a.localeCompare(b));

	// Append Back to Readme
	links.push('');
	links.push('🏠 ← [Back to README](../README.md)');

	return links.join('\n');
}
