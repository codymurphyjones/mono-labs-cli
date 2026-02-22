import { typeColors, priorityColors } from '../constants'

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
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
        Type
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {types.map((type) => {
          const active = selected.includes(type)
          const color = typeColors[type] || '#6b7280'
          return (
            <button
              key={type}
              onClick={() => toggle(type)}
              style={{
                padding: '3px 8px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '12px',
                cursor: 'pointer',
                border: `1px solid ${color}`,
                background: active ? color : 'transparent',
                color: active ? 'white' : color,
                transition: 'all 0.1s',
              }}
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
  colorMap,
}: {
  label: string
  options: string[]
  selected: string
  onChange: (value: string) => void
  colorMap?: Record<string, string>
}) {
  const allOptions = ['', ...options]
  const labels = ['All', ...options]

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex' }}>
        {allOptions.map((opt, i) => {
          const active = selected === opt
          const isFirst = i === 0
          const isLast = i === allOptions.length - 1
          const activeColor = (opt && colorMap?.[opt]) || '#3b82f6'

          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                border: `1px solid ${active ? activeColor : '#d1d5db'}`,
                borderLeft: isFirst ? `1px solid ${active ? activeColor : '#d1d5db'}` : 'none',
                borderRadius: isFirst
                  ? '4px 0 0 4px'
                  : isLast
                    ? '0 4px 4px 0'
                    : '0',
                background: active ? activeColor : 'white',
                color: active ? 'white' : '#374151',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.1s',
              }}
            >
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
    <div style={{ width: '200px', flexShrink: 0, paddingRight: '16px', borderRight: '1px solid #e5e7eb' }}>
      <TypePills types={types} selected={selectedTypes} onChange={onTypeChange} />
      <ButtonGroup label="Status" options={statuses} selected={selectedStatus} onChange={onStatusChange} />
      <ButtonGroup label="Priority" options={priorities} selected={selectedPriority} onChange={onPriorityChange} colorMap={priorityColors} />
    </div>
  )
}
