import { LayoutDashboard, LogOut, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface DevHeaderProps {
  onLogout: () => void
}

export default function DevHeader({ onLogout }: DevHeaderProps) {
  const location = useLocation()

  return (
    <header className="h-16 bg-slate-900 flex items-center justify-between px-6 shrink-0 z-10 shadow-lg">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-white font-semibold text-sm tracking-wide">Revuze</span>
          <span className="text-slate-400 text-xs block leading-none">Dashboard Builder</span>
        </div>
      </Link>

      <nav className="flex items-center gap-1">
        <Link
          to="/"
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            location.pathname === '/'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboards
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-1 rounded-full bg-amber-900/40 text-amber-400 border border-amber-800/50">
          Dev Mode
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
          title="Change token"
        >
          <LogOut className="w-4 h-4" />
          Change token
        </button>
      </div>
    </header>
  )
}
