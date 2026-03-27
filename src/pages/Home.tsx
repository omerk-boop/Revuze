import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Your Dashboards</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
            {dashboards.length}
          </span>
        </div>
        <p className="text-slate-500 text-sm">
          Build custom analytics views powered by AI. Describe what you want to analyze and your dashboard is built instantly.
        </p>
      </div>

      {dashboards.length === 0 && (
        <div className="mb-8 bg-gradient-to-r from-brand-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">Get started with AI</h2>
          </div>
          <p className="text-brand-100 mb-5 max-w-xl">
            Create your first dashboard by describing what you want to analyze. The AI will select the right widgets, configure filters, and build your view instantly.
          </p>
          <button
            onClick={handleCreate}
            className="px-6 py-2.5 bg-white text-brand-700 rounded-lg font-semibold text-sm hover:bg-brand-50 transition-colors"
          >
            Create my first dashboard →
          </button>
        </div>
      )}

      <DashboardList
        dashboards={dashboards}
        onDelete={removeDashboard}
        onCreate={handleCreate}
      />
    </div>
  )
}
