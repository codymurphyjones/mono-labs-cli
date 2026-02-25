import { cn } from '@/lib/utils'
import { getTypeConfig, STAT_BORDER_COLORS } from '@/lib/tracker-config'
import { Sparkline } from './Sparkline'
import { useSnapshots } from '../hooks/useSnapshots'

interface Stats {
  total: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  byStatus: Record<string, number>
  overdue: number
  blocked: number
  totalDebtHours: number
}

interface StatsPanelProps {
  stats: Stats | null
}

function StatCard({ label, value, borderClass, valueClass }: {
  label: string
  value: number | string
  borderClass?: string
  valueClass?: string
}) {
  return (
    <div className={cn(
      'p-3 px-4 bg-card rounded-lg border min-w-[100px]',
      borderClass && `border-t-2 ${borderClass}`,
    )}>
      <div className="text-xs text-muted-foreground uppercase mb-1">{label}</div>
      <div className={cn('text-2xl font-semibold text-foreground', valueClass)}>{value}</div>
    </div>
  )
}

function TypeCountCard({ type, count, sparklineData }: { type: string; count: number; sparklineData?: number[] }) {
  const config = getTypeConfig(type)

  return (
    <div className={cn(
      'p-2 px-3 bg-card rounded-md border min-w-[80px] flex items-center gap-2',
      config.borderColor,
    )}>
      <span className={cn('text-[11px] font-semibold', config.color)}>
        {type}
      </span>
      {sparklineData && sparklineData.length >= 2 && (
        <Sparkline data={sparklineData} width={40} height={16} />
      )}
      <span className="text-base font-semibold text-foreground ml-auto">{count}</span>
    </div>
  )
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const { snapshots } = useSnapshots(30)

  if (!stats) return null

  // Build sparkline data per type from snapshots
  const typeSparklines: Record<string, number[]> = {}
  for (const snap of snapshots) {
    for (const [type, count] of Object.entries(snap.stats.byType)) {
      if (!typeSparklines[type]) typeSparklines[type] = []
      typeSparklines[type].push(count)
    }
  }

  return (
    <div className="mb-6">
      {/* Primary stat cards */}
      <div className="flex gap-3 flex-wrap mb-4">
        <StatCard label="Total" value={stats.total} borderClass={STAT_BORDER_COLORS.total} />
        <StatCard label="Overdue" value={stats.overdue} borderClass={STAT_BORDER_COLORS.overdue} valueClass={stats.overdue > 0 ? 'text-red-400' : undefined} />
        <StatCard label="Blocked" value={stats.blocked} borderClass={STAT_BORDER_COLORS.blocked} valueClass={stats.blocked > 0 ? 'text-amber-400' : undefined} />
        <StatCard label="Debt Hours" value={stats.totalDebtHours} borderClass={STAT_BORDER_COLORS.debtHours} />
      </div>
      {/* Type count cards */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(stats.byType).map(([type, count]) => (
          <TypeCountCard
            key={type}
            type={type}
            count={count}
            sparklineData={typeSparklines[type]}
          />
        ))}
      </div>
    </div>
  )
}
