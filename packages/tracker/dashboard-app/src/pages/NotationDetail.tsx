import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNotations } from '../hooks/useNotations'
import { fetchSource, saveSource, saveActions, createIssue } from '../hooks/useQuery'
import { cn } from '@/lib/utils'
import { getTypeConfig, getStatusConfig, getPriorityConfig } from '@/lib/tracker-config'
import { CodeBlock } from '../components/CodeBlock'
import { ActionDisplay } from '../components/ActionDisplay'
import { ActionForm } from '../components/ActionForm'
import { AuthorAvatar } from '../components/AuthorAvatar'
import { SuggestedFix } from '../components/SuggestedFix'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { ThemeToggle } from '../components/theme-toggle'
import { Textarea } from '../components/ui/textarea'
import { Separator } from '../components/ui/separator'
import type { NotationAction } from '../hooks/useNotations'

interface IntegrationConfig {
  github: boolean
  jira: boolean
  ai: boolean
}

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
  const [integrations, setIntegrations] = useState<IntegrationConfig>({ github: false, jira: false, ai: false })
  const [issueUrl, setIssueUrl] = useState<string | null>(null)
  const [creatingIssue, setCreatingIssue] = useState(false)

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setIntegrations(data.integrations || {}))
      .catch(() => {})
  }, [])

  if (!notation) {
    return (
      <div className="max-w-[800px] mx-auto p-6">
        <Button variant="link" className="text-sm text-primary p-0" onClick={() => navigate('/')}>
          &larr; Back
        </Button>
        <p className="text-muted-foreground mt-10 text-center">Notation not found</p>
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

  const handleCreateIssue = async (provider: 'github' | 'jira') => {
    try {
      setCreatingIssue(true)
      setError(null)
      const result = await createIssue(notation.id, provider)
      setIssueUrl(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create issue')
    } finally {
      setCreatingIssue(false)
    }
  }

  const codeContextStartLine = notation.location.endLine
    ? notation.location.endLine - notation.codeContext.length + 1
    : notation.location.line

  const tConfig = getTypeConfig(notation.type)
  const sConfig = getStatusConfig(notation.status)
  const pConfig = notation.priority ? getPriorityConfig(notation.priority) : undefined

  const displayedIssueUrl = issueUrl || notation.linkedIssue

  return (
    <div className="max-w-[800px] mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <Button variant="link" className="text-sm text-primary p-0" onClick={() => navigate('/')}>
          &larr; Back to dashboard
        </Button>
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-2.5 mb-2">
        <Badge
          variant="outline"
          className={cn('text-[13px] font-bold', tConfig.color, tConfig.bgColor, tConfig.borderColor)}
        >
          {notation.type}
        </Badge>
        <span className="text-[13px] text-muted-foreground">{notation.id}</span>
      </div>

      <h1 className="text-[22px] font-semibold m-0 mb-4 text-foreground">{notation.description}</h1>

      {error && (
        <div className="p-2 px-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-[13px] mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5 p-4 bg-card rounded-lg border">
        <Detail label="Status" value={sConfig.label} valueClass={sConfig.color} />
        <Detail label="Priority" value={notation.priority || 'none'} valueClass={pConfig?.color} />
        <Detail label="Assignee" value={notation.assignee || 'unassigned'} />
        <Detail label="Due Date" value={notation.dueDate || 'none'} />
        <Detail label="File" value={`${notation.location.file}:${notation.location.line}`} />
        <Detail label="Risk" value={notation.risk || 'none'} />
        {notation.author && <Detail label="Comment Author" value={notation.author} />}
        {notation.blame && (
          <div>
            <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wide">Git Blame Author</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AuthorAvatar name={notation.blame.author} email={notation.blame.email} size={20} />
              <span className="text-sm text-foreground">{notation.blame.author}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {notation.blame.commitHash.slice(0, 8)} &middot; {new Date(notation.blame.date).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* EOL info for deprecations */}
      {notation.type === 'DEPRECATION' && (notation.eolDate || notation.replacement) && (
        <div className="p-2.5 px-3.5 bg-pink-500/5 border border-pink-500/20 rounded-md mb-4">
          {notation.eolDate && (
            <div className={cn('text-[13px] text-pink-600 dark:text-pink-300', notation.replacement && 'mb-1')}>
              EOL Date: <strong>{notation.eolDate}</strong>
            </div>
          )}
          {notation.replacement && (
            <div className="text-[13px] text-emerald-400">
              Replacement: <strong>{notation.replacement}</strong>
            </div>
          )}
        </div>
      )}

      {/* Issue tracker integration */}
      <div className="mb-4 flex gap-2 items-center">
        {integrations.github && !displayedIssueUrl && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-primary bg-primary/15 border-primary/30 hover:bg-primary/25"
            onClick={() => handleCreateIssue('github')}
            disabled={creatingIssue}
          >
            {creatingIssue ? 'Creating...' : 'Create GitHub Issue'}
          </Button>
        )}
        {integrations.jira && !displayedIssueUrl && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-blue-400 bg-blue-500/15 border-blue-500/30 hover:bg-blue-500/25"
            onClick={() => handleCreateIssue('jira')}
            disabled={creatingIssue}
          >
            {creatingIssue ? 'Creating...' : 'Create Jira Issue'}
          </Button>
        )}
        {displayedIssueUrl && (
          <a
            href={displayedIssueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline"
          >
            Linked Issue: {displayedIssueUrl}
          </a>
        )}
      </div>

      {notation.tags.length > 0 && (
        <div className="mb-5">
          <SectionLabel>Tags</SectionLabel>
          <div className="flex gap-1.5 flex-wrap">
            {notation.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs text-primary bg-primary/10 border-primary/30">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {notation.body.length > 0 && (
        <div className="mb-5">
          <SectionLabel>Body</SectionLabel>
          <pre className="bg-card border p-3 rounded-md text-[13px] overflow-auto m-0 text-secondary-foreground font-mono">
            {notation.body.join('\n')}
          </pre>
        </div>
      )}

      {notation.codeContext.length > 0 && (
        <div className="mb-5">
          <SectionLabel>Code Context</SectionLabel>
          <CodeBlock
            code={notation.codeContext.join('\n')}
            showLineNumbers
            startLine={codeContextStartLine}
          />
        </div>
      )}

      {/* AI Suggested Fix */}
      {integrations.ai && (
        <SuggestedFix notationId={notation.id} notationType={notation.type} />
      )}

      {notation.relationships.length > 0 && (
        <div className="mb-5">
          <SectionLabel>Relationships</SectionLabel>
          <ul className="m-0 pl-5">
            {notation.relationships.map((rel, i) => (
              <li key={i} className="text-sm text-secondary-foreground">{rel}</li>
            ))}
          </ul>
        </div>
      )}

      {notation.debt && (
        <div className="mb-5">
          <SectionLabel>Technical Debt</SectionLabel>
          <p className="text-sm text-secondary-foreground m-0">
            {notation.debt.hours}h (compounding: {notation.debt.compounding})
          </p>
        </div>
      )}

      <Separator className="my-5" />

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <SectionLabel>Actions</SectionLabel>
          {!addingAction && editingActionIndex === null && (
            <Button onClick={() => setAddingAction(true)} size="sm">
              + Add Action
            </Button>
          )}
        </div>
        {actions.length === 0 && !addingAction && (
          <p className="text-[13px] text-muted-foreground m-0">No actions configured</p>
        )}
        <div className="flex flex-col gap-1.5">
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

      <Separator className="my-5" />

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-1.5">
          <SectionLabel>Raw Block</SectionLabel>
          {!editing && (
            <Button onClick={handleEdit} size="sm">
              Edit
            </Button>
          )}
        </div>
        {editing ? (
          <div>
            <Textarea
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              spellCheck={false}
              className="min-h-[200px] font-mono text-[13px] resize-y"
            />
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-600/90 text-emerald-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancelEdit} disabled={saving} variant="outline">
                Cancel
              </Button>
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

function Detail({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wide">{label}</span>
      <div className={cn('text-sm mt-0.5', valueClass || 'text-foreground')}>{value}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return <div className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-1.5">{children}</div>
}
