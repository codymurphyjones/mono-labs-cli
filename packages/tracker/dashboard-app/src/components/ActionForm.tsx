import { useState } from 'react'
import type { NotationAction } from '../hooks/useNotations'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select'

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
    <div className="p-2.5 bg-card rounded-md border flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <label className="text-xs text-muted-foreground shrink-0">Verb</label>
        <Select
          value={verb}
          onValueChange={(v) => {
            setVerb(v)
            setFields({})
          }}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VERBS.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentFields.map((field) => (
        <div key={field.key} className="flex gap-2 items-center">
          <label className="text-xs text-muted-foreground min-w-[80px] shrink-0">{field.label}</label>
          <Input
            type="text"
            value={fields[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="flex-1 font-mono h-8 text-[13px]"
          />
        </div>
      ))}

      {verb === 'insert' && (
        <div className="flex gap-2 items-center">
          <label className="text-xs text-muted-foreground min-w-[80px] shrink-0">Position</label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="before">before</SelectItem>
              <SelectItem value="after">after</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-2 mt-1">
        <Button
          onClick={handleSubmit}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-600/90 text-emerald-50"
        >
          {initial ? 'Update' : 'Add'}
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  )
}
