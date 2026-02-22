import { useNavigate } from 'react-router-dom'
import { typeColors, priorityColors } from '../constants'

interface Notation {
  id: string
  type: string
  description: string
  location: { file: string; line: number }
  priority?: string
  status: string
  tags: string[]
  assignee?: string
  dueDate?: string
}

interface NotationListProps {
  notations: Notation[]
}

function shortenPath(file: string): string {
  const parts = file.split('/')
  if (parts.length <= 3) return file
  return '.../' + parts.slice(-3).join('/')
}

export function NotationList({ notations }: NotationListProps) {
  const navigate = useNavigate()

  if (notations.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
        No notations found
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {notations.map((n) => (
        <div
          key={n.id}
          onClick={() => navigate(`/notation/${n.id}`)}
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'background 0.1s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#f9fafb')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              color: 'white',
              background: typeColors[n.type] || '#6b7280',
              flexShrink: 0,
            }}
          >
            {n.type}
          </span>
          <span style={{ flex: 1, fontSize: '14px', color: '#111827' }}>{n.description}</span>
          {n.priority && (
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '4px',
                border: `1px solid ${priorityColors[n.priority] || '#d1d5db'}`,
                color: priorityColors[n.priority] || '#6b7280',
              }}
            >
              {n.priority}
            </span>
          )}
          <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
            {shortenPath(n.location.file)}:{n.location.line}
          </span>
        </div>
      ))}
    </div>
  )
}
