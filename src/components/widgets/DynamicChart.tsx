import { useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Scatter,
  ScatterChart,
  PieChart,
  Pie,
} from 'recharts'
import { format, parseISO } from 'date-fns'

// ─── Chart spec returned by the AI-generated transform ────────────────────────
// Claude writes a JS function body that receives `data` and `dateFns` and returns this.

export interface SeriesSpec {
  kind: 'bar' | 'line' | 'area' | 'pie'
  dataKey: string
  name: string
  color: string
  stackId?: string       // set same string on multiple series to stack them
  yAxisId?: string       // 'left' (default) or 'right'
}

export interface DynamicChartSpec {
  chartData: Record<string, unknown>[]
  xKey: string
  series: SeriesSpec[]
  rightAxisKeys?: string[]  // dataKeys that go on the right y-axis
  xLabel?: string
  yLabel?: string
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

interface DynamicChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  transformCode: string
}

const FALLBACK_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

export default function DynamicChart({ data, transformCode }: DynamicChartProps) {
  const spec = useMemo<DynamicChartSpec | null>(() => {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('data', 'dateFns', transformCode)
      const result = fn(data, { format, parseISO })
      if (!result || !Array.isArray(result.chartData) || !result.xKey || !Array.isArray(result.series)) {
        throw new Error('Transform must return { chartData, xKey, series }')
      }
      return result as DynamicChartSpec
    } catch (e) {
      throw new Error(`Chart transform error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [data, transformCode])

  if (!spec || !spec.chartData.length) {
    return <div className="flex items-center justify-center h-full text-xs text-slate-400">No data</div>
  }

  // ── Pie chart ──────────────────────────────────────────────────────────────
  if (spec.series.some((s) => s.kind === 'pie')) {
    const pieSeries = spec.series.find((s) => s.kind === 'pie')!
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <Pie
            data={spec.chartData}
            dataKey={pieSeries.dataKey}
            nameKey={spec.xKey}
            cx="50%"
            cy="50%"
            outerRadius="70%"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            labelLine={false}
          >
            {spec.chartData.map((_, i) => (
              <Cell key={i} fill={FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  // ── Composed chart (bar / line / area) ────────────────────────────────────
  const hasRight = spec.series.some(s => s.yAxisId === 'right')

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={spec.chartData} margin={{ top: 4, right: hasRight ? 16 : 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey={spec.xKey}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          interval="preserveStartEnd"
          label={spec.xLabel ? { value: spec.xLabel, position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94a3b8' } : undefined}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          label={spec.yLabel ? { value: spec.yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' } : undefined}
        />
        {hasRight && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
        )}
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {spec.series.map((s, i) => {
          const color = s.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
          const yAxisId = s.yAxisId || 'left'
          const commonProps = { key: s.dataKey, dataKey: s.dataKey, name: s.name, yAxisId }
          if (s.kind === 'bar') return <Bar {...commonProps} fill={color} stackId={s.stackId} radius={s.stackId ? undefined : [3, 3, 0, 0]} />
          if (s.kind === 'area') return <Area type="natural" {...commonProps} stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2.5} dot={false} />
          return <Line type="natural" {...commonProps} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        })}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// Export recharts + date-fns so the library entry can reference them
export { ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Scatter, ScatterChart, PieChart, Pie }
