import * as fs from 'fs'
import * as path from 'path'
import type { NotationAction, Notation, ExtractArgs } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleExtract(action: NotationAction, notation: Notation, projectRoot: string): Promise<ActionResult> {
	const args = action.args as ExtractArgs
	if (!args.target || !args.destination) {
		return { success: false, message: 'Extract action requires target and destination', verb: 'extract' }
	}

	try {
		const filePath = path.resolve(projectRoot, notation.location.file)
		const content = fs.readFileSync(filePath, 'utf-8')
		const lines = content.split('\n')

		const startLine = notation.location.line - 1
		const endLine = (notation.location.endLine ?? notation.location.line + notation.codeContext.length) - 1
		const searchEnd = Math.min(endLine + 10, lines.length - 1)

		// Find the target code block
		let extractStart = -1
		for (let i = startLine; i <= searchEnd; i++) {
			if (lines[i].includes(args.target)) {
				extractStart = i
				break
			}
		}

		if (extractStart === -1) {
			return { success: false, message: `Target "${args.target}" not found in code context`, verb: 'extract' }
		}

		// Extract the line (simple single-line extraction)
		const extracted = lines[extractStart]

		// Write to destination file
		const destPath = path.resolve(projectRoot, args.destination)
		const destDir = path.dirname(destPath)
		fs.mkdirSync(destDir, { recursive: true })

		let destContent = ''
		try {
			destContent = fs.readFileSync(destPath, 'utf-8')
		} catch {
			// File doesn't exist yet
		}

		destContent = destContent ? destContent + '\n' + extracted + '\n' : extracted + '\n'
		fs.writeFileSync(destPath, destContent, 'utf-8')

		// Remove from source
		lines.splice(extractStart, 1)
		fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')

		return { success: true, message: `Extracted "${args.target}" to ${args.destination}`, verb: 'extract' }
	} catch (err: any) {
		return { success: false, message: `Extract failed: ${err.message}`, verb: 'extract' }
	}
}
