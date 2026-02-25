import { cn } from '@/lib/utils'
import { getTypeConfig, getPriorityConfig, getStatusConfig } from '@/lib/tracker-config'
import { Separator } from './ui/separator'

interface FilterSidebarProps {
  types: string[]
  statuses: string[]
  priorities: string[]
  selectedTypes: string[]
  selectedStatus: string
  selectedPriority: string
  onTypeChange: (types: string[]) => void
  onStatusChange: (status: string) => void
  onPriorityChange: (priority: string) => void
}

function TypePills({
  types,
  selected,
  onChange,
}: {
  types: string[]
  selected: string[]
  onChange: (types: string[]) => void
}) {
  const toggle = (type: string) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type))
    } else {
      onChange([...selected, type])
    }
  }

  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-muted-foreground/60 mb-1.5 uppercase tracking-wide">
        Type
      </div>
      <div className="flex flex-wrap gap-1">
        {types.map((type) => {
          const active = selected.includes(type)
          const config = getTypeConfig(type)
          return (
            <button
              key={type}
              onClick={() => toggle(type)}
              className={cn(
                'px-2 py-0.5 text-[11px] font-semibold rounded-full cursor-pointer border transition-all',
                active
                  ? cn(config.color, config.bgColor, config.borderColor)
                  : 'text-muted-foreground border-border bg-transparent hover:bg-accent/50',
              )}
            >
              {type}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ButtonGroup({
  label,
  options,
  selected,
  onChange,
  getColor,
}: {
  label: string
  options: string[]
  selected: string
  onChange: (value: string) => void
  getColor: (opt: string) => string
}) {
  const allOptions = ['', ...options]
  const labels = ['All', ...options]

  return (
    <div className="mb-4">
      <div className="text-[11px] font-semibold text-muted-foreground/60 mb-1.5 uppercase tracking-wide">
        {label}
      </div>
      <div className="flex flex-col gap-0.5">
        {allOptions.map((opt, i) => {
          const active = selected === opt
          const dotClass = opt ? getColor(opt) : ''

          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded cursor-pointer border-0 text-left transition-colors',
                active
                  ? 'bg-accent text-foreground font-semibold'
                  : 'bg-transparent text-muted-foreground hover:bg-accent/50',
              )}
            >
              {opt && (
                <span className={cn('size-1.5 rounded-full shrink-0', dotClass)} />
              )}
              {labels[i]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function FilterSidebar({
  types,
  statuses,
  priorities,
  selectedTypes,
  selectedStatus,
  selectedPriority,
  onTypeChange,
  onStatusChange,
  onPriorityChange,
}: FilterSidebarProps) {
  return (
    <div className="w-[200px] shrink-0 pr-4 border-r">
      <TypePills types={types} selected={selectedTypes} onChange={onTypeChange} />
      <Separator className="my-3" />
      <ButtonGroup
        label="Status"
        options={statuses}
        selected={selectedStatus}
        onChange={onStatusChange}
        getColor={(opt) => getStatusConfig(opt).dot}
      />
      <Separator className="my-3" />
      <ButtonGroup
        label="Priority"
        options={priorities}
        selected={selectedPriority}
        onChange={onPriorityChange}
        getColor={(opt) => getPriorityConfig(opt).dot}
      />
    </div>
  )
}
