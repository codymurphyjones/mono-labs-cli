import type { NotationAction } from '../hooks/useNotations'
import { cn } from '@/lib/utils'
import { getVerbColor } from '@/lib/tracker-config'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface ActionDisplayProps {
  action: NotationAction
  onEdit: () => void
  onDelete: () => void
}

function formatArgs(action: NotationAction): string {
  const args = action.args
  switch (args.verb) {
    case 'replace':
      return `${args.target} \u2192 ${args.replacement}`
    case 'remove':
      return args.target
    case 'rename':
      return `${args.from} \u2192 ${args.to}`
    case 'insert':
      return `${args.content} ${args.position} ${args.anchor}`
    case 'extract':
      return `${args.target}${args.destination ? ` to ${args.destination}` : ''}`
    case 'move':
      return `${args.target}${args.destination ? ` to ${args.destination}` : ''}`
    case 'wrapIn':
      return `${args.target} in ${args.wrapper}`
    case 'generic':
      return args.description
    default:
      return action.raw
  }
}

export function ActionDisplay({ action, onEdit, onDelete }: ActionDisplayProps) {
  const verbColor = getVerbColor(action.verb)

  return (
    <div className="flex items-center gap-2 p-1.5 px-2.5 bg-card rounded-md border">
      <Badge
        variant="outline"
        className={cn('text-[11px] font-bold uppercase shrink-0', verbColor)}
      >
        {action.verb}
      </Badge>
      <span className="flex-1 text-[13px] text-secondary-foreground font-mono">
        {formatArgs(action)}
      </span>
      <Button variant="outline" size="sm" className="h-6 px-1.5 text-[11px] text-muted-foreground" onClick={onEdit}>
        Edit
      </Button>
      <Button variant="outline" size="sm" className="h-6 px-1.5 text-[11px] text-red-400 border-red-500/30" onClick={onDelete}>
        Delete
      </Button>
    </div>
  )
}
