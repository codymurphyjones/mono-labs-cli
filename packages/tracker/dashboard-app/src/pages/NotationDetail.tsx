import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNotations } from '../hooks/useNotations'
import { fetchSource, saveSource, saveActions } from '../hooks/useQuery'
import { typeColors } from '../constants'
import { CodeBlock } from '../components/CodeBlock'
import { ActionDisplay } from '../components/ActionDisplay'
import { ActionForm } from '../components/ActionForm'
import type { NotationAction } from '../hooks/useNotations'

export function NotationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { notations } = useNotations()
  const notation = notations.find((n) => n.id === id)

  const [editing, setEditing] = useState(false)
  const [sourceContent, setSourceContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [addingAction, setAddingAction] = useState(false)
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null)

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

  const handleEdit = async () => {
    try {
      setError(null)
      const data = await fetchSource(notation.id)
      setSourceContent(data.source)
      setEditing(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch source')
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      await saveSource(notation.id, sourceContent)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save source')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setError(null)
  }

  const actions = (notation.actions ?? []) as NotationAction[]

  const handleDeleteAction = async (index: number) => {
    const updated = actions.filter((_, i) => i !== index)
    try {
      setError(null)
      await saveActions(notation.id, updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete action')
    }
  }

  const handleSaveAction = async (action: NotationAction) => {
    let updated: NotationAction[]
    if (editingActionIndex !== null) {
      updated = actions.map((a, i) => (i === editingActionIndex ? action : a))
    } else {
      updated = [...actions, action]
    }
    try {
      setError(null)
      await saveActions(notation.id, updated)
      setAddingAction(false)
      setEditingActionIndex(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save action')
    }
  }

  const codeContextStartLine = notation.location.endLine
    ? notation.location.endLine - notation.codeContext.length + 1
    : notation.location.line

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

      {error && (
        <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

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
          <CodeBlock
            code={notation.codeContext.join('\n')}
            showLineNumbers
            startLine={codeContextStartLine}
          />
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

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <SectionLabel>Actions</SectionLabel>
          {!addingAction && editingActionIndex === null && (
            <button
              onClick={() => setAddingAction(true)}
              style={{
                padding: '2px 8px',
                fontSize: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              + Add Action
            </button>
          )}
        </div>
        {actions.length === 0 && !addingAction && (
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>No actions configured</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {actions.map((action, i) =>
            editingActionIndex === i ? (
              <ActionForm
                key={i}
                initial={action}
                onSubmit={handleSaveAction}
                onCancel={() => setEditingActionIndex(null)}
              />
            ) : (
              <ActionDisplay
                key={i}
                action={action}
                onEdit={() => setEditingActionIndex(i)}
                onDelete={() => handleDeleteAction(i)}
              />
            )
          )}
          {addingAction && (
            <ActionForm
              onSubmit={handleSaveAction}
              onCancel={() => setAddingAction(false)}
            />
          )}
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <SectionLabel>Raw Block</SectionLabel>
          {!editing && (
            <button
              onClick={handleEdit}
              style={{
                padding: '2px 8px',
                fontSize: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div>
            <textarea
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                minHeight: '200px',
                fontFamily: 'monospace',
                fontSize: '13px',
                background: '#1e293b',
                color: '#e2e8f0',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  background: saving ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'default' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <CodeBlock
            code={notation.rawBlock}
            startLine={notation.location.line}
          />
        )}
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
