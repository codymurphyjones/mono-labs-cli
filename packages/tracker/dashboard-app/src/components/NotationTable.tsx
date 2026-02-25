import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getTypeConfig, getPriorityConfig, getVerbColor } from '@/lib/tracker-config'
import { InlineStatusEditor } from './InlineStatusEditor'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import { Input } from './ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table'
import type { NotationAction } from '../hooks/useNotations'

interface Notation {
  id: string
  type: string
  description: string
  location: { file: string; line: number }
  priority?: string
  status: string
  tags: string[]
  assignee?: string
  actions: NotationAction[]
}

interface NotationTableProps {
  notations: Notation[]
  selected: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onStatusChange: (id: string, status: string) => void
  onPriorityChange: (id: string, priority: string) => void
  onAssigneeChange: (id: string, assignee: string) => void
  onExecuteAction: (id: string, actionIndex: number) => void
  sortColumn: string
  sortDir: 'asc' | 'desc'
  onSort: (column: string) => void
}

function shortenPath(file: string): string {
  const parts = file.split('/')
  if (parts.length <= 2) return file
  return '.../' + parts.slice(-2).join('/')
}

const columns = [
  { key: 'type', label: 'Type', width: 'w-[90px]' },
  { key: 'description', label: 'Description', width: '' },
  { key: 'file', label: 'File', width: 'w-[160px]' },
  { key: 'priority', label: 'Priority', width: 'w-[90px]' },
  { key: 'status', label: 'Status', width: 'w-[110px]' },
  { key: 'assignee', label: 'Assignee', width: 'w-[100px]' },
  { key: 'actions', label: 'Actions', width: 'w-[80px]' },
]

export function NotationTable({
  notations, selected, onToggleSelect, onSelectAll,
  onStatusChange, onPriorityChange, onAssigneeChange, onExecuteAction,
  sortColumn, sortDir, onSort,
}: NotationTableProps) {
  const navigate = useNavigate()
  const allSelected = notations.length > 0 && selected.size === notations.length

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          {columns.map((col) => (
            <TableHead
              key={col.key}
              onClick={() => onSort(col.key)}
              className={cn('cursor-pointer select-none text-[11px] uppercase tracking-wide', col.width)}
            >
              {col.label}
              {sortColumn === col.key && (
                <span className="ml-1 text-[10px]">
                  {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
                </span>
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {notations.map((n) => {
          const tConfig = getTypeConfig(n.type)
          const isSelected = selected.has(n.id)

          return (
            <TableRow
              key={n.id}
              data-state={isSelected ? 'selected' : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(n.id)}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn('text-[11px] font-bold', tConfig.color, tConfig.bgColor, tConfig.borderColor)}
                >
                  {n.type}
                </Badge>
              </TableCell>
              <TableCell
                className="cursor-pointer text-foreground/90"
                onClick={() => navigate(`/notation/${n.id}`)}
              >
                {n.description}
              </TableCell>
              <TableCell className="text-[11px] text-muted-foreground">
                {shortenPath(n.location.file)}:{n.location.line}
              </TableCell>
              <TableCell>
                <PrioritySelector
                  value={n.priority || ''}
                  onChange={(p) => onPriorityChange(n.id, p)}
                />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <InlineStatusEditor value={n.status} onChange={(s) => onStatusChange(n.id, s)} />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <EditableAssignee
                  value={n.assignee || ''}
                  onChange={(a) => onAssigneeChange(n.id, a)}
                />
              </TableCell>
              <TableCell>
                {n.actions.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onExecuteAction(n.id, 0) }}
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-semibold rounded border uppercase cursor-pointer bg-transparent',
                      getVerbColor(n.actions[0].verb),
                    )}
                  >
                    {n.actions[0].verb}
                  </button>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function PrioritySelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const pConfig = value ? getPriorityConfig(value) : undefined
  const priorities = ['critical', 'high', 'medium', 'low', 'minimal']

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded border cursor-pointer bg-transparent',
            pConfig?.color || 'text-muted-foreground',
          )}
        >
          {value && <span className={cn('size-[5px] rounded-full', pConfig?.dot || 'bg-slate-500')} />}
          {value || 'none'}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-[100px] p-0">
        {priorities.map((p) => {
          const pc = getPriorityConfig(p)
          return (
            <button
              key={p}
              onClick={(e) => { e.stopPropagation(); onChange(p); setOpen(false) }}
              className={cn(
                'flex items-center gap-1.5 w-full px-2.5 py-1.5 text-xs border-0 cursor-pointer text-left bg-transparent',
                'hover:bg-accent transition-colors',
                p === value && 'bg-accent',
                pc.color,
              )}
            >
              <span className={cn('size-[5px] rounded-full', pc.dot)} />
              {p}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

function EditableAssignee({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)

  if (editing) {
    return (
      <Input
        autoFocus
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { onChange(text); setEditing(false) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onChange(text); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
        onClick={(e) => e.stopPropagation()}
        className="h-6 w-20 text-[11px] px-1.5"
      />
    )
  }

  return (
    <span
      onClick={(e) => { e.stopPropagation(); setEditing(true); setText(value) }}
      className={cn(
        'text-[11px] cursor-pointer border-b border-dashed border-border',
        value ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {value || 'unassigned'}
    </span>
  )
}
