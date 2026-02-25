import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getTypeConfig, getPriorityConfig } from '@/lib/tracker-config'
import { Badge } from './ui/badge'
import { AuthorAvatar } from './AuthorAvatar'

interface Notation {
  id: string
  type: string
  description: string
  location: { file: string; line: number }
  priority?: string
  status: string
  tags: string[]
  assignee?: string
  dueDate?: string
  blame?: { author: string; email: string; date: string; commitHash: string }
}

interface NotationListProps {
  notations: Notation[]
}

function shortenPath(file: string): string {
  const parts = file.split('/')
  if (parts.length <= 3) return file
  return '.../' + parts.slice(-3).join('/')
}

export function NotationList({ notations }: NotationListProps) {
  const navigate = useNavigate()

  if (notations.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        No notations found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {notations.map((n) => {
        const tConfig = getTypeConfig(n.type)
        const pConfig = n.priority ? getPriorityConfig(n.priority) : undefined

        return (
          <div
            key={n.id}
            onClick={() => navigate(`/notation/${n.id}`)}
            className="flex items-center gap-2.5 p-2.5 px-3.5 rounded-md border cursor-pointer transition-colors hover:bg-accent/30"
          >
            {/* Avatar */}
            {n.blame && (
              <AuthorAvatar name={n.blame.author} email={n.blame.email} size={20} />
            )}
            {/* Type badge */}
            <Badge
              variant="outline"
              className={cn('text-[11px] font-bold shrink-0', tConfig.color, tConfig.bgColor, tConfig.borderColor)}
            >
              {n.type}
            </Badge>
            {/* Description */}
            <span className="flex-1 text-sm text-foreground/90">{n.description}</span>
            {/* Priority */}
            {n.priority && pConfig && (
              <span className={cn(
                'inline-flex items-center gap-1 text-[11px] px-1.5 rounded border border-transparent',
                pConfig.color,
              )}>
                <span className={cn('size-[5px] rounded-full', pConfig.dot)} />
                {n.priority}
              </span>
            )}
            {/* File path */}
            <span className="text-[11px] text-muted-foreground/60 shrink-0">
              {shortenPath(n.location.file)}:{n.location.line}
            </span>
          </div>
        )
      })}
    </div>
  )
}
