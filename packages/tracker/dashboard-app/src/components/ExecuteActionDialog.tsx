import type { NotationAction } from '../hooks/useNotations'
import { cn } from '@/lib/utils'
import { getVerbColor } from '@/lib/tracker-config'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface ExecuteActionDialogProps {
  action: NotationAction
  notationId: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function formatArgs(action: NotationAction): string {
  const args = action.args
  switch (args.verb) {
    case 'replace': return `Replace "${args.target}" with "${args.replacement}"`
    case 'remove': return `Remove "${args.target}"`
    case 'rename': return `Rename "${args.from}" to "${args.to}"`
    case 'insert': return `Insert "${args.content}" ${args.position} "${args.anchor}"`
    case 'extract': return `Extract "${args.target}" to ${args.destination}`
    case 'move': return `Move "${args.target}" to ${args.destination}`
    case 'wrapIn': return `Wrap "${args.target}" with ${args.wrapper}`
    case 'generic': return args.description
    default: return action.raw
  }
}

export function ExecuteActionDialog({ action, notationId, onConfirm, onCancel, loading }: ExecuteActionDialogProps) {
  const verbColor = getVerbColor(action.verb)

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Execute Action</DialogTitle>
          <DialogDescription>
            This will modify the source file. The change cannot be automatically undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-2.5 px-3 bg-accent/30 border rounded-md">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className={cn('text-[11px] font-bold uppercase', verbColor)}>
              {action.verb}
            </Badge>
            <span className="text-xs text-muted-foreground">{notationId}</span>
          </div>
          <p className="text-[13px] text-secondary-foreground m-0 font-mono">
            {formatArgs(action)}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? 'Executing...' : 'Execute'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
