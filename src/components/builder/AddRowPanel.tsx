import { useState } from 'react'
import { PlusCircle, ChevronUp, Check } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { Widget, WidgetType, KPIMetric } from '../../types/dashboard'

// ─── Layout presets ────────────────────────────────────────────────────────────

interface LayoutPreset {
  id: string
  label: string
  cols: number[] // widths in 12-col grid units
}

const LAYOUTS: LayoutPreset[] = [
  { id: 'full',         label: 'Full width',    cols: [12] },
  { id: 'half',         label: 'Half / Half',   cols: [6, 6] },
  { id: 'thirds',       label: '⅓  ⅓  ⅓',      cols: [4, 4, 4] },
  { id: 'wide-narrow',  label: 'Wide + Narrow', cols: [8, 4] },
  { id: 'narrow-wide',  label: 'Narrow + Wide', cols: [4, 8] },
]

// ─── Widget type catalogue ─────────────────────────────────────────────────────

interface WidgetMeta {
  type: WidgetType
  label: string
  defaultH: number
}

const WIDGET_META: WidgetMeta[] = [
  { type: 'kpi_card',               label: 'KPI Card',                defaultH: 2 },
  { type: 'time_series',            label: 'Time Series Chart',        defaultH: 4 },
  { type: 'brand_reviews_overtime', label: 'Brand Reviews Over Time',  defaultH: 5 },
  { type: 'topics_table',           label: 'Topics Table',             defaultH: 5 },
  { type: 'topics_scatter',         label: 'Topics Scatter',           defaultH: 5 },
  { type: 'products_table',         label: 'Products Table',           defaultH: 5 },
]

const KPI_METRICS: { value: KPIMetric; label: string }[] = [
  { value: 'sentiment',          label: 'Sentiment' },
  { value: 'volume',             label: 'Review Volume' },
  { value: 'reviews_star_rating',label: 'Star Rating' },
  { value: 'pdp_star_rating',    label: 'PDP Star Rating' },
  { value: 'products',           label: 'Products' },
  { value: 'brands',             label: 'Brands' },
]

// ─── Slot state ────────────────────────────────────────────────────────────────

interface SlotState {
  type: WidgetType
  kpiMetric: KPIMetric
  topicsMode: 'growing' | 'decreasing' | 'all'
  title: string
}

function defaultSlot(): SlotState {
  return { type: 'kpi_card', kpiMetric: 'sentiment', topicsMode: 'growing', title: '' }
}

function autoTitle(slot: SlotState): string {
  if (slot.title.trim()) return slot.title.trim()
  switch (slot.type) {
    case 'kpi_card':               return KPI_METRICS.find(m => m.value === slot.kpiMetric)?.label ?? 'KPI'
    case 'time_series':            return 'Trends Over Time'
    case 'brand_reviews_overtime': return 'Reviews by Brand'
    case 'topics_table':           return slot.topicsMode === 'growing' ? 'Growing Topics' : slot.topicsMode === 'decreasing' ? 'Declining Topics' : 'All Topics'
    case 'topics_scatter':         return 'Topics Scatter'
    case 'products_table':         return 'Products Overview'
    default:                       return 'Widget'
  }
}

function buildConfig(slot: SlotState) {
  switch (slot.type) {
    case 'kpi_card':               return { metric: slot.kpiMetric }
    case 'time_series':            return { metrics: ['volume', 'sentiment', 'reviews_star_rating'] }
    case 'brand_reviews_overtime': return { brands: [] }
    case 'topics_table':           return { mode: slot.topicsMode, limit: 10 }
    case 'topics_scatter':         return { limit: 20 }
    case 'products_table':         return { size: 20 }
    default:                       return {}
  }
}

// ─── Layout icon ───────────────────────────────────────────────────────────────

function LayoutIcon({ cols }: { cols: number[] }) {
  return (
    <div className="flex gap-0.5 w-10 h-6">
      {cols.map((c, i) => (
        <div
          key={i}
          className="rounded-sm bg-current"
          style={{ flex: c }}
        />
      ))}
    </div>
  )
}

