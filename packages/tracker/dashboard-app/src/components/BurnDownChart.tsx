import { useState, useEffect } from 'react'

interface BurnDownPoint {
  date: string
  total: number
  projected?: boolean
}

interface BurnDownData {
  historical: BurnDownPoint[]
  projection: BurnDownPoint[]
  weeklyResolutionRate: number
  estimatedZeroDate: string | null
}

export function BurnDownChart() {
  const [data, setData] = useState<BurnDownData | null>(null)

  useEffect(() => {
    fetch('/api/projection/burndown')
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data || data.historical.length < 7) return null

  const allPoints = [...data.historical, ...data.projection]
  if (allPoints.length < 2) return null

  const maxTotal = Math.max(...allPoints.map((p) => p.total))
  const width = 500
  const height = 160
  const padding = { top: 10, right: 10, bottom: 24, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const xScale = (i: number) => padding.left + (i / (allPoints.length - 1)) * chartWidth
  const yScale = (v: number) => padding.top + chartHeight - (v / (maxTotal || 1)) * chartHeight

  const historicalPath = data.historical.map((p, i) => {
    const x = xScale(i)
    const y = yScale(p.total)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')

  const projectionStartIdx = data.historical.length - 1
  const projectionPath = [data.historical[data.historical.length - 1], ...data.projection].map((p, i) => {
    const x = xScale(projectionStartIdx + i)
    const y = yScale(p.total)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')

  return (
    <div className="p-3 px-4 bg-card border rounded-lg mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] font-semibold text-foreground">Burn-Down Projection</span>
        <div className="flex gap-3 text-[11px]">
          <span className="text-muted-foreground">
            Resolution rate: <span className="text-emerald-400">{data.weeklyResolutionRate}/week</span>
          </span>
          {data.estimatedZeroDate && (
            <span className="text-muted-foreground">
              Est. zero: <span className="text-primary">{data.estimatedZeroDate}</span>
            </span>
          )}
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="block">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = yScale(frac * maxTotal)
          return (
            <g key={frac}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                stroke="var(--border)" strokeWidth="1" />
              <text x={padding.left - 4} y={y + 3}
                fill="currentColor" className="text-muted-foreground" fontSize="9" textAnchor="end">
                {Math.round(frac * maxTotal)}
              </text>
            </g>
          )
        })}

        {/* Historical line */}
        <path d={historicalPath} fill="none" stroke="#6f7dff" strokeWidth="2" />

        {/* Projection line (dashed) */}
        {data.projection.length > 0 && (
          <path d={projectionPath} fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="4 3" />
        )}

        {/* X-axis labels */}
        {allPoints.filter((_, i) => i === 0 || i === data.historical.length - 1 || i === allPoints.length - 1).map((p, i) => {
          const idx = i === 0 ? 0 : i === 1 ? data.historical.length - 1 : allPoints.length - 1
          return (
            <text key={i} x={xScale(idx)} y={height - 4}
              fill="currentColor" className="text-muted-foreground" fontSize="9" textAnchor="middle">
              {p.date.slice(5)}
            </text>
          )
        })}
      </svg>

      <div className="flex gap-4 justify-center mt-1 text-[10px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="w-3 h-0.5 bg-primary inline-block" />
          Historical
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="w-3 h-0.5 inline-block border-t-2 border-dashed border-emerald-400" />
          Projected
        </span>
      </div>
    </div>
  )
}
