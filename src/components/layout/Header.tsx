import { useAuth0 } from '@auth0/auth0-react'
import { LayoutDashboard, LogOut, User, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { user, logout } = useAuth0()
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
        <div className="flex items-center gap-2">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="text-sm text-slate-300">{user?.name || user?.email}</span>
        </div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