// ─── Slot configurator ─────────────────────────────────────────────────────────

function SlotConfigurator({ slot, onChange }: { slot: SlotState; onChange: (s: SlotState) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <select
        value={slot.type}
        onChange={(e) => onChange({ ...slot, type: e.target.value as WidgetType })}
        className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
      >
        {WIDGET_META.map((m) => (
          <option key={m.type} value={m.type}>{m.label}</option>
        ))}
      </select>

      {slot.type === 'kpi_card' && (
        <select
          value={slot.kpiMetric}
          onChange={(e) => onChange({ ...slot, kpiMetric: e.target.value as KPIMetric })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
        >
          {KPI_METRICS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      )}

      {slot.type === 'topics_table' && (
        <select
          value={slot.topicsMode}
          onChange={(e) => onChange({ ...slot, topicsMode: e.target.value as SlotState['topicsMode'] })}
          className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-brand-500"
        >
          <option value="growing">Growing Topics</option>
          <option value="decreasing">Declining Topics</option>
          <option value="all">All Topics</option>
        </select>
      )}

      <input
        type="text"
        value={slot.title}
        onChange={(e) => onChange({ ...slot, title: e.target.value })}
        placeholder={`Title: ${autoTitle(slot)}`}
        className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-500 placeholder-slate-400 focus:outline-none focus:border-brand-500"
      />
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface AddRowPanelProps {
  currentMaxY: number
  onAddRow: (widgets: Widget[]) => void
}

export default function AddRowPanel({ currentMaxY, onAddRow }: AddRowPanelProps) {
  const [open, setOpen] = useState(false)
  const [layout, setLayout] = useState<LayoutPreset>(LAYOUTS[0])
  const [slots, setSlots] = useState<SlotState[]>([defaultSlot()])

  const handleLayoutChange = (preset: LayoutPreset) => {
    setLayout(preset)
    // Resize slots array to match column count
    setSlots((prev) => {
      const next = [...prev]
      while (next.length < preset.cols.length) next.push(defaultSlot())
      return next.slice(0, preset.cols.length)
    })
  }

  const handleAdd = () => {
    const rowH = Math.max(...slots.map((s) => WIDGET_META.find((m) => m.type === s.type)?.defaultH ?? 4))
    let xCursor = 0
    const widgets: Widget[] = slots.map((slot, i) => {
      const w = layout.cols[i]
      const x = xCursor
      xCursor += w
      return {
        id: uuidv4(),
        type: slot.type,
        title: autoTitle(slot),
        config: buildConfig(slot),
        layout: { x, y: currentMaxY, w, h: rowH },
      }
    })
    onAddRow(widgets)
    setOpen(false)
    setSlots([defaultSlot()])
    setLayout(LAYOUTS[0])
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-brand-400 hover:text-brand-600 transition-colors text-sm font-medium"
      >
        <PlusCircle className="w-4 h-4" />
        Add Row
      </button>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <span className="text-sm font-semibold text-slate-700">Add Row</span>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors">
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Layout picker */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Layout</p>
          <div className="flex flex-wrap gap-2">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => handleLayoutChange(l)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  layout.id === l.id
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={layout.id === l.id ? 'text-brand-600' : 'text-slate-400'}>
                  <LayoutIcon cols={l.cols} />
                </span>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column configurators */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
            {layout.cols.length > 1 ? 'Columns' : 'Widget'}
          </p>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: layout.cols.map((c) => `${c}fr`).join(' ') }}
          >
            {slots.map((slot, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                {layout.cols.length > 1 && (
                  <p className="text-xs text-slate-400 mb-2">Column {i + 1}</p>
                )}
                <SlotConfigurator
                  slot={slot}
                  onChange={(updated) => setSlots((prev) => prev.map((s, j) => j === i ? updated : s))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Add button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Check className="w-4 h-4" />
            Add to Dashboard
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
