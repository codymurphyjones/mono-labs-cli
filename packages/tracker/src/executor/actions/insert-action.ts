import * as fs from 'fs'
import * as path from 'path'
import type { NotationAction, Notation, InsertArgs } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleInsert(action: NotationAction, notation: Notation, projectRoot: string): Promise<ActionResult> {
	const args = action.args as InsertArgs
	if (!args.content) {
		return { success: false, message: 'Insert action requires content', verb: 'insert' }
	}

	try {
		const filePath = path.resolve(projectRoot, notation.location.file)
		const content = fs.readFileSync(filePath, 'utf-8')
		const lines = content.split('\n')

		const startLine = notation.location.line - 1
		const endLine = (notation.location.endLine ?? notation.location.line + notation.codeContext.length) - 1
		const searchEnd = Math.min(endLine + 10, lines.length - 1)

		if (args.anchor) {
			// Find the anchor line and insert before/after
			for (let i = startLine; i <= searchEnd; i++) {
				if (lines[i].includes(args.anchor)) {
					const insertIdx = args.position === 'before' ? i : i + 1
					lines.splice(insertIdx, 0, args.content)
					fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
					return { success: true, message: `Inserted content ${args.position} "${args.anchor}"`, verb: 'insert' }
				}
			}
			return { success: false, message: `Anchor "${args.anchor}" not found in code context`, verb: 'insert' }
		} else {
			// Insert after the notation block
			const insertIdx = endLine + 1
			lines.splice(insertIdx, 0, args.content)
			fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')
			return { success: true, message: 'Inserted content after notation block', verb: 'insert' }
		}
	} catch (err: any) {
		return { success: false, message: `Insert failed: ${err.message}`, verb: 'insert' }
	}
}
