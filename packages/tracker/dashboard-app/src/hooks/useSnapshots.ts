import { useState, useEffect } from 'react'

interface Snapshot {
  date: string
  stats: {
    total: number
    byType: Record<string, number>
    byPriority: Record<string, number>
    byStatus: Record<string, number>
    overdue: number
    blocked: number
    totalDebtHours: number
  }
  healthScore: number
}

export function useSnapshots(days: number = 30) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/snapshots?days=${days}`)
      .then((res) => res.json())
      .then((data) => {
        setSnapshots(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [days])

  return { snapshots, loading }
}
