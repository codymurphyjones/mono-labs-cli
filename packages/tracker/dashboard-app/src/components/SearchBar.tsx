import { useState } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onScan: () => void
}

export function SearchBar({ value, onChange, onScan }: SearchBarProps) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      <input
        type="text"
        placeholder="Search notations..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
      <button
        onClick={onScan}
        style={{
          padding: '8px 16px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Re-scan
      </button>
    </div>
  )
}
