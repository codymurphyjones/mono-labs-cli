import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'

interface BatchActionBarProps {
  selectedCount: number
  onSetStatus: (status: string) => void
  onSetPriority: (priority: string) => void
  onSetAssignee: (assignee: string) => void
  onCreateIssue?: (provider: 'github' | 'jira') => void
  onClearSelection: () => void
  hasGithub: boolean
  hasJira: boolean
}

const STATUSES = ['open', 'in_progress', 'blocked', 'resolved']
const PRIORITIES = ['critical', 'high', 'medium', 'low', 'minimal']

export function BatchActionBar({
  selectedCount, onSetStatus, onSetPriority, onSetAssignee,
  onCreateIssue, onClearSelection, hasGithub, hasJira,
}: BatchActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="sticky bottom-4 p-2.5 px-4 bg-card border border-primary rounded-xl flex items-center gap-2.5 shadow-lg z-50">
      <span className="text-[13px] font-semibold text-primary">
        {selectedCount} selected
      </span>

      <StatusDropdown onSelect={onSetStatus} />
      <PriorityDropdown onSelect={onSetPriority} />
      <AssigneeInput onSubmit={onSetAssignee} />

      {hasGithub && onCreateIssue && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs text-primary bg-primary/15 border-primary/30 hover:bg-primary/25"
          onClick={() => onCreateIssue('github')}
        >
          GitHub Issue
        </Button>
      )}
      {hasJira && onCreateIssue && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs text-primary bg-primary/15 border-primary/30 hover:bg-primary/25"
          onClick={() => onCreateIssue('jira')}
        >
          Jira Issue
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="ml-auto text-xs"
        onClick={onClearSelection}
      >
        Clear
      </Button>
    </div>
  )
}

function StatusDropdown({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs text-primary bg-primary/15 border-primary/30 hover:bg-primary/25">
          Status ▾
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top">
        {STATUSES.map((opt) => (
          <DropdownMenuItem key={opt} onSelect={() => onSelect(opt)}>
            {opt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PriorityDropdown({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs text-primary bg-primary/15 border-primary/30 hover:bg-primary/25">
          Priority ▾
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top">
        {PRIORITIES.map((opt) => (
          <DropdownMenuItem key={opt} onSelect={() => onSelect(opt)}>
            {opt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AssigneeInput({ onSubmit }: { onSubmit: (v: string) => void }) {
  const [value, setValue] = useState('')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs text-primary bg-primary/15 border-primary/30 hover:bg-primary/25">
          Assignee ▾
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto p-2 flex gap-1">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Assignee name"
          className="h-7 w-[120px] text-xs"
          onKeyDown={(e) => { if (e.key === 'Enter' && value) { onSubmit(value); setValue('') } }}
        />
        <Button
          size="sm"
          className="h-7 text-[11px]"
          onClick={() => { if (value) { onSubmit(value); setValue('') } }}
        >
          Set
        </Button>
      </PopoverContent>
    </Popover>
  )
}
