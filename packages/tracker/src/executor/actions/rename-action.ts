import * as fs from 'fs'
import * as path from 'path'
import type { NotationAction, Notation, RenameArgs } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleRename(action: NotationAction, notation: Notation, projectRoot: string): Promise<ActionResult> {
	const args = action.args as RenameArgs
	if (!args.from || !args.to) {
		return { success: false, message: 'Rename action requires from and to', verb: 'rename' }
	}

	try {
		const filePath = path.resolve(projectRoot, notation.location.file)
		const content = fs.readFileSync(filePath, 'utf-8')
		const lines = content.split('\n')

		const startLine = notation.location.line - 1
		const endLine = (notation.location.endLine ?? notation.location.line + notation.codeContext.length) - 1
		const searchEnd = Math.min(endLine + 10, lines.length - 1)

		// Word boundary regex for the identifier
		const wordRegex = new RegExp(`\\b${escapeRegExp(args.from)}\\b`, 'g')
		let count = 0

		for (let i = startLine; i <= searchEnd; i++) {
			if (wordRegex.test(lines[i])) {
				lines[i] = lines[i].replace(wordRegex, args.to)
				count++
			}
			wordRegex.lastIndex = 0 // Reset global regex
		}

		if (count === 0) {
			return { success: false, message: `Identifier "${args.from}" not found in code context`, verb: 'rename' }
		}

		fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
		return { success: true, message: `Renamed "${args.from}" to "${args.to}" (${count} occurrence(s))`, verb: 'rename' }
	} catch (err: any) {
		return { success: false, message: `Rename failed: ${err.message}`, verb: 'rename' }
	}
}

function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
