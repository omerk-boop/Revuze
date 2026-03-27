import type { ReactNode } from 'react'
import { Loader2, AlertCircle, GripVertical } from 'lucide-react'

interface WidgetWrapperProps {
  title: string
  loading?: boolean
  error?: string | null
  children: ReactNode
  className?: string
}

export default function WidgetWrapper({
  title,
  loading,
  error,
  children,
  className = '',
}: WidgetWrapperProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <h3 className="text-sm font-semibold text-slate-700 truncate">{title}</h3>
        <GripVertical className="w-4 h-4 text-slate-300 cursor-grab active:cursor-grabbing shrink-0" />
      </div>
      <div className="flex-1 min-h-0 p-4 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-b-xl z-10">
            <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-xs text-center">{error}</span>
          </div>
        )}
        {!loading && !error && children}
      </div>
    </div>
  )
}
