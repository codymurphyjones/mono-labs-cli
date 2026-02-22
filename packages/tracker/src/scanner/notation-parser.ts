import type { Notation, MarkerType } from '../types'
import { Status } from '../types/enums'
import { generateStableId } from '../utils'
import { parseAttributes } from './attribute-parser'
import { parseActions } from './action-parser'

const MARKER_REGEX = /^(\s*)\/\/\s*(FIXME|TODO|BUG|HACK|NOTE|OPTIMIZE|SECURITY):?\s*(?:\[([^\]]*)\])?\s*(.*)/

export function parseFileContent(filePath: string, content: string, idPrefix: string = 'N'): Notation[] {
	const lines = content.split('\n')
	const notations: Notation[] = []
	let i = 0

	while (i < lines.length) {
		const match = lines[i].match(MARKER_REGEX)
		if (!match) {
			i++
			continue
		}

		const indent = match[1]
		const markerType = match[2] as MarkerType
		const inlineId = match[3] || undefined
		const description = match[4].trim()
		const startLine = i + 1 // 1-indexed
		const column = indent.length + 1

		// Collect continuation lines (// lines that aren't new markers)
		const bodyLines: string[] = []
		const rawLines: string[] = [lines[i]]
		i++

		while (i < lines.length) {
			const nextLine = lines[i]
			// Stop if it's a new marker
			if (MARKER_REGEX.test(nextLine)) break
			// Stop if not a comment line
			const commentMatch = nextLine.match(/^\s*\/\/\s?(.*)/)
			if (!commentMatch) break
			bodyLines.push(commentMatch[1])
			rawLines.push(nextLine)
			i++
		}

		// Collect code context lines (non-empty, non-comment lines until blank)
		const codeContext: string[] = []
		while (i < lines.length) {
			const codeLine = lines[i]
			if (codeLine.trim() === '') break
			if (/^\s*\/\//.test(codeLine)) break
			codeContext.push(codeLine)
			rawLines.push(codeLine)
			i++
		}

		const endLine = startLine + rawLines.length - 1
		const id = inlineId || generateStableId(idPrefix, filePath, startLine)
		const attrs = parseAttributes(bodyLines)
		const actions = parseActions(bodyLines)

		const notation: Notation = {
			id,
			type: markerType,
			description,
			body: bodyLines,
			codeContext,
			location: {
				file: filePath,
				line: startLine,
				column,
				endLine,
			},
			author: attrs.author,
			assignee: attrs.assignee,
			priority: attrs.priority,
			risk: attrs.risk,
			status: Status.OPEN,
			tags: attrs.tags,
			dueDate: attrs.dueDate,
			createdDate: attrs.createdDate,
			performance: attrs.performance,
			debt: attrs.debt,
			actions,
			relationships: attrs.relationships,
			rawBlock: rawLines.join('\n'),
			scannedAt: new Date().toISOString(),
		}

		notations.push(notation)
	}

	return notations
}
