import { useState } from 'react'
import { cn } from '@/lib/utils'
import { CodeBlock } from './CodeBlock'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface SuggestedFixProps {
  notationId: string
  notationType: string
}

interface FixResult {
  explanation: string
  diff: string
  confidence: 'low' | 'medium' | 'high'
}

const confidenceStyles = {
  low: 'text-red-400 bg-red-500/15',
  medium: 'text-amber-400 bg-amber-500/15',
  high: 'text-emerald-400 bg-emerald-500/15',
}

export function SuggestedFix({ notationId, notationType }: SuggestedFixProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FixResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  if (notationType !== 'BUG' && notationType !== 'OPTIMIZE') return null

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/notations/${notationId}/suggest-fix`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!result?.diff) return
    setApplying(true)
    try {
      const res = await fetch(`/api/notations/${notationId}/source`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: result.diff }),
      })
      if (!res.ok) throw new Error('Failed to apply fix')
      setResult(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wide">
          AI Suggested Fix
        </span>
        {!result && !loading && (
          <Button
            onClick={handleGenerate}
            variant="outline"
            size="sm"
            className="h-6 text-xs text-violet-300 bg-violet-500/15 border-violet-500/30 hover:bg-violet-500/25"
          >
            Generate Fix
          </Button>
        )}
      </div>

      {loading && (
        <div className="p-4 bg-card border rounded-md text-muted-foreground text-[13px] text-center">
          Generating suggestion... (this may take a few seconds)
        </div>
      )}

      {error && (
        <div className="p-2 px-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-[13px]">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-card border rounded-md overflow-hidden">
          <div className="p-2.5 px-3 border-b">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge
                variant="secondary"
                className={cn('text-[10px] font-bold border-0', confidenceStyles[result.confidence])}
              >
                {result.confidence} confidence
              </Badge>
            </div>
            <p className="text-[13px] text-secondary-foreground m-0">
              {result.explanation}
            </p>
          </div>

          {result.diff && (
            <div>
              <CodeBlock code={result.diff} language="diff" />
            </div>
          )}

          <div className="p-2 px-3 flex gap-2 border-t">
            <Button
              onClick={handleApply}
              disabled={applying || !result.diff}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-600/90 text-emerald-50"
            >
              {applying ? 'Applying...' : 'Apply Fix'}
            </Button>
            <Button onClick={() => setResult(null)} variant="outline" size="sm">
              Dismiss
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
