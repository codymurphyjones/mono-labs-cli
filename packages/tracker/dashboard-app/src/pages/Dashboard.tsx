import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotations } from '../hooks/useNotations'
import { triggerScan } from '../hooks/useQuery'
import { StatsPanel } from '../components/StatsPanel'
import { SearchBar, type ScanStatus } from '../components/SearchBar'
import { FilterSidebar } from '../components/FilterSidebar'
import { NotationList } from '../components/NotationList'
import { SecurityGate } from '../components/SecurityGate'
import { HealthScore } from '../components/HealthScore'
import { DeprecationPanel } from '../components/DeprecationPanel'
import { BurnDownChart } from '../components/BurnDownChart'
import { cn } from '@/lib/utils'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ThemeToggle } from '../components/theme-toggle'

const TYPES = ['TODO', 'FIXME', 'BUG', 'HACK', 'NOTE', 'OPTIMIZE', 'SECURITY', 'DEPRECATION', 'TICKET', 'TASK', 'DEBT', 'REFACTOR', 'MIGRATION', 'PERF', 'TEST']
const STATUSES = ['open', 'in_progress', 'blocked', 'resolved']
const PRIORITIES = ['critical', 'high', 'medium', 'low', 'minimal']

export function Dashboard() {
  const navigate = useNavigate()
  const { notations, stats, connected, healthScore, gateResult } = useNotations()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanMessage, setScanMessage] = useState('')

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
    setScanStatus('scanning')
    setScanMessage('')
    try {
      const { count } = await triggerScan()
      setScanStatus('success')
      setScanMessage(`Scanned ${count} items`)
    } catch (err: any) {
      setScanStatus('error')
      setScanMessage('Scan failed')
    } finally {
      setTimeout(() => { setScanStatus('idle'); setScanMessage('') }, 3000)
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <span className="text-xl text-primary">&#9670;</span>
          <h1 className="text-2xl font-bold m-0 text-foreground">Tracker Dashboard</h1>
          <Badge variant="secondary" className="text-[11px] bg-primary/15 text-primary border-0">
            v2.0
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-primary bg-primary/15 border-primary/30 hover:bg-primary/25"
            onClick={() => navigate('/manage')}
          >
            Manage
          </Button>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs border-0',
              connected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400',
            )}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>

      <SecurityGate gateResult={gateResult} />

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <HealthScore score={healthScore} />
        </div>
      </div>

      <DeprecationPanel />
      <StatsPanel stats={stats} />
      <BurnDownChart />
      <SearchBar value={search} onChange={setSearch} onScan={handleScan} scanStatus={scanStatus} scanMessage={scanMessage} />

      <div className="flex gap-5">
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
        <div className="flex-1">
          <div className="text-[13px] text-muted-foreground mb-2">
            {filtered.length} notation{filtered.length !== 1 ? 's' : ''}
          </div>
          <NotationList notations={filtered} />
        </div>
      </div>
    </div>
  )
}
