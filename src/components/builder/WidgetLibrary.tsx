import { useState } from 'react'
import {
  MessageSquare, BarChart3, Star, Tag, Package, Building2,
  TrendingUp, TrendingDown, LineChart, ScatterChart, Search,
  GripVertical, Plus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { setDraggingItem } from '../../utils/dragState'
import type { LibraryItem } from '../../utils/dragState'

// ─── Catalogue ────────────────────────────────────────────────────────────────

interface LibraryEntry extends LibraryItem {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  sizeLabel: string
}

const LIBRARY: LibraryEntry[] = [
  // KPI
  { id: 'kpi-sentiment',  category: 'kpi',   type: 'kpi_card', name: 'Sentiment Score',     description: 'Overall customer sentiment index',       config: { metric: 'sentiment' },              defaultW: 3,  defaultH: 2, icon: MessageSquare, iconBg: 'bg-violet-100',  iconColor: 'text-violet-600',  sizeLabel: '3×2' },
  { id: 'kpi-volume',     category: 'kpi',   type: 'kpi_card', name: 'Review Volume',        description: 'Total number of reviews',                config: { metric: 'volume' },                 defaultW: 3,  defaultH: 2, icon: BarChart3,     iconBg: 'bg-brand-100',   iconColor: 'text-brand-600',   sizeLabel: '3×2' },
  { id: 'kpi-rating',     category: 'kpi',   type: 'kpi_card', name: 'Avg Star Rating',      description: 'Average review star rating',             config: { metric: 'reviews_star_rating' },    defaultW: 3,  defaultH: 2, icon: Star,          iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   sizeLabel: '3×2' },
  { id: 'kpi-pdp',        category: 'kpi',   type: 'kpi_card', name: 'PDP Rating',           description: 'Product detail page rating',             config: { metric: 'pdp_star_rating' },        defaultW: 3,  defaultH: 2, icon: Tag,           iconBg: 'bg-orange-100',  iconColor: 'text-orange-600',  sizeLabel: '3×2' },
  { id: 'kpi-products',   category: 'kpi',   type: 'kpi_card', name: 'Products Count',       description: 'Number of products tracked',             config: { metric: 'products' },               defaultW: 3,  defaultH: 2, icon: Package,       iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', sizeLabel: '3×2' },
  { id: 'kpi-brands',     category: 'kpi',   type: 'kpi_card', name: 'Brands Count',         description: 'Number of brands tracked',               config: { metric: 'brands' },                 defaultW: 3,  defaultH: 2, icon: Building2,     iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',  sizeLabel: '3×2' },
  // Charts
  { id: 'chart-ts',       category: 'chart', type: 'time_series',            name: 'Trends Over Time',       description: 'Sentiment, volume & rating weekly trends',  config: { metrics: ['volume', 'sentiment'] },  defaultW: 12, defaultH: 4, icon: TrendingUp,    iconBg: 'bg-sky-100',     iconColor: 'text-sky-600',     sizeLabel: '12×4' },
  { id: 'chart-brands',   category: 'chart', type: 'brand_reviews_overtime', name: 'Brand Reviews Trend',    description: 'Review volume per brand over time',         config: { brands: [] },                       defaultW: 12, defaultH: 5, icon: LineChart,     iconBg: 'bg-violet-100',  iconColor: 'text-violet-600',  sizeLabel: '12×5' },
  { id: 'chart-scatter',  category: 'chart', type: 'topics_scatter',         name: 'Topics Scatter',         description: 'Topics by sentiment vs. volume',            config: { limit: 20 },                        defaultW: 12, defaultH: 5, icon: ScatterChart,  iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   sizeLabel: '12×5' },
  // Tables
  { id: 'table-growing',  category: 'table', type: 'topics_table', name: 'Growing Topics',      description: 'Topics gaining volume & momentum',       config: { mode: 'growing',    limit: 10 },     defaultW: 12, defaultH: 5, icon: TrendingUp,    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', sizeLabel: '12×5' },
  { id: 'table-declining',category: 'table', type: 'topics_table', name: 'Declining Topics',    description: 'Topics losing volume or sentiment',      config: { mode: 'decreasing', limit: 10 },     defaultW: 12, defaultH: 5, icon: TrendingDown,  iconBg: 'bg-red-100',     iconColor: 'text-red-500',     sizeLabel: '12×5' },
  { id: 'table-products', category: 'table', type: 'products_table',         name: 'Products Overview',      description: 'Products with reviews & sentiment data',    config: { size: 20 },                         defaultW: 12, defaultH: 6, icon: Package,       iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600',  sizeLabel: '12×6' },
]

const CATEGORIES = [
  { id: 'kpi',   label: 'KPI Cards' },
  { id: 'chart', label: 'Charts' },
  { id: 'table', label: 'Tables' },
] as const

// ─── Widget card ──────────────────────────────────────────────────────────────

function LibraryCard({
  item,
  onAdd,
  onDragStart,
  locked,
}: {
  item: LibraryEntry
  onAdd?: (item: LibraryItem) => void
  onDragStart?: (item: LibraryItem) => void
  locked?: boolean
}) {
  const Icon = item.icon
  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 bg-white transition-all select-none ${
        locked ? 'opacity-60 cursor-not-allowed' : 'hover:border-brand-200 hover:bg-brand-50/40 cursor-grab active:cursor-grabbing'
      }`}
      draggable={!locked}
      unselectable="on"
      onDragStart={locked ? undefined : (e) => {
        e.dataTransfer.effectAllowed = 'copy'
        e.dataTransfer.setData('text/plain', item.id)
        onDragStart?.(item)
      }}
      onDragEnd={() => setDraggingItem(null)}
    >
      <div className={`w-7 h-7 rounded-md ${item.iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700 leading-tight line-clamp-2" title={item.name}>{item.name}</p>
        <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{item.description}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-slate-300 font-mono">{item.sizeLabel}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd?.(item) }}
          className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-brand-600 hover:bg-brand-100 opacity-0 group-hover:opacity-100 transition-all"
          title="Add to dashboard"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <GripVertical className="w-3.5 h-3.5 text-slate-300" />
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface WidgetLibraryProps {
  onAdd?: (item: LibraryItem) => void
  onDragStart?: (item: LibraryItem) => void
  locked?: boolean
}

export default function WidgetLibrary({ onAdd, onDragStart, locked = false }: WidgetLibraryProps) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? LIBRARY.filter(
        (w) =>
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          w.description.toLowerCase().includes(search.toLowerCase())
      )
    : LIBRARY

  const byCategory = (cat: typeof CATEGORIES[number]['id']) =>
    filtered.filter((w) => w.category === cat)

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 shrink-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Widget Library</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search widgets…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4">
        {CATEGORIES.map(({ id, label }) => {
          const items = byCategory(id)
          if (items.length === 0) return null
          return (
            <div key={id}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">{label}</p>
              <div className="flex flex-col gap-1.5">
                {items.map((item) => (
                  <LibraryCard
                    key={item.id}
                    item={item}
                    onAdd={onAdd}
                    onDragStart={onDragStart}
                    locked={locked}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center pt-4">No widgets match "{search}"</p>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-slate-100 shrink-0">
        {locked ? (
          <p className="text-[10px] text-amber-600 font-semibold">Dashboard is locked — unlock to add widgets.</p>
        ) : (
          <p className="text-[10px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-500">Drag</span> onto the canvas to position,
            or click <span className="font-semibold text-slate-500">+</span> to append below.
          </p>
        )}
      </div>
    </div>
  )
}
