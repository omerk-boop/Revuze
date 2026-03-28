import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Plus, X } from 'lucide-react'
import { useDashboards } from '../hooks/useDashboards'
import DashboardList from '../components/dashboard/DashboardList'

export default function Home() {
  const navigate = useNavigate()
  const { dashboards, createDashboard, removeDashboard, refresh } = useDashboards()
  const [showNameModal, setShowNameModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [nameError, setNameError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Refresh list from localStorage whenever this page is shown
  useEffect(() => { refresh() }, [refresh])

  // Focus input when modal opens
  useEffect(() => { if (showNameModal) setTimeout(() => inputRef.current?.focus(), 50) }, [showNameModal])

  const openModal = () => { setNewName(''); setNameError(''); setShowNameModal(true) }

  const confirmCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) { setNameError('Please enter a name'); return }
    if (dashboards.some((d) => d.name === trimmed)) { setNameError('A dashboard with this name already exists'); return }
    const dash = createDashboard({ name: trimmed, widgets: [] })
    setShowNameModal(false)
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
            onClick={openModal}
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
              onClick={openModal}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
            >
              Create my first dashboard →
            </button>
          </div>
        )}

        <DashboardList dashboards={dashboards} onDelete={removeDashboard} onCreate={openModal} />
      </div>

      {/* Name modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Name your dashboard</h2>
              <button onClick={() => setShowNameModal(false)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNameError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmCreate(); if (e.key === 'Escape') setShowNameModal(false) }}
              placeholder="e.g. Brand Performance Q1"
              className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-900 outline-none transition-colors ${nameError ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-brand-500'}`}
            />
            {nameError && <p className="mt-1.5 text-xs text-red-500">{nameError}</p>}
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setShowNameModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreate}
                className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
