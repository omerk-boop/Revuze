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
import type { TimeSeriesResponse } from '../../types/api'

interface TimeSeriesChartProps {
  data: TimeSeriesResponse
  metrics: ('sentiment' | 'volume' | 'reviews_star_rating')[]
}

const METRIC_DISPLAY: Record<string, { label: string; color: string; yAxisId: string }> = {
  sentiment: { label: 'Sentiment', color: '#6366f1', yAxisId: 'score' },
  volume: { label: 'Volume', color: '#0ea5e9', yAxisId: 'volume' },
  reviews_star_rating: { label: 'Avg Rating', color: '#f59e0b', yAxisId: 'score' },
}

export default function TimeSeriesChart({ data, metrics }: TimeSeriesChartProps) {
  // data.date is already formatted by the aggregator (aggregateTimeSeries)
  const chartData = data.data.map((d) => ({
    ...d,
    reviews_star_rating: parseFloat(Number(d.reviews_star_rating).toFixed(2)),
  }))

  const showVolume = metrics.includes('volume')
  const showScore = metrics.some((m) => m !== 'volume')

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
        {showScore && (
          <YAxis
            yAxisId="score"
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
        )}
        {showVolume && (
          <YAxis
            yAxisId="volume"
            orientation="right"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
          />
        )}
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        {metrics.map((metric) => {
          const cfg = METRIC_DISPLAY[metric]
          return (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              name={cfg.label}
              stroke={cfg.color}
              strokeWidth={2}
              dot={false}
              yAxisId={cfg.yAxisId}
              activeDot={{ r: 4 }}
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}
