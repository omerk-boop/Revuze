import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Save, ArrowLeft, Edit2, Check, X, ClipboardPaste, LayoutGrid, ChevronLeft, Lock, Unlock } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { Dashboard, Widget } from '../types/dashboard'
import { getDashboard } from '../services/storage'
import { useDashboards } from '../hooks/useDashboards'
import { setDraggingItem } from '../utils/dragState'
import type { LibraryItem } from '../utils/dragState'
import AIPromptBar from '../components/builder/AIPromptBar'
import FilterPanel from '../components/builder/FilterPanel'
import DashboardGrid from '../components/dashboard/DashboardGrid'
import ImportDashboardModal from '../components/builder/ImportDashboardModal'
import AddRowPanel from '../components/builder/AddRowPanel'
import WidgetLibrary from '../components/builder/WidgetLibrary'
import { useBrands } from '../hooks/useBrands'

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
  const [showLibrary, setShowLibrary] = useState(true)
  const [locked, setLocked] = useState(false)

  const { brands: availableBrands, loading: brandsLoading } = useBrands(
    dashboard?.filter.range ?? { start_date: '2025-03-01', end_date: '2026-02-28', range_type: 'lastTwelveMonths' }
  )

  useEffect(() => {
    if (id) {
      const d = getDashboard(id)
      if (d) { setDashboard(d); setNameInput(d.name) }
      else navigate('/')
    }
  }, [id, navigate])

  // ── Widget mutation helpers ────────────────────────────────────────────────

  const appendWidgets = (newWidgets: Widget[]) => {
    setDashboard((prev) => {
      if (!prev) return prev
      const maxY = prev.widgets.reduce((m, w) => Math.max(m, w.layout.y + w.layout.h), 0)
      const shifted = newWidgets.map((w) => ({ ...w, layout: { ...w.layout, y: w.layout.y + maxY } }))
      return { ...prev, widgets: [...prev.widgets, ...shifted], updated_at: new Date().toISOString() }
    })
    setDirty(true); setSaved(false)
  }

  const handleGenerated = (partial: Partial<Dashboard>, _prompt?: string, mode: 'replace' | 'append' = 'replace') => {
    setDashboard((prev) => {
      if (!prev) return prev
      const newWidgets = (partial.widgets || []).map((w) => ({ ...w, id: w.id || uuidv4() }))
      let widgets: Widget[]
      if (mode === 'append' && prev.widgets.length > 0) {
        const maxY = prev.widgets.reduce((m, w) => Math.max(m, w.layout.y + w.layout.h), 0)
        widgets = [...prev.widgets, ...newWidgets.map((w) => ({ ...w, layout: { ...w.layout, y: w.layout.y + maxY } }))]
      } else {
        widgets = newWidgets
      }
      return {
        ...prev,
        ...(mode === 'replace' ? partial : {}),
        id: prev.id,
        created_at: prev.created_at,
        updated_at: new Date().toISOString(),
        widgets,
      }
    })
    setDirty(true); setSaved(false)
  }

  const handleLibraryAdd = (item: LibraryItem) => {
    appendWidgets([{
      id: uuidv4(),
      type: item.type,
      title: item.name,
      config: item.config,
      layout: { x: 0, y: 0, w: item.defaultW, h: item.defaultH },
    }])
  }

  const handleWidgetDrop = (item: LibraryItem, x: number, y: number) => {
    setDashboard((prev) => {
      if (!prev) return prev
      const widget: Widget = {
        id: uuidv4(),
        type: item.type,
        title: item.name,
        config: item.config,
        layout: { x, y, w: item.defaultW, h: item.defaultH },
      }
      return { ...prev, widgets: [...prev.widgets, widget], updated_at: new Date().toISOString() }
    })
    setDirty(true); setSaved(false)
  }

  const handleAddRow = (widgets: Widget[]) => {
    setDashboard((prev) => {
      if (!prev) return prev
      return { ...prev, widgets: [...prev.widgets, ...widgets], updated_at: new Date().toISOString() }
    })
    setDirty(true); setSaved(false)
  }

  const handleSave = () => {
    if (!dashboard) return
    updateDashboard(dashboard)
    setSaved(true); setDirty(false)
    navigate(`/dashboard/${dashboard.id}`, { replace: true })
  }

  const handleFilterChange = (filter: Dashboard['filter']) => {
    setDashboard((prev) => (prev ? { ...prev, filter } : prev))
    setDirty(true); setSaved(false)
  }

  const handleLayoutChange = (widgets: Widget[]) => {
    setDashboard((prev) => (prev ? { ...prev, widgets } : prev))
    setDirty(true); setSaved(false)
  }

  const commitName = () => {
    if (!nameInput.trim()) return
    setDashboard((prev) => (prev ? { ...prev, name: nameInput.trim() } : prev))
    setEditingName(false); setDirty(true)
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const maxY = dashboard.widgets.reduce((m, w) => Math.max(m, w.layout.y + w.layout.h), 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 shrink-0 shadow-sm z-10">
        <button onClick={() => navigate('/')} className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-200" />

        {/* Library toggle */}
        <button
          onClick={() => setShowLibrary((v) => !v)}
          title="Toggle widget library"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            showLibrary
              ? 'bg-brand-600 text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Library
        </button>

        <div className="w-px h-5 bg-slate-200" />

        {/* Dashboard name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false) }}
                className="text-sm font-bold text-slate-900 border-b-2 border-brand-500 outline-none bg-transparent px-1 min-w-48"
              />
              <button onClick={commitName} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={() => setEditingName(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-md"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate tracking-tight">{dashboard.name}</h2>
              <button onClick={() => setEditingName(true)} className="p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-slate-100 shrink-0">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
          {dirty && !saved && (
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">Unsaved</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium">{dashboard.widgets.length}w</span>

          {/* Lock toggle */}
          <button
            onClick={() => setLocked((v) => !v)}
            title={locked ? 'Unlock dashboard (enable editing)' : 'Lock dashboard (prevent accidental edits)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              locked
                ? 'bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {locked ? 'Locked' : 'Lock'}
          </button>

          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Paste Config
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>

      {/* ── Body (sidebar + canvas) ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Widget Library sidebar */}
        <div className={`shrink-0 flex flex-col transition-all duration-200 ease-in-out overflow-hidden ${showLibrary ? 'w-64' : 'w-0'}`}>
          {showLibrary && (
            <WidgetLibrary
              onAdd={locked ? undefined : handleLibraryAdd}
              onDragStart={locked ? undefined : (item) => setDraggingItem(item)}
              locked={locked}
            />
          )}
        </div>

        {/* Collapse tab when sidebar is open */}
        {showLibrary && (
          <button
            onClick={() => setShowLibrary(false)}
            className="w-4 bg-slate-200 hover:bg-slate-300 border-r border-slate-300 flex items-center justify-center shrink-0 transition-colors group"
            title="Collapse library"
          >
            <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-slate-700" />
          </button>
        )}

        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto bg-slate-100 min-w-0">
          <div className="p-5 flex flex-col gap-4">

            {/* AI Prompt */}
            <AIPromptBar
              dashboard={dashboard}
              onGenerated={(d, p, mode) => handleGenerated(d, p, mode)}
              isNewDashboard={isNew && dashboard.widgets.length === 0}
            />

            {/* Filters */}
            <FilterPanel
              filter={dashboard.filter}
              onChange={handleFilterChange}
              availableBrands={availableBrands}
              brandsLoading={brandsLoading}
            />

            {/* Grid canvas */}
            <DashboardGrid
              dashboard={dashboard}
              onLayoutChange={handleLayoutChange}
              onWidgetDrop={locked ? undefined : handleWidgetDrop}
              editable={!locked}
            />

            {/* Row builder — hidden when locked */}
            {!locked && <AddRowPanel currentMaxY={maxY} onAddRow={handleAddRow} />}

          </div>
        </div>
      </div>

      {showImport && (
        <ImportDashboardModal
          hasExistingWidgets={dashboard.widgets.length > 0}
          onImport={(config, mode) => handleGenerated(config, undefined, mode)}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
