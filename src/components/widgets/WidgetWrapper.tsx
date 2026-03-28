import type { ReactNode } from 'react'
import { Loader2, AlertCircle, GripVertical, Info, X } from 'lucide-react'
import type { WidgetType } from '../../types/dashboard'
import type { Granularity } from '../../utils/aggregateTimeSeries'

const TYPE_ACCENT: Partial<Record<WidgetType, string>> = {
  kpi_card:               'border-t-brand-500',
  time_series:            'border-t-sky-500',
  brand_reviews_overtime: 'border-t-violet-500',
  stacked_bar:            'border-t-teal-500',
  star_rating_bar:        'border-t-amber-500',
  custom_chart:           'border-t-brand-400',
  custom_table:           'border-t-slate-400',
  topics_table:           'border-t-emerald-500',
  topics_scatter:         'border-t-amber-500',
  products_table:         'border-t-indigo-500',
}

const TYPE_DESCRIPTIONS: Partial<Record<WidgetType, string>> = {
  kpi_card:               'Single metric KPI with trend indicator vs the prior period.',
  time_series:            'Weekly trend lines for sentiment, review volume & star rating over time.',
  brand_reviews_overtime: 'Review volume per brand over time. Click a brand in the legend to show/hide it.',
  topics_table:           'Ranked topics table showing volume, sentiment & trend changes. Toggle growing/declining modes.',
  topics_scatter:         'Topics plotted by sentiment (x-axis) vs review volume (y-axis). Highlights high-impact topics.',
  products_table:         'Product catalog with review count, star rating & sentiment score, including period-over-period changes.',
  stacked_bar:            'Weekly review volume stacked by brand — shows each brand\'s share of total volume over time.',
  star_rating_bar:        'Weekly review volume stacked by star rating (1★–5★, red→green) — shows the quality distribution of reviews over time.',
  custom_chart:           'AI-generated chart — the visualization was created dynamically based on your prompt.',
  custom_table:           'AI-generated table — the columns and rows were defined dynamically based on your prompt.',
}

interface WidgetWrapperProps {
  title: string
  type?: WidgetType
  loading?: boolean
  error?: string | null
  onDelete?: () => void
  granularity?: Granularity
  onGranularityChange?: (g: Granularity) => void
  children: ReactNode
}

export default function WidgetWrapper({ title, type, loading, error, onDelete, granularity, onGranularityChange, children }: WidgetWrapperProps) {
  const accent = type ? (TYPE_ACCENT[type] ?? 'border-t-slate-400') : 'border-t-slate-300'
  const description = type ? TYPE_DESCRIPTIONS[type] : undefined

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-widget flex flex-col h-full border-t-2 ${accent} overflow-hidden`}>
      <div className="group flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide truncate flex-1">{title}</h3>

        {/* Granularity toggle — shown for time-series widgets */}
        {onGranularityChange && granularity && (
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-md p-0.5 shrink-0">
            {(['week', 'month', 'quarter'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => onGranularityChange(g)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  granularity === g
                    ? 'bg-white text-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {g === 'week' ? 'W' : g === 'month' ? 'M' : 'Q'}
              </button>
            ))}
          </div>
        )}

        {/* Info tooltip */}
        {description && (
          <div className="relative group/info shrink-0">
            <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-help transition-colors" />
            <div className="absolute right-0 top-full mt-2 w-60 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl
                            opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible
                            transition-all duration-150 z-50 pointer-events-none leading-relaxed">
              <div className="absolute -top-1 right-1.5 w-2 h-2 bg-slate-800 rotate-45 rounded-sm" />
              {description}
            </div>
          </div>
        )}

        {onDelete && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 text-slate-300 hover:text-red-500 shrink-0"
            title="Remove widget"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
      </div>

      <div className="flex-1 min-h-0 p-4 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-b-xl z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
              <span className="text-xs text-slate-400">Loading…</span>
            </div>
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-xs text-center text-slate-500">{error}</span>
          </div>
        )}
        {!loading && !error && children}
      </div>
    </div>
  )
}
