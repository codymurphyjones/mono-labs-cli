interface FilterSidebarProps {
  types: string[]
  statuses: string[]
  priorities: string[]
  selectedType: string
  selectedStatus: string
  selectedPriority: string
  onTypeChange: (type: string) => void
  onStatusChange: (status: string) => void
  onPriorityChange: (priority: string) => void
}

function FilterGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button
          onClick={() => onChange('')}
          style={{
            padding: '4px 8px',
            background: selected === '' ? '#e0e7ff' : 'transparent',
            border: 'none',
            borderRadius: '4px',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '13px',
            color: selected === '' ? '#4338ca' : '#374151',
          }}
        >
          All
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '4px 8px',
              background: selected === opt ? '#e0e7ff' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              color: selected === opt ? '#4338ca' : '#374151',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export function FilterSidebar({
  types,
  statuses,
  priorities,
  selectedType,
  selectedStatus,
  selectedPriority,
  onTypeChange,
  onStatusChange,
  onPriorityChange,
}: FilterSidebarProps) {
  return (
    <div style={{ width: '180px', flexShrink: 0, paddingRight: '16px', borderRight: '1px solid #e5e7eb' }}>
      <FilterGroup label="Type" options={types} selected={selectedType} onChange={onTypeChange} />
      <FilterGroup label="Status" options={statuses} selected={selectedStatus} onChange={onStatusChange} />
      <FilterGroup label="Priority" options={priorities} selected={selectedPriority} onChange={onPriorityChange} />
    </div>
  )
}
