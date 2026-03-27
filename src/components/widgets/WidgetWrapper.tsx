import type { ReactNode } from 'react'
import { Loader2, AlertCircle, GripVertical } from 'lucide-react'
import type { WidgetType } from '../../types/dashboard'

const TYPE_ACCENT: Partial<Record<WidgetType, string>> = {
  kpi_card:               'border-t-brand-500',
  time_series:            'border-t-sky-500',
  brand_reviews_overtime: 'border-t-violet-500',
  topics_table:           'border-t-emerald-500',
  topics_scatter:         'border-t-amber-500',
  products_table:         'border-t-indigo-500',
}

interface WidgetWrapperProps {
  title: string
  type?: WidgetType
  loading?: boolean
  error?: string | null
  children: ReactNode
}

export default function WidgetWrapper({ title, type, loading, error, children }: WidgetWrapperProps) {
  const accent = type ? (TYPE_ACCENT[type] ?? 'border-t-slate-400') : 'border-t-slate-300'

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-widget flex flex-col h-full border-t-2 ${accent} overflow-hidden`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/80 shrink-0">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide truncate">{title}</h3>
        <GripVertical className="w-3.5 h-3.5 text-slate-300 cursor-grab active:cursor-grabbing shrink-0 ml-2" />
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
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-xs text-center text-slate-500">{error}</span>
          </div>
        )}
        {!loading && !error && children}
      </div>
    </div>
  )
}
