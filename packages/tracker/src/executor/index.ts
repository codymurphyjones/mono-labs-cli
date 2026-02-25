export { executeAction, registerActionHandler } from './action-executor'
export type { ActionResult, ActionHandler } from './action-executor'
export { handleReplace, handleRemove, handleRename, handleInsert, handleExtract, handleMove, handleWrap } from './actions'

// Auto-register all handlers
import { registerActionHandler } from './action-executor'
import { handleReplace } from './actions/replace-action'
import { handleRemove } from './actions/remove-action'
import { handleRename } from './actions/rename-action'
import { handleInsert } from './actions/insert-action'
import { handleExtract } from './actions/extract-action'
import { handleMove } from './actions/move-action'
import { handleWrap } from './actions/wrap-action'

registerActionHandler('replace', handleReplace)
registerActionHandler('remove', handleRemove)
registerActionHandler('rename', handleRename)
registerActionHandler('insert', handleInsert)
registerActionHandler('extract', handleExtract)
registerActionHandler('move', handleMove)
registerActionHandler('wrapIn', handleWrap)
