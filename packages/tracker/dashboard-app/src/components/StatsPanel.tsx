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

const typeColors: Record<string, string> = {
  TODO: '#3b82f6',
  FIXME: '#f59e0b',
  BUG: '#ef4444',
  HACK: '#8b5cf6',
  NOTE: '#6b7280',
  OPTIMIZE: '#10b981',
  SECURITY: '#dc2626',
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        background: '#f9fafb',
        borderRadius: '8px',
        borderLeft: color ? `4px solid ${color}` : undefined,
        minWidth: '100px',
      }}
    >
      <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 600, color: color || '#111827' }}>{value}</div>
    </div>
  )
}

export function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) return null

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Overdue" value={stats.overdue} color="#ef4444" />
        <StatCard label="Blocked" value={stats.blocked} color="#f59e0b" />
        <StatCard label="Debt Hours" value={stats.totalDebtHours} color="#8b5cf6" />
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {Object.entries(stats.byType).map(([type, count]) => (
          <StatCard key={type} label={type} value={count} color={typeColors[type]} />
        ))}
      </div>
    </div>
  )
}
