import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import type { BrandTimeSeriesData } from '../../types/api'

interface StackedBarChartProps {
  data: BrandTimeSeriesData
}

const BRAND_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
]

export default function StackedBarChart({ data }: StackedBarChartProps) {
  const chartData = data.points.map((pt) => ({
    ...pt,
    date: format(parseISO(pt.date), 'MMM d'),
  }))

  if (!data.brands.length || !chartData.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-400">
        No brand data — add brands to your filter or widget config
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
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
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {data.brands.map((brand, i) => (
          <Bar
            key={brand}
            dataKey={brand}
            stackId="stack"
            fill={BRAND_COLORS[i % BRAND_COLORS.length]}
            radius={i === data.brands.length - 1 ? [3, 3, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
