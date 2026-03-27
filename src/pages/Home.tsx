import { useNavigate } from 'react-router-dom'
import { Sparkles, Plus } from 'lucide-react'
import { useDashboards } from '../hooks/useDashboards'
import DashboardList from '../components/dashboard/DashboardList'

export default function Home() {
  const navigate = useNavigate()
  const { dashboards, createDashboard, removeDashboard } = useDashboards()

  const handleCreate = () => {
    const dash = createDashboard({ name: 'New Dashboard', widgets: [] })
    navigate(`/dashboard/${dash.id}?new=1`)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dashboards</h1>
            <p className="text-sm text-slate-500 mt-1">
              Build custom analytics views with AI — describe what you want, get it instantly.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Dashboard
          </button>
        </div>

        {/* Empty-state hero */}
        {dashboards.length === 0 && (
          <div className="mb-8 bg-gradient-to-br from-slate-900 to-brand-900 rounded-2xl p-8 text-white border border-slate-800 shadow-card-hover">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-brand-500/30 rounded-lg flex items-center justify-center border border-brand-400/30">
                <Sparkles className="w-4 h-4 text-brand-300" />
              </div>
              <h2 className="text-lg font-bold">Get started with AI</h2>
            </div>
            <p className="text-slate-300 mb-6 max-w-lg text-sm leading-relaxed">
              Describe the analysis you need in plain language. The AI selects the right widgets,
              configures filters, and builds your dashboard instantly — no setup required.
            </p>
            <button
              onClick={handleCreate}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              Create my first dashboard →
            </button>
          </div>
        )}

        <DashboardList dashboards={dashboards} onDelete={removeDashboard} onCreate={handleCreate} />
      </div>
    </div>
  )
}
