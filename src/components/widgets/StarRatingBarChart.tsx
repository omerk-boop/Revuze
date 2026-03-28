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
import type { StarRatingTimeSeriesData } from '../../types/api'

interface StarRatingBarChartProps {
  data: StarRatingTimeSeriesData
}

const STAR_COLORS: Record<string, string> = {
  '1': '#ef4444', // red
  '2': '#f97316', // orange
  '3': '#f59e0b', // amber
  '4': '#84cc16', // lime
  '5': '#10b981', // emerald
}

const STAR_LABELS: Record<string, string> = {
  '1': '1 ★',
  '2': '2 ★',
  '3': '3 ★',
  '4': '4 ★',
  '5': '5 ★',
}

export default function StarRatingBarChart({ data }: StarRatingBarChartProps) {
  const chartData = data.points.map((pt) => ({
    ...pt,
    date: format(parseISO(pt.date), 'MMM d'),
  }))

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-400">
        No data available for the selected period
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
          formatter={(value: number, name: string) => [value.toLocaleString(), STAR_LABELS[name] ?? name]}
        />
        <Legend
          formatter={(value) => STAR_LABELS[value] ?? value}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        {(['1', '2', '3', '4', '5'] as const).map((star, i) => (
          <Bar
            key={star}
            dataKey={star}
            stackId="stack"
            fill={STAR_COLORS[star]}
            radius={i === 4 ? [3, 3, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
