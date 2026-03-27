import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { LayoutDashboard, LogOut, ChevronDown, KeyRound } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import APIKeyModal from '../settings/APIKeyModal'
import { getApiKey } from '../../services/apiKey'

export default function Header() {
  const { user, logout } = useAuth0()
  const location = useLocation()
  const [showKeyModal, setShowKeyModal] = useState(false)
  const hasKey = !!getApiKey()

  return (
    <>
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 bg-brand-600 rounded-md flex items-center justify-center shadow-sm">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Revuze</span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <span className="text-slate-400 text-xs font-medium tracking-wide">Analytics Studio</span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        <Link
          to="/"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            location.pathname === '/'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Dashboards
        </Link>
      </nav>

      {/* User */}
      <div className="flex items-center gap-2">
        {/* API Key button */}
        <button
          onClick={() => setShowKeyModal(true)}
          className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={hasKey ? 'Anthropic API key set — click to manage' : 'Set Anthropic API key for AI features'}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-emerald-400' : 'bg-red-500'}`} />
        </button>
        <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-md hover:bg-slate-800 transition-colors cursor-default">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full ring-1 ring-slate-600" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="text-xs text-slate-300 font-medium max-w-32 truncate">
            {user?.name || user?.email}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-500" />
        </div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>

    {showKeyModal && <APIKeyModal onClose={() => setShowKeyModal(false)} />}
    </>
  )
}
