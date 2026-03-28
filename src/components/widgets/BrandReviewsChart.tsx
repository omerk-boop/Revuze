import { useState, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { BrandTimeSeriesData } from '../../types/api'

interface BrandReviewsChartProps {
  data: BrandTimeSeriesData
}

const BRAND_COLORS = [
  '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899',
]

export default function BrandReviewsChart({ data }: BrandReviewsChartProps) {
  const { brands, points } = data
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const handleLegendClick = useCallback((payload: { dataKey?: string }) => {
    if (!payload.dataKey) return
    const brand = payload.dataKey as string
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(brand)) next.delete(brand)
      else next.add(brand)
      return next
    })
  }, [])

  if (!brands.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
        <p>No brands selected.</p>
        <p className="text-xs">Add brand filters to the dashboard or specify brands in the widget config.</p>
      </div>
    )
  }

  const chartData = points.map((pt) => ({
    ...pt,
    date: (() => {
      try { return format(parseISO(pt.date as string), 'MMM d') }
      catch { return pt.date }
    })(),
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const payload = (props.payload as { value?: unknown; color?: unknown }[] | undefined) ?? []
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-1">
        {payload.map((entry) => {
          const value = String(entry.value ?? '')
          const color = String(entry.color ?? '#6366f1')
          const isHidden = hidden.has(value)
          return (
            <button
              key={value}
              onClick={() => handleLegendClick({ dataKey: value })}
              className={`flex items-center gap-1.5 text-xs transition-opacity ${isHidden ? 'opacity-30' : 'opacity-100'}`}
            >
              <span
                className="inline-block w-3 rounded-full"
                style={{ backgroundColor: color, height: 2 }}
              />
              <span className={`${isHidden ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                {value}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
          formatter={(value: number, name: string) => [value.toLocaleString(), name]}
        />
        <Legend content={renderLegend} />
        {brands.map((brand, i) => (
          <Line
            key={brand}
            type="natural"
            dataKey={brand}
            name={brand}
            stroke={BRAND_COLORS[i % BRAND_COLORS.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
            hide={hidden.has(brand)}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
