import * as fs from 'fs'
import * as path from 'path'
import type { NotationAction, Notation, WrapInArgs } from '../../types'
import type { ActionResult } from '../action-executor'

export async function handleWrap(action: NotationAction, notation: Notation, projectRoot: string): Promise<ActionResult> {
	const args = action.args as WrapInArgs
	if (!args.target || !args.wrapper) {
		return { success: false, message: 'WrapIn action requires target and wrapper', verb: 'wrapIn' }
	}

	try {
		const filePath = path.resolve(projectRoot, notation.location.file)
		const content = fs.readFileSync(filePath, 'utf-8')
		const lines = content.split('\n')

		const startLine = notation.location.line - 1
		const endLine = (notation.location.endLine ?? notation.location.line + notation.codeContext.length) - 1
		const searchEnd = Math.min(endLine + 10, lines.length - 1)

		let targetLine = -1
		for (let i = startLine; i <= searchEnd; i++) {
			if (lines[i].includes(args.target)) {
				targetLine = i
				break
			}
		}

		if (targetLine === -1) {
			return { success: false, message: `Target "${args.target}" not found in code context`, verb: 'wrapIn' }
		}

		const indent = lines[targetLine].match(/^(\s*)/)?.[1] || ''
		const originalLine = lines[targetLine]

		// Common wrapper patterns
		const wrapper = args.wrapper.toLowerCase()
		let wrapped: string[]

		if (wrapper === 'trycatch' || wrapper === 'try-catch' || wrapper === 'try/catch') {
			wrapped = [
				`${indent}try {`,
				`${indent}\t${originalLine.trim()}`,
				`${indent}} catch (err) {`,
				`${indent}\t// Handle error`,
				`${indent}}`,
			]
		} else if (wrapper.startsWith('function') || wrapper.startsWith('const')) {
			wrapped = [
				`${indent}${args.wrapper} {`,
				`${indent}\t${originalLine.trim()}`,
				`${indent}}`,
			]
		} else {
			// Generic wrapper: use the wrapper as a function call
			wrapped = [
				`${indent}${args.wrapper}(`,
				`${indent}\t${originalLine.trim()}`,
				`${indent})`,
			]
		}

		lines.splice(targetLine, 1, ...wrapped)
		fs.writeFileSync(filePath, lines.join('\n'), 'utf-8')

		return { success: true, message: `Wrapped "${args.target}" with ${args.wrapper}`, verb: 'wrapIn' }
	} catch (err: any) {
		return { success: false, message: `WrapIn failed: ${err.message}`, verb: 'wrapIn' }
	}
}
