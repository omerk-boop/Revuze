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
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Create new card */}
        <button
          onClick={onCreate}
          className="flex flex-col items-center justify-center gap-3 h-44 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 transition-all group"
        >
          <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">New Dashboard</span>
        </button>

        {dashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className="relative flex flex-col h-44 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
            onClick={() => navigate(`/dashboard/${dashboard.id}`)}
          >
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-4 h-4 text-brand-600" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`Delete "${dashboard.name}"?`)) onDelete(dashboard.id)
                  }}
                  className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
                {dashboard.name}
              </h3>
              {dashboard.description && (
                <p className="mt-1 text-xs text-slate-500 line-clamp-2">{dashboard.description}</p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(dashboard.updated_at), 'MMM d, yyyy')}</span>
              <span className="ml-auto">{dashboard.widgets.length} widget{dashboard.widgets.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
