import * as fs from 'fs'
import * as path from 'path'
import type { NotationAction, Notation, RemoveArgs } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleRemove(action: NotationAction, notation: Notation, projectRoot: string): Promise<ActionResult> {
	const args = action.args as RemoveArgs
	if (!args.target) {
		return { success: false, message: 'Remove action requires target', verb: 'remove' }
	}

	try {
		const filePath = path.resolve(projectRoot, notation.location.file)
		const content = fs.readFileSync(filePath, 'utf-8')
		const lines = content.split('\n')

		const startLine = notation.location.line - 1
		const endLine = (notation.location.endLine ?? notation.location.line + notation.codeContext.length) - 1
		const searchEnd = Math.min(endLine + 10, lines.length - 1)

		let removed = false
		for (let i = startLine; i <= searchEnd; i++) {
			if (lines[i].includes(args.target)) {
				// If the target is the entire line content (trimmed), remove the line
				if (lines[i].trim() === args.target.trim()) {
					lines.splice(i, 1)
				} else {
					lines[i] = lines[i].replace(args.target, '')
				}
				removed = true
				break
			}
		}

		if (!removed) {
			return { success: false, message: `Target "${args.target}" not found in code context`, verb: 'remove' }
		}

		fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
		return { success: true, message: `Removed "${args.target}"`, verb: 'remove' }
	} catch (err: any) {
		return { success: false, message: `Remove failed: ${err.message}`, verb: 'remove' }
	}
}
