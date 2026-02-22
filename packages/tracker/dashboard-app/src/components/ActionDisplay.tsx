import type { NotationAction } from '../hooks/useNotations'

interface ActionDisplayProps {
  action: NotationAction
  onEdit: () => void
  onDelete: () => void
}

const verbColors: Record<string, string> = {
  replace: '#f59e0b',
  remove: '#ef4444',
  rename: '#3b82f6',
  insert: '#10b981',
  extract: '#8b5cf6',
  move: '#6366f1',
  wrapIn: '#ec4899',
  generic: '#6b7280',
}

function formatArgs(action: NotationAction): string {
  const args = action.args
  switch (args.verb) {
    case 'replace':
      return `${args.target} \u2192 ${args.replacement}`
    case 'remove':
      return args.target
    case 'rename':
      return `${args.from} \u2192 ${args.to}`
    case 'insert':
      return `${args.content} ${args.position} ${args.anchor}`
    case 'extract':
      return `${args.target}${args.destination ? ` to ${args.destination}` : ''}`
    case 'move':
      return `${args.target}${args.destination ? ` to ${args.destination}` : ''}`
    case 'wrapIn':
      return `${args.target} in ${args.wrapper}`
    case 'generic':
      return args.description
    default:
      return action.raw
  }
}

export function ActionDisplay({ action, onEdit, onDelete }: ActionDisplayProps) {
  const color = verbColors[action.verb] || '#6b7280'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        background: '#f9fafb',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: '4px',
          color: 'white',
          background: color,
          flexShrink: 0,
          textTransform: 'uppercase',
        }}
      >
        {action.verb}
      </span>
      <span style={{ flex: 1, fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>
        {formatArgs(action)}
      </span>
      <button
        onClick={onEdit}
        style={{
          padding: '2px 6px',
          fontSize: '11px',
          background: 'transparent',
          border: '1px solid #d1d5db',
          borderRadius: '3px',
          cursor: 'pointer',
          color: '#6b7280',
        }}
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        style={{
          padding: '2px 6px',
          fontSize: '11px',
          background: 'transparent',
          border: '1px solid #fecaca',
          borderRadius: '3px',
          cursor: 'pointer',
          color: '#dc2626',
        }}
      >
        Delete
      </button>
    </div>
  )
}
