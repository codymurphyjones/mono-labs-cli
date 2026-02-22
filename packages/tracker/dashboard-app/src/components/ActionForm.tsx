import { useState } from 'react'
import type { NotationAction } from '../hooks/useNotations'

interface ActionFormProps {
  initial?: NotationAction
  onSubmit: (action: NotationAction) => void
  onCancel: () => void
}

const VERBS = ['replace', 'remove', 'rename', 'insert', 'extract', 'move', 'wrapIn', 'generic'] as const

const VERB_FIELDS: Record<string, { label: string; key: string }[]> = {
  replace: [
    { label: 'Target', key: 'target' },
    { label: 'Replacement', key: 'replacement' },
  ],
  remove: [{ label: 'Target', key: 'target' }],
  rename: [
    { label: 'From', key: 'from' },
    { label: 'To', key: 'to' },
  ],
  insert: [
    { label: 'Content', key: 'content' },
    { label: 'Anchor', key: 'anchor' },
  ],
  extract: [
    { label: 'Target', key: 'target' },
    { label: 'Destination', key: 'destination' },
  ],
  move: [
    { label: 'Target', key: 'target' },
    { label: 'Destination', key: 'destination' },
  ],
  wrapIn: [
    { label: 'Target', key: 'target' },
    { label: 'Wrapper', key: 'wrapper' },
  ],
  generic: [{ label: 'Description', key: 'description' }],
}

function buildRaw(verb: string, fields: Record<string, string>, position?: string): string {
  switch (verb) {
    case 'replace':
      return `replace('${fields.target}', '${fields.replacement}')`
    case 'remove':
      return `remove('${fields.target}')`
    case 'rename':
      return `rename('${fields.from}', '${fields.to}')`
    case 'insert': {
      const base = `insert('${fields.content}')`
      return fields.anchor ? `${base}.${position || 'after'}('${fields.anchor}')` : base
    }
    case 'extract': {
      const base = `extract('${fields.target}')`
      return fields.destination ? `${base}.to('${fields.destination}')` : base
    }
    case 'move': {
      const base = `move('${fields.target}')`
      return fields.destination ? `${base}.to('${fields.destination}')` : base
    }
    case 'wrapIn':
      return `wrapIn('${fields.target}', '${fields.wrapper}')`
    case 'generic':
      return fields.description || ''
    default:
      return ''
  }
}

function buildArgs(verb: string, fields: Record<string, string>, position: string): NotationAction['args'] {
  switch (verb) {
    case 'replace':
      return { verb: 'replace', target: fields.target || '', replacement: fields.replacement || '' }
    case 'remove':
      return { verb: 'remove', target: fields.target || '' }
    case 'rename':
      return { verb: 'rename', from: fields.from || '', to: fields.to || '' }
    case 'insert':
      return { verb: 'insert', content: fields.content || '', position: position as 'before' | 'after', anchor: fields.anchor || '' }
    case 'extract':
      return { verb: 'extract', target: fields.target || '', destination: fields.destination || '' }
    case 'move':
      return { verb: 'move', target: fields.target || '', destination: fields.destination || '' }
    case 'wrapIn':
      return { verb: 'wrapIn', target: fields.target || '', wrapper: fields.wrapper || '' }
    case 'generic':
      return { verb: 'generic', description: fields.description || '' }
    default:
      return { verb: 'generic', description: '' }
  }
}

function getInitialFields(action?: NotationAction): Record<string, string> {
  if (!action) return {}
  const args = action.args as Record<string, string>
  const fields: Record<string, string> = {}
  for (const key of Object.keys(args)) {
    if (key !== 'verb') fields[key] = args[key] || ''
  }
  return fields
}

export function ActionForm({ initial, onSubmit, onCancel }: ActionFormProps) {
  const [verb, setVerb] = useState(initial?.verb || 'replace')
  const [fields, setFields] = useState<Record<string, string>>(getInitialFields(initial))
  const [position, setPosition] = useState<string>(
    initial?.args.verb === 'insert' ? initial.args.position : 'after'
  )

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    const raw = buildRaw(verb, fields, position)
    const args = buildArgs(verb, fields, position)
    onSubmit({ verb, raw, args } as NotationAction)
  }

  const currentFields = VERB_FIELDS[verb] || []

  return (
    <div
      style={{
        padding: '10px',
        background: '#f9fafb',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label style={{ fontSize: '12px', color: '#6b7280', flexShrink: 0 }}>Verb</label>
        <select
          value={verb}
          onChange={(e) => {
            setVerb(e.target.value)
            setFields({})
          }}
          style={{
            padding: '4px 8px',
            fontSize: '13px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
          }}
        >
          {VERBS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {currentFields.map((field) => (
        <div key={field.key} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', minWidth: '80px', flexShrink: 0 }}>{field.label}</label>
          <input
            type="text"
            value={fields[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: '13px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              fontFamily: 'monospace',
            }}
          />
        </div>
      ))}

      {verb === 'insert' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', minWidth: '80px', flexShrink: 0 }}>Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            style={{
              padding: '4px 8px',
              fontSize: '13px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
            }}
          >
            <option value="before">before</option>
            <option value="after">after</option>
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={handleSubmit}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {initial ? 'Update' : 'Add'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
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
  )
}
