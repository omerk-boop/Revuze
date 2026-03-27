import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { StatisticsTotals } from '../../types/api'
import type { KPIMetric } from '../../types/dashboard'

interface KPICardProps {
  data: StatisticsTotals
  metric: KPIMetric
}

const METRIC_CONFIG: Record<KPIMetric, { label: string; format: (v: number) => string; trendKey: keyof StatisticsTotals | null; color: string }> = {
  sentiment: {
    label: 'Sentiment Score',
    format: (v) => `${Math.round(v)}`,
    trendKey: 'sentiment_trend',
    color: 'text-violet-600',
  },
  volume: {
    label: 'Review Volume',
    format: (v) => v.toLocaleString(),
    trendKey: 'volume_trend',
    color: 'text-blue-600',
  },
  reviews_star_rating: {
    label: 'Avg Star Rating',
    format: (v) => v.toFixed(2),
    trendKey: 'reviews_star_rating_trend',
    color: 'text-amber-500',
  },
  pdp_star_rating: {
    label: 'PDP Star Rating',
    format: (v) => v.toFixed(2),
    trendKey: 'pdp_star_rating_trend',
    color: 'text-orange-500',
  },
  products: {
    label: 'Products',
    format: (v) => v.toLocaleString(),
    trendKey: null,
    color: 'text-emerald-600',
  },
  brands: {
    label: 'Brands',
    format: (v) => v.toLocaleString(),
    trendKey: null,
    color: 'text-indigo-600',
  },
}

const MetricIcon = ({ metric }: { metric: KPIMetric }) => {
  const icons: Record<KPIMetric, string> = {
    sentiment: '💬',
    volume: '📊',
    reviews_star_rating: '⭐',
    pdp_star_rating: '🏷️',
    products: '📦',
    brands: '🏢',
  }
  return <span className="text-2xl">{icons[metric]}</span>
}

export default function KPICard({ data, metric }: KPICardProps) {
  const config = METRIC_CONFIG[metric]
  const value = data[metric] as number
  const trend = config.trendKey ? (data[config.trendKey] as number) : null

  const trendIsPositive = trend !== null && trend > 0
  const trendIsNegative = trend !== null && trend < 0

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{config.label}</p>
          <p className={`text-3xl font-bold mt-1 ${config.color}`}>{config.format(value)}</p>
        </div>
        <MetricIcon metric={metric} />
      </div>

      {trend !== null && (
        <div className="flex items-center gap-1.5 mt-2">
          {trendIsPositive && <TrendingUp className="w-4 h-4 text-emerald-500" />}
          {trendIsNegative && <TrendingDown className="w-4 h-4 text-red-500" />}
          {!trendIsPositive && !trendIsNegative && <Minus className="w-4 h-4 text-slate-400" />}
          <span
            className={`text-sm font-medium ${
              trendIsPositive ? 'text-emerald-600' : trendIsNegative ? 'text-red-600' : 'text-slate-400'
            }`}
          >
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">vs prior period</span>
        </div>
      )}
    </div>
  )
}
