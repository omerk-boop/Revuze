import { TrendingUp, TrendingDown } from 'lucide-react'
import type { TopicDataPoint, TopicsTrendsResponse } from '../../types/api'
import type { TopicsTableConfig } from '../../types/dashboard'

interface TopicsTableProps {
  data: TopicsTrendsResponse
  config: TopicsTableConfig
}

function SentimentBadge({ value }: { value: number }) {
  const color =
    value >= 80 ? 'bg-emerald-100 text-emerald-700' :
    value >= 60 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {Math.round(value)}
    </span>
  )
}

function TrendCell({ value }: { value: number }) {
  const isPos = value > 0
  const isNeg = value < 0
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${isPos ? 'text-emerald-600' : isNeg ? 'text-red-500' : 'text-slate-400'}`}>
      {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : null}
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

export default function TopicsTable({ data, config }: TopicsTableProps) {
  let topics: TopicDataPoint[] = []

  if (config.mode === 'growing') {
    topics = data.growing.data
  } else if (config.mode === 'decreasing') {
    topics = data.decreasing.data
  } else {
    topics = [...data.growing.data, ...data.decreasing.data].sort((a, b) => b.volume - a.volume)
  }

  const limit = config.limit || 10
  topics = topics.slice(0, limit)

  if (topics.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-slate-400">No topics data</div>
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Topic</th>
            <th className="text-right py-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Volume</th>
            <th className="text-right py-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vol Trend</th>
            <th className="text-center py-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sentiment</th>
            <th className="text-right py-2 pl-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sent Trend</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic, i) => (
            <tr
              key={topic.identity}
              className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}
            >
              <td className="py-2 pr-4 font-medium text-slate-700">{topic.name}</td>
              <td className="py-2 px-4 text-right text-slate-600">{topic.volume.toLocaleString()}</td>
              <td className="py-2 px-4 text-right">
                <TrendCell value={topic.volume_trend} />
              </td>
              <td className="py-2 px-4 text-center">
                <SentimentBadge value={topic.sentiment} />
              </td>
              <td className="py-2 pl-4 text-right">
                <TrendCell value={topic.sentiment_trend} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
