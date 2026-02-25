import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible'

interface DeprecationEntry {
  id: string
  description: string
  eolDate?: string
  replacement?: string
  file: string
  line: number
  status: 'past-eol' | 'approaching-eol' | 'future' | 'unknown'
  daysUntilEol?: number
}

interface DeprecationSummary {
  total: number
  pastEol: number
  approachingEol: number
  future: number
  unknown: number
  entries: DeprecationEntry[]
}

const statusStyles = {
  'past-eol': { color: 'text-red-400', bg: 'bg-red-500/15', label: 'Past EOL' },
  'approaching-eol': { color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Approaching' },
  'future': { color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'Future' },
  'unknown': { color: 'text-slate-400', bg: 'bg-slate-500/15', label: 'Unknown' },
}

export function DeprecationPanel() {
  const [summary, setSummary] = useState<DeprecationSummary | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/governance/deprecations')
      .then((res) => res.json())
      .then(setSummary)
      .catch(() => {})
  }, [])

  if (!summary || summary.total === 0) return null

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="p-3 px-3.5 bg-card border rounded-lg mb-4">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2.5 cursor-pointer">
            <span className="text-[13px] font-semibold text-pink-600 dark:text-pink-300">DEPRECATIONS</span>
            <div className="flex gap-1.5">
              {summary.pastEol > 0 && (
                <Badge variant="secondary" className="text-[11px] text-red-400 bg-red-500/15 border-0">
                  {summary.pastEol} past EOL
                </Badge>
              )}
              {summary.approachingEol > 0 && (
                <Badge variant="secondary" className="text-[11px] text-amber-400 bg-amber-500/15 border-0">
                  {summary.approachingEol} approaching
                </Badge>
              )}
              {summary.future > 0 && (
                <Badge variant="secondary" className="text-[11px] text-emerald-400 bg-emerald-500/15 border-0">
                  {summary.future} future
                </Badge>
              )}
              {summary.unknown > 0 && (
                <Badge variant="secondary" className="text-[11px] text-slate-400 bg-slate-500/15 border-0">
                  {summary.unknown} unknown
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground ml-auto">
              {expanded ? '\u25B2' : '\u25BC'}
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2.5 flex flex-col gap-1">
            {summary.entries.map((entry) => {
              const sc = statusStyles[entry.status]
              return (
                <div
                  key={entry.id}
                  className={cn('text-xs p-1.5 px-2 rounded flex gap-2 items-center', sc.bg)}
                >
                  <Badge variant="secondary" className={cn('text-[10px] font-bold border-0', sc.color, sc.bg)}>
                    {sc.label}
                  </Badge>
                  <span className="text-foreground flex-1">{entry.description}</span>
                  {entry.eolDate && (
                    <span className="text-muted-foreground text-[11px]">
                      EOL: {entry.eolDate}
                      {entry.daysUntilEol !== undefined && ` (${entry.daysUntilEol}d)`}
                    </span>
                  )}
                  {entry.replacement && (
                    <span className="text-emerald-400 text-[11px]">
                      → {entry.replacement}
                    </span>
                  )}
                  <span className="text-muted-foreground text-[11px]">
                    {entry.file}:{entry.line}
                  </span>
                </div>
              )
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
