import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Trash2, Clock, Plus } from 'lucide-react'
import { format } from 'date-fns'
import type { Dashboard } from '../../types/dashboard'

interface DashboardListProps {
  dashboards: Dashboard[]
  onDelete: (id: string) => void
  onCreate: () => void
}

export default function DashboardList({ dashboards, onDelete, onCreate }: DashboardListProps) {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Create card */}
      <button
        onClick={onCreate}
        className="flex flex-col items-center justify-center gap-3 h-44 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all group"
      >
        <div className="w-9 h-9 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-105 transition-transform">
          <Plus className="w-4.5 h-4.5" />
        </div>
        <span className="text-sm font-semibold">New Dashboard</span>
      </button>

      {dashboards.map((dashboard) => (
        <div
          key={dashboard.id}
          className="relative flex flex-col h-44 rounded-xl border border-slate-200 bg-white shadow-card hover:shadow-card-hover hover:border-brand-300 transition-all cursor-pointer group"
          onClick={() => navigate(`/dashboard/${dashboard.id}`)}
        >
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-t-xl" />

          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-4 h-4 text-brand-600" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete "${dashboard.name}"?`)) onDelete(dashboard.id)
                }}
                className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800 line-clamp-2 leading-snug tracking-tight">
              {dashboard.name}
            </h3>
            {dashboard.description && (
              <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{dashboard.description}</p>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 rounded-b-xl flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400">{format(new Date(dashboard.updated_at), 'MMM d, yyyy')}</span>
            <span className="ml-auto px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold">
              {dashboard.widgets.length}W
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
