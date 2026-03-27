import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { TopicsTrendsResponse } from '../../types/api'

interface TopicsScatterProps {
  data: TopicsTrendsResponse
  limit?: number
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; volume: number; sentiment: number } }[] }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{d.name}</p>
      <p className="text-slate-500">Volume: <span className="text-slate-700 font-medium">{d.volume.toLocaleString()}</span></p>
      <p className="text-slate-500">Sentiment: <span className="text-slate-700 font-medium">{Math.round(d.sentiment)}</span></p>
    </div>
  )
}

export default function TopicsScatter({ data, limit = 20 }: TopicsScatterProps) {
  const allTopics = [...data.growing.data, ...data.decreasing.data]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit)
    .map((t) => ({ name: t.name, volume: t.volume, sentiment: Math.round(t.sentiment) }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="sentiment"
          type="number"
          name="Sentiment"
          domain={[40, 100]}
          label={{ value: 'Sentiment Score', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94a3b8' }}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          dataKey="volume"
          type="number"
          name="Volume"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={allTopics} fillOpacity={0.8}>
          {allTopics.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.sentiment >= 80 ? '#6366f1' : entry.sentiment >= 60 ? '#f59e0b' : '#ef4444'}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}
