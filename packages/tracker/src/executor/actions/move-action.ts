import * as fs from 'fs'
import * as path from 'path'
import type { NotationAction, Notation, MoveArgs } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleMove(action: NotationAction, notation: Notation, projectRoot: string): Promise<ActionResult> {
	const args = action.args as MoveArgs
	if (!args.target || !args.destination) {
		return { success: false, message: 'Move action requires target and destination', verb: 'move' }
	}

	try {
		const filePath = path.resolve(projectRoot, notation.location.file)
		const content = fs.readFileSync(filePath, 'utf-8')
		const lines = content.split('\n')

		const startLine = notation.location.line - 1
		const endLine = (notation.location.endLine ?? notation.location.line + notation.codeContext.length) - 1
		const searchEnd = Math.min(endLine + 10, lines.length - 1)

		let moveStart = -1
		for (let i = startLine; i <= searchEnd; i++) {
			if (lines[i].includes(args.target)) {
				moveStart = i
				break
			}
		}

		if (moveStart === -1) {
			return { success: false, message: `Target "${args.target}" not found in code context`, verb: 'move' }
		}

		const moved = lines[moveStart]

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

		destContent = destContent ? destContent + '\n' + moved + '\n' : moved + '\n'
		fs.writeFileSync(destPath, destContent, 'utf-8')

		// Remove from source
		lines.splice(moveStart, 1)
		fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')

		return { success: true, message: `Moved "${args.target}" to ${args.destination}`, verb: 'move' }
	} catch (err: any) {
		return { success: false, message: `Move failed: ${err.message}`, verb: 'move' }
	}
}
