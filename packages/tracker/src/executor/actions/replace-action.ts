import * as fs from 'fs'
import * as path from 'path'
import type { NotationAction, Notation, ReplaceArgs } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleReplace(action: NotationAction, notation: Notation, projectRoot: string): Promise<ActionResult> {
	const args = action.args as ReplaceArgs
	if (!args.target || !args.replacement) {
		return { success: false, message: 'Replace action requires target and replacement', verb: 'replace' }
	}

	try {
		const filePath = path.resolve(projectRoot, notation.location.file)
		const content = fs.readFileSync(filePath, 'utf-8')
		const lines = content.split('\n')

		// Search within the code context range
		const startLine = notation.location.line - 1
		const endLine = (notation.location.endLine ?? notation.location.line + notation.codeContext.length) - 1
		const searchEnd = Math.min(endLine + 10, lines.length - 1) // Extend search slightly

		let replaced = false
		for (let i = startLine; i <= searchEnd; i++) {
			if (lines[i].includes(args.target)) {
				lines[i] = lines[i].replace(args.target, args.replacement)
				replaced = true
				break
			}
		}

		if (!replaced) {
			return { success: false, message: `Target "${args.target}" not found in code context`, verb: 'replace' }
		}

		fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
		return { success: true, message: `Replaced "${args.target}" with "${args.replacement}"`, verb: 'replace' }
	} catch (err: any) {
		return { success: false, message: `Replace failed: ${err.message}`, verb: 'replace' }
	}
}
