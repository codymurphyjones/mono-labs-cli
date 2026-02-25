import { cn } from '@/lib/utils'
import { STATUS_CONFIG, getStatusConfig } from '@/lib/tracker-config'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import { Badge } from './ui/badge'
import { useState } from 'react'

interface InlineStatusEditorProps {
  value: string
  onChange: (value: string) => void
}

const STATUSES = ['open', 'in_progress', 'blocked', 'resolved']

export function InlineStatusEditor({ value, onChange }: InlineStatusEditorProps) {
  const [open, setOpen] = useState(false)
  const config = getStatusConfig(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold rounded border cursor-pointer bg-transparent',
            config.color,
          )}
        >
          <span className={cn('size-[5px] rounded-full', config.dot)} />
          {config.label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-[120px] p-0">
        {STATUSES.map((s) => {
          const sc = getStatusConfig(s)
          return (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false) }}
              className={cn(
                'flex items-center gap-1.5 w-full px-2.5 py-1.5 text-xs border-0 cursor-pointer text-left bg-transparent',
                'hover:bg-accent transition-colors',
                s === value && 'bg-accent',
                sc.color,
              )}
            >
              <span className={cn('size-[5px] rounded-full', sc.dot)} />
              {sc.label}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
