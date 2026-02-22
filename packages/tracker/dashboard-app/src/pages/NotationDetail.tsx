import { useParams, useNavigate } from 'react-router-dom'
import { useNotations } from '../hooks/useNotations'

const typeColors: Record<string, string> = {
  TODO: '#3b82f6',
  FIXME: '#f59e0b',
  BUG: '#ef4444',
  HACK: '#8b5cf6',
  NOTE: '#6b7280',
  OPTIMIZE: '#10b981',
  SECURITY: '#dc2626',
}

export function NotationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { notations } = useNotations()
  const notation = notations.find((n) => n.id === id)

  if (!notation) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '14px' }}>
          &larr; Back
        </button>
        <p style={{ color: '#9ca3af', marginTop: '40px', textAlign: 'center' }}>Notation not found</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: '14px', marginBottom: '16px' }}>
        &larr; Back to dashboard
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '4px',
            color: 'white',
            background: typeColors[notation.type] || '#6b7280',
          }}
        >
          {notation.type}
        </span>
        <span style={{ fontSize: '13px', color: '#9ca3af' }}>{notation.id}</span>
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 16px 0' }}>{notation.description}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <Detail label="Status" value={notation.status} />
        <Detail label="Priority" value={notation.priority || 'none'} />
        <Detail label="Assignee" value={notation.assignee || 'unassigned'} />
        <Detail label="Due Date" value={notation.dueDate || 'none'} />
        <Detail label="File" value={`${notation.location.file}:${notation.location.line}`} />
        <Detail label="Risk" value={notation.risk || 'none'} />
      </div>

      {notation.tags.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionLabel>Tags</SectionLabel>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {notation.tags.map((tag) => (
              <span key={tag} style={{ fontSize: '12px', padding: '2px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '10px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {notation.body.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionLabel>Body</SectionLabel>
          <pre style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', fontSize: '13px', overflow: 'auto', margin: 0 }}>
            {notation.body.join('\n')}
          </pre>
        </div>
      )}

      {notation.codeContext.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionLabel>Code Context</SectionLabel>
          <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px', borderRadius: '6px', fontSize: '13px', overflow: 'auto', margin: 0 }}>
            {notation.codeContext.join('\n')}
          </pre>
        </div>
      )}

      {notation.relationships.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <SectionLabel>Relationships</SectionLabel>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {notation.relationships.map((rel, i) => (
              <li key={i} style={{ fontSize: '14px', color: '#374151' }}>{rel}</li>
            ))}
          </ul>
        </div>
      )}

      {notation.debt && (
        <div style={{ marginBottom: '20px' }}>
          <SectionLabel>Technical Debt</SectionLabel>
          <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
            {notation.debt.hours}h (compounding: {notation.debt.compounding})
          </p>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <SectionLabel>Raw Block</SectionLabel>
        <pre style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', fontSize: '12px', overflow: 'auto', margin: 0, color: '#6b7280' }}>
          {notation.rawBlock}
        </pre>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ fontSize: '14px', color: '#111827' }}>{value}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>{children}</div>
}
