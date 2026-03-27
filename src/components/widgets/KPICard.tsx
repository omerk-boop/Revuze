import { TrendingUp, TrendingDown, Minus, MessageSquare, BarChart3, Star, Tag, Package, Building2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { StatisticsTotals } from '../../types/api'
import type { KPIMetric } from '../../types/dashboard'

interface KPICardProps {
  data: StatisticsTotals
  metric: KPIMetric
}

interface MetricConfig {
  label: string
  format: (v: number) => string
  trendKey: keyof StatisticsTotals | null
  icon: LucideIcon
  iconBg: string
  iconColor: string
  valueColor: string
}

const METRIC_CONFIG: Record<KPIMetric, MetricConfig> = {
  sentiment: {
    label: 'Sentiment Score',
    format: (v) => `${Math.round(v)}%`,
    trendKey: 'sentiment_trend',
    icon: MessageSquare,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    valueColor: 'text-violet-700',
  },
  volume: {
    label: 'Review Volume',
    format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString(),
    trendKey: 'volume_trend',
    icon: BarChart3,
    iconBg: 'bg-brand-100',
    iconColor: 'text-brand-600',
    valueColor: 'text-brand-700',
  },
  reviews_star_rating: {
    label: 'Avg Star Rating',
    format: (v) => v.toFixed(2),
    trendKey: 'reviews_star_rating_trend',
    icon: Star,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    valueColor: 'text-amber-700',
  },
  pdp_star_rating: {
    label: 'PDP Star Rating',
    format: (v) => v.toFixed(2),
    trendKey: 'pdp_star_rating_trend',
    icon: Tag,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    valueColor: 'text-orange-700',
  },
  products: {
    label: 'Products Tracked',
    format: (v) => v.toLocaleString(),
    trendKey: null,
    icon: Package,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    valueColor: 'text-emerald-700',
  },
  brands: {
    label: 'Brands Tracked',
    format: (v) => v.toLocaleString(),
    trendKey: null,
    icon: Building2,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    valueColor: 'text-indigo-700',
  },
}

export default function KPICard({ data, metric }: KPICardProps) {
  const cfg = METRIC_CONFIG[metric]
  const value = data[metric] as number
  const trend = cfg.trendKey ? (data[cfg.trendKey] as number) : null
  const Icon = cfg.icon

  const isPositive = trend !== null && trend > 0
  const isNegative = trend !== null && trend < 0

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{cfg.label}</p>
          <p className={`text-3xl font-bold mt-2 leading-none ${cfg.valueColor}`}>{cfg.format(value)}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0 ml-3`}>
          <Icon className={`w-4.5 h-4.5 ${cfg.iconColor}`} strokeWidth={2} />
        </div>
      </div>

      {trend !== null && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            isPositive ? 'bg-emerald-50 text-emerald-700' :
            isNegative ? 'bg-red-50 text-red-600' :
            'bg-slate-100 text-slate-500'
          }`}>
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
          <span className="text-xs text-slate-400">vs prior period</span>
        </div>
      )}
    </div>
  )
}
