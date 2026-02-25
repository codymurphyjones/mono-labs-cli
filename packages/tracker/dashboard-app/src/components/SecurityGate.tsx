import { cn } from '@/lib/utils'
import { Badge } from './ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible'
import { useState } from 'react'

interface GateViolation {
  notationId: string
  description: string
  priority: string
  file: string
  line: number
}

interface GateResult {
  passed: boolean
  violations: GateViolation[]
  summary: string
}

interface SecurityGateProps {
  gateResult: GateResult | null
}

export function SecurityGate({ gateResult }: SecurityGateProps) {
  const [expanded, setExpanded] = useState(false)

  if (!gateResult) return null

  const passed = gateResult.passed

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            'p-2.5 px-3.5 rounded-lg border mb-4',
            passed ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30',
            gateResult.violations.length > 0 && 'cursor-pointer',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{passed ? '\u2611' : '\u2612'}</span>
            <span className={cn('text-sm font-semibold', passed ? 'text-emerald-400' : 'text-red-400')}>
              Security Gate: {passed ? 'PASSING' : 'FAILING'}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {gateResult.summary}
            </span>
            {gateResult.violations.length > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {expanded ? '\u25B2' : '\u25BC'}
              </span>
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {gateResult.violations.length > 0 && (
          <div className="mb-4 -mt-3 flex flex-col gap-1 px-3.5">
            {gateResult.violations.map((v, i) => (
              <div
                key={i}
                className="text-xs p-1 px-2 bg-red-500/5 rounded flex gap-2 items-center"
              >
                <Badge variant="outline" className="text-[10px] font-bold uppercase text-red-400 bg-red-500/20 border-0">
                  {v.priority}
                </Badge>
                <span className="text-foreground">{v.description}</span>
                <span className="text-muted-foreground ml-auto text-[11px]">
                  {v.file}:{v.line}
                </span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
