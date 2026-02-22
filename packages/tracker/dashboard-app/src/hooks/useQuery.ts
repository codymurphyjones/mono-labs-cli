import { useState, useEffect } from 'react'

export function useQuery<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return { data, loading, error }
}

export async function triggerScan(): Promise<{ count: number }> {
  const res = await fetch('/api/scan', { method: 'POST' })
  return res.json()
}

export async function fetchSource(id: string): Promise<{ source: string; file: string; line: number; endLine: number }> {
  const res = await fetch(`/api/notations/${id}/source`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function saveSource(id: string, source: string): Promise<void> {
  const res = await fetch(`/api/notations/${id}/source`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function saveActions(id: string, actions: unknown[]): Promise<void> {
  const res = await fetch(`/api/notations/${id}/actions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actions }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
