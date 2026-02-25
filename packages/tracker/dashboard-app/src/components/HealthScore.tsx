import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible'

interface HealthDeduction {
  reason: string
  deduction: number
}

interface HealthScoreProps {
  score: number | null
}

export function HealthScore({ score }: HealthScoreProps) {
  const [deductions, setDeductions] = useState<HealthDeduction[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setDeductions(data.deductions || []))
      .catch(() => {})
  }, [score])

  if (score === null) return null

  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'
  const colorClass = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const bgClass = score >= 80 ? 'bg-emerald-500/10' : score >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'

  // SVG circular gauge
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDash = (score / 100) * circumference
  const strokeGap = circumference - strokeDash

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <div className="p-3 px-4 bg-card border rounded-lg mb-4 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="relative size-20">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40" cy="40" r={radius}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                <circle
                  cx="40" cy="40" r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="6"
                  strokeDasharray={`${strokeDash} ${strokeGap}`}
                  strokeDashoffset={circumference * 0.25}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className={cn('text-xl font-bold', colorClass)}>{score}</div>
                <div className="text-[9px] text-muted-foreground uppercase">Health</div>
              </div>
            </div>

            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground mb-1">
                Code Health Score
              </div>
              <div className="text-xs text-muted-foreground">
                {score >= 80 ? 'Good condition' : score >= 50 ? 'Needs attention' : 'Critical — take action'}
              </div>
              {deductions.length > 0 && (
                <div className="text-[11px] text-muted-foreground mt-1">
                  {deductions.length} deduction{deductions.length !== 1 ? 's' : ''} {expanded ? '\u25B2' : '\u25BC'}
                </div>
              )}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {deductions.length > 0 && (
          <div className="mb-4 -mt-3 px-4 flex flex-col gap-0.5">
            {deductions.map((d, i) => (
              <div
                key={i}
                className={cn('flex justify-between text-xs p-0.5 px-1.5 rounded', bgClass)}
              >
                <span className="text-secondary-foreground">{d.reason}</span>
                <span className="text-red-400 font-semibold">-{d.deduction}</span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
