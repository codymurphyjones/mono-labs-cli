import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'

export interface NotationAction {
  verb: string
  raw: string
  args: { verb: string; [key: string]: string }
}

interface Notation {
  id: string
  type: string
  description: string
  body: string[]
  codeContext: string[]
  location: { file: string; line: number; column: number; endLine?: number }
  author?: string
  assignee?: string
  priority?: string
  risk?: string
  status: string
  tags: string[]
  dueDate?: string
  createdDate?: string
  actions: NotationAction[]
  relationships: string[]
  rawBlock: string
  scannedAt: string
  debt?: { hours: number; compounding: string }
  performance?: { before: string; after: string; unit: string }
  eolDate?: string
  replacement?: string
  blame?: { author: string; email: string; date: string; commitHash: string }
  linkedIssue?: string
}

interface NotationStats {
  total: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  byStatus: Record<string, number>
  byTag: Record<string, number>
  byAssignee: Record<string, number>
  overdue: number
  blocked: number
  totalDebtHours: number
}

interface GateViolation {
  notationId: string
  description: string
  priority: string
  file: string
  line: number
}

interface GateResult {
  passed: boolean
  violations: GateViolation[]
  summary: string
}

interface NotationsState {
  notations: Notation[]
  stats: NotationStats | null
  connected: boolean
  healthScore: number | null
  gateResult: GateResult | null
}

const NotationsContext = createContext<NotationsState>({
  notations: [],
  stats: null,
  connected: false,
  healthScore: null,
  gateResult: null,
})

export function useNotations() {
  return useContext(NotationsContext)
}

export function NotationsProvider({ children }: { children: ReactNode }) {
  const [notations, setNotations] = useState<Notation[]>([])
  const [stats, setStats] = useState<NotationStats | null>(null)
  const [connected, setConnected] = useState(false)
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const [gateResult, setGateResult] = useState<GateResult | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        // Reconnect after 2 seconds
        setTimeout(connect, 2000)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'init' || data.type === 'update') {
            setNotations(data.notations)
            setStats(data.stats)
            if (data.healthScore !== undefined) setHealthScore(data.healthScore)
            if (data.gateResult !== undefined) setGateResult(data.gateResult)
          }
        } catch {
          // ignore malformed messages
        }
      }
    }

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [])

  return (
    <NotationsContext.Provider value={{ notations, stats, connected, healthScore, gateResult }}>
      {children}
    </NotationsContext.Provider>
  )
}
