import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Save, ArrowLeft, Edit2, Check, X, ClipboardPaste } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { Dashboard } from '../types/dashboard'
import { getDashboard } from '../services/storage'
import { useDashboards } from '../hooks/useDashboards'
import AIPromptBar from '../components/builder/AIPromptBar'
import FilterPanel from '../components/builder/FilterPanel'
import DashboardGrid from '../components/dashboard/DashboardGrid'
import ImportDashboardModal from '../components/builder/ImportDashboardModal'

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNew = searchParams.get('new') === '1'

  const { updateDashboard } = useDashboards()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saved, setSaved] = useState(!isNew)
  const [dirty, setDirty] = useState(false)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    if (id) {
      const d = getDashboard(id)
      if (d) {
        setDashboard(d)
        setNameInput(d.name)
      } else {
        navigate('/')
      }
    }
  }, [id, navigate])

  const handleGenerated = (partial: Partial<Dashboard>) => {
    setDashboard((prev) => {
      if (!prev) return prev
      const updated: Dashboard = {
        ...prev,
        ...partial,
        id: prev.id,
        created_at: prev.created_at,
        updated_at: new Date().toISOString(),
        widgets: (partial.widgets || []).map((w) => ({
          ...w,
          id: w.id || uuidv4(),
        })),
      }
      return updated
    })
    setDirty(true)
    setSaved(false)
  }

  const handleSave = () => {
    if (!dashboard) return
    updateDashboard(dashboard)
    setSaved(true)
    setDirty(false)
    // Remove ?new param from URL
    navigate(`/dashboard/${dashboard.id}`, { replace: true })
  }

  const handleFilterChange = (filter: Dashboard['filter']) => {
    setDashboard((prev) => (prev ? { ...prev, filter } : prev))
    setDirty(true)
    setSaved(false)
  }

  const handleLayoutChange = (widgets: Dashboard['widgets']) => {
    setDashboard((prev) => (prev ? { ...prev, widgets } : prev))
    setDirty(true)
    setSaved(false)
  }

  const commitName = () => {
    if (!nameInput.trim()) return
    setDashboard((prev) => (prev ? { ...prev, name: nameInput.trim() } : prev))
    setEditingName(false)
    setDirty(true)
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
                className="text-lg font-semibold text-slate-900 border-b-2 border-brand-500 outline-none bg-transparent px-1 min-w-48"
              />
              <button onClick={commitName} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingName(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h2 className="text-lg font-semibold text-slate-900">{dashboard.name}</h2>
              <button
                onClick={() => setEditingName(true)}
                className="p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-slate-100"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {dirty && !saved && (
            <span className="text-xs text-amber-500 font-medium">● Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{dashboard.widgets.length} widget{dashboard.widgets.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <ClipboardPaste className="w-4 h-4" />
            Paste Config
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-[1300px] mx-auto p-6 flex flex-col gap-4">
          {/* AI Prompt */}
          <AIPromptBar
            dashboard={dashboard}
            onGenerated={handleGenerated}
            isNewDashboard={isNew && dashboard.widgets.length === 0}
          />

          {/* Filters */}
          <FilterPanel filter={dashboard.filter} onChange={handleFilterChange} />

          {/* Dashboard Grid */}
          <div className="min-h-64">
            <DashboardGrid
              dashboard={dashboard}
              onLayoutChange={handleLayoutChange}
              editable={true}
            />
          </div>
        </div>
      </div>

      {showImport && (
        <ImportDashboardModal
          onImport={handleGenerated}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
