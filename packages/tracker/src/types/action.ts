export const ActionVerb = {
	REPLACE: 'replace',
	REMOVE: 'remove',
	RENAME: 'rename',
	INSERT: 'insert',
	EXTRACT: 'extract',
	MOVE: 'move',
	WRAP_IN: 'wrapIn',
	GENERIC: 'generic',
} as const
export type ActionVerb = (typeof ActionVerb)[keyof typeof ActionVerb]

export interface ReplaceArgs {
	verb: typeof ActionVerb.REPLACE
	target: string
	replacement: string
}

export interface RemoveArgs {
	verb: typeof ActionVerb.REMOVE
	target: string
}

export interface RenameArgs {
	verb: typeof ActionVerb.RENAME
	from: string
	to: string
}

export interface InsertArgs {
	verb: typeof ActionVerb.INSERT
	content: string
	position: 'before' | 'after'
	anchor: string
}

export interface ExtractArgs {
	verb: typeof ActionVerb.EXTRACT
	target: string
	destination: string
}

export interface MoveArgs {
	verb: typeof ActionVerb.MOVE
	target: string
	destination: string
}

export interface WrapInArgs {
	verb: typeof ActionVerb.WRAP_IN
	target: string
	wrapper: string
}

export interface GenericArgs {
	verb: typeof ActionVerb.GENERIC
	description: string
}

export type ActionArgs =
	| ReplaceArgs
	| RemoveArgs
	| RenameArgs
	| InsertArgs
	| ExtractArgs
	| MoveArgs
	| WrapInArgs
	| GenericArgs

export interface NotationAction {
	verb: ActionVerb
	raw: string
	args: ActionArgs
}
