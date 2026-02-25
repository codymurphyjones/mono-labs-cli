import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotations } from '../hooks/useNotations'
import { cn } from '@/lib/utils'
import { NotationTable } from '../components/NotationTable'
import { BatchActionBar } from '../components/BatchActionBar'
import { ExecuteActionDialog } from '../components/ExecuteActionDialog'
import { SearchBar, type ScanStatus } from '../components/SearchBar'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ThemeToggle } from '../components/theme-toggle'
import { triggerScan, executeAction, updateMetadata, batchOperation, createIssue } from '../hooks/useQuery'

interface IntegrationConfig {
  github: boolean
  jira: boolean
  ai: boolean
}

export function ManageNotations() {
  const navigate = useNavigate()
  const { notations, connected } = useNotations()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortColumn, setSortColumn] = useState('type')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [integrations, setIntegrations] = useState<IntegrationConfig>({ github: false, jira: false, ai: false })
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle')
  const [scanMessage, setScanMessage] = useState('')
  const [actionDialog, setActionDialog] = useState<{ id: string; actionIndex: number } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState<{ id: string; message: string; success: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setIntegrations(data.integrations || {}))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    let list = [...notations]

    if (search) {
      const lower = search.toLowerCase()
      list = list.filter((n) => {
        const searchable = `${n.description} ${n.body.join(' ')} ${n.tags.join(' ')} ${n.type} ${n.id}`.toLowerCase()
        return searchable.includes(lower)
      })
    }

    list.sort((a, b) => {
      let va: any = (a as any)[sortColumn]
      let vb: any = (b as any)[sortColumn]
      if (sortColumn === 'file') { va = a.location.file; vb = b.location.file }
      if (sortColumn === 'actions') { va = a.actions.length; vb = b.actions.length }
      if (va === undefined) va = ''
      if (vb === undefined) vb = ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [notations, search, sortColumn, sortDir])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDir('asc')
    }
  }

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((n) => n.id)))
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateMetadata(id, { status })
    } catch {}
  }

  const handlePriorityChange = async (id: string, priority: string) => {
    try {
      await updateMetadata(id, { priority })
    } catch {}
  }

  const handleAssigneeChange = async (id: string, assignee: string) => {
    try {
      await updateMetadata(id, { assignee })
    } catch {}
  }

  const handleExecuteAction = (id: string, actionIndex: number) => {
    setActionDialog({ id, actionIndex })
  }

  const handleConfirmAction = async () => {
    if (!actionDialog) return
    setActionLoading(true)
    try {
      const result = await executeAction(actionDialog.id, actionDialog.actionIndex)
      setResultMessage({ id: actionDialog.id, message: result.message, success: result.success })
      setTimeout(() => setResultMessage(null), 5000)
    } catch (err: any) {
      setResultMessage({ id: actionDialog.id, message: err.message || 'Failed', success: false })
      setTimeout(() => setResultMessage(null), 5000)
    } finally {
      setActionLoading(false)
      setActionDialog(null)
    }
  }

  const handleBatchStatus = async (status: string) => {
    try {
      await batchOperation(Array.from(selected), 'updateStatus', { value: status })
      setSelected(new Set())
    } catch {}
  }

  const handleBatchPriority = async (priority: string) => {
    try {
      await batchOperation(Array.from(selected), 'updatePriority', { value: priority })
      setSelected(new Set())
    } catch {}
  }

  const handleBatchAssignee = async (assignee: string) => {
    try {
      await batchOperation(Array.from(selected), 'updateAssignee', { value: assignee })
      setSelected(new Set())
    } catch {}
  }

  const handleBatchCreateIssue = async (provider: 'github' | 'jira') => {
    for (const id of selected) {
      try {
        await createIssue(id, provider)
      } catch {}
    }
    setSelected(new Set())
  }

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

  const dialogNotation = actionDialog
    ? notations.find((n) => n.id === actionDialog.id)
    : null
  const dialogAction = dialogNotation?.actions[actionDialog?.actionIndex ?? -1]

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="link"
            className="text-sm text-primary p-0"
            onClick={() => navigate('/')}
          >
            &larr; Dashboard
          </Button>
          <h1 className="text-2xl font-bold m-0 text-foreground">Manage Notations</h1>
          <Badge variant="secondary" className="text-xs bg-primary/15 text-primary border-0">
            {filtered.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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

      <SearchBar value={search} onChange={setSearch} onScan={handleScan} scanStatus={scanStatus} scanMessage={scanMessage} />

      {resultMessage && (
        <div className={cn(
          'p-2 px-3 rounded-md text-[13px] mb-3 border',
          resultMessage.success
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400',
        )}>
          [{resultMessage.id}] {resultMessage.message}
        </div>
      )}

      <NotationTable
        notations={filtered}
        selected={selected}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onAssigneeChange={handleAssigneeChange}
        onExecuteAction={handleExecuteAction}
        sortColumn={sortColumn}
        sortDir={sortDir}
        onSort={handleSort}
      />

      <BatchActionBar
        selectedCount={selected.size}
        onSetStatus={handleBatchStatus}
        onSetPriority={handleBatchPriority}
        onSetAssignee={handleBatchAssignee}
        onCreateIssue={handleBatchCreateIssue}
        onClearSelection={() => setSelected(new Set())}
        hasGithub={integrations.github}
        hasJira={integrations.jira}
      />

      {actionDialog && dialogAction && (
        <ExecuteActionDialog
          action={dialogAction}
          notationId={actionDialog.id}
          onConfirm={handleConfirmAction}
          onCancel={() => setActionDialog(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
