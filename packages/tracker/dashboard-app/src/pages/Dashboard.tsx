import { useState, useMemo } from 'react'
import { useNotations } from '../hooks/useNotations'
import { triggerScan } from '../hooks/useQuery'
import { StatsPanel } from '../components/StatsPanel'
import { SearchBar } from '../components/SearchBar'
import { FilterSidebar } from '../components/FilterSidebar'
import { NotationList } from '../components/NotationList'

const TYPES = ['TODO', 'FIXME', 'BUG', 'HACK', 'NOTE', 'OPTIMIZE', 'SECURITY']
const STATUSES = ['open', 'in_progress', 'blocked', 'resolved']
const PRIORITIES = ['critical', 'high', 'medium', 'low', 'minimal']

export function Dashboard() {
  const { notations, stats, connected } = useNotations()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const filtered = useMemo(() => {
    return notations.filter((n) => {
      if (filterType.length > 0 && !filterType.includes(n.type)) return false
      if (filterStatus && n.status !== filterStatus) return false
      if (filterPriority && n.priority !== filterPriority) return false
      if (search) {
        const lower = search.toLowerCase()
        const searchable = `${n.description} ${n.body.join(' ')} ${n.tags.join(' ')}`.toLowerCase()
        if (!searchable.includes(lower)) return false
      }
      return true
    })
  }, [notations, search, filterType, filterStatus, filterPriority])

  const handleScan = async () => {
    try {
      await triggerScan()
    } catch {
      // handled by WebSocket update
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Tracker Dashboard</h1>
        <span
          style={{
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '10px',
            background: connected ? '#dcfce7' : '#fee2e2',
            color: connected ? '#166534' : '#991b1b',
          }}
        >
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <StatsPanel stats={stats} />
      <SearchBar value={search} onChange={setSearch} onScan={handleScan} />

      <div style={{ display: 'flex', gap: '20px' }}>
        <FilterSidebar
          types={TYPES}
          statuses={STATUSES}
          priorities={PRIORITIES}
          selectedTypes={filterType}
          selectedStatus={filterStatus}
          selectedPriority={filterPriority}
          onTypeChange={setFilterType}
          onStatusChange={setFilterStatus}
          onPriorityChange={setFilterPriority}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
            {filtered.length} notation{filtered.length !== 1 ? 's' : ''}
          </div>
          <NotationList notations={filtered} />
        </div>
      </div>
    </div>
  )
}
