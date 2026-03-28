import { useState, useRef, useEffect } from 'react'
import { X, SlidersHorizontal, ChevronDown, Loader2, Search } from 'lucide-react'
import type { DashboardFilter } from '../../types/dashboard'
import type { GroupOption } from '../../hooks/useCatalogOptions'

interface FilterPanelProps {
  filter: DashboardFilter
  onChange: (filter: DashboardFilter) => void
  availableBrands?: string[]
  brandsLoading?: boolean
  availableDepartments?: string[]
  availableGroups?: GroupOption[]
  catalogLoading?: boolean
}

const RANGE_OPTIONS = [
  { value: 'lastThreeMonths',       label: '3M' },
  { value: 'lastSixMonths',         label: '6M' },
  { value: 'lastTwelveMonths',      label: '1Y' },
  { value: 'lastTwentyFourMonths',  label: '2Y' },
  { value: 'lastThirtySixMonths',   label: '3Y' },
]

const RANGE_DATES: Record<string, { start_date: string; end_date: string }> = {
  lastThreeMonths:      { start_date: '2025-12-01', end_date: '2026-02-28' },
  lastSixMonths:        { start_date: '2025-09-01', end_date: '2026-02-28' },
  lastTwelveMonths:     { start_date: '2025-03-01', end_date: '2026-02-28' },
  lastTwentyFourMonths: { start_date: '2024-03-01', end_date: '2026-02-28' },
  lastThirtySixMonths:  { start_date: '2023-03-01', end_date: '2026-02-28' },
}

const DOMAINS = [
  { value: 'www.amazon.com',    label: 'Amazon US' },
  { value: 'www.amazon.co.uk', label: 'Amazon UK' },
  { value: 'www.walmart.com',  label: 'Walmart' },
  { value: 'www.target.com',   label: 'Target' },
  { value: 'www.babylist.com', label: 'Babylist' },
  { value: 'www.kohls.com',    label: "Kohl's" },
  { value: 'buybuybaby.com',   label: 'buybuy Baby' },
  { value: 'www.macys.com',    label: "Macy's" },
  { value: 'www.nordstrom.com',label: 'Nordstrom' },
]

// ─── Reusable searchable multi-select dropdown ────────────────────────────────

function MultiSelectFilter({
  label,
  selected,
  options,
  loading,
  placeholder,
  onToggle,
}: {
  label: string
  selected: string[]
  options: { value: string; label: string }[]
  loading?: boolean
  placeholder?: string
  onToggle: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div ref={containerRef} className="flex flex-col gap-2 min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
        {label}
        {selected.length > 0 && (
          <span className="text-brand-600 normal-case font-bold ml-1">({selected.length})</span>
        )}
      </p>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((v) => {
            const opt = options.find((o) => o.value === v)
            return (
              <span key={v} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-600 text-white font-medium">
                {opt?.label ?? v}
                <button onClick={() => onToggle(v)} className="hover:opacity-70 transition-opacity">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Input trigger */}
      <div className="relative">
        <div
          className="flex items-center gap-1.5 w-full px-2.5 py-1.5 rounded-md border border-slate-200 bg-white cursor-text text-xs hover:border-brand-400 transition-colors"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0) }}
        >
          <Search className="w-3 h-3 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={loading ? 'Loading…' : (placeholder ?? `Search…`)}
            className="flex-1 outline-none bg-transparent text-slate-700 placeholder-slate-400 min-w-0"
            disabled={loading}
          />
          {loading
            ? <Loader2 className="w-3 h-3 text-slate-400 animate-spin shrink-0" />
            : <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          }
        </div>

        {open && !loading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-slate-400 text-center">
                {search ? `No results for "${search}"` : 'None available'}
              </p>
            ) : (
              filtered.map((opt) => {
                const active = selected.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onMouseDown={(e) => { e.preventDefault(); onToggle(opt.value) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-slate-50 ${active ? 'text-brand-700 font-semibold' : 'text-slate-700'}`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 text-[9px] transition-colors ${
                      active ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'
                    }`}>
                      {active && '✓'}
                    </span>
                    {opt.label}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Brand dropdown (kept separate for its own search-against-API behaviour) ──

function BrandFilter({
  selected,
  available,
  loading,
  onToggle,
}: {
  selected: string[]
  available: string[]
  loading: boolean
  onToggle: (brand: string) => void
}) {
  return (
    <MultiSelectFilter
      label="Brand"
      selected={selected}
      options={available.map((b) => ({ value: b, label: b }))}
      loading={loading}
      placeholder={selected.length === 0 ? 'Search brands…' : 'Filter brands…'}
      onToggle={onToggle}
    />
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function FilterPanel({
  filter,
  onChange,
  availableBrands = [],
  brandsLoading = false,
  availableDepartments = [],
  availableGroups = [],
  catalogLoading = false,
}: FilterPanelProps) {
  const domains      = filter.domains      ?? []
  const brand_names  = filter.brand_names  ?? []
  const star_ratings = filter.star_ratings ?? []
  const departments  = filter.departments  ?? []
  const groups       = filter.groups       ?? []
  const range        = filter.range ?? { range_type: 'lastTwelveMonths', start_date: '2025-03-01', end_date: '2026-02-28' }

  const activeCount = domains.length + brand_names.length + star_ratings.length + departments.length + groups.length

  const setRange = (value: string) => {
    const dates = RANGE_DATES[value] ?? RANGE_DATES.lastTwelveMonths
    onChange({ ...filter, range: { ...range, range_type: value as DashboardFilter['range']['range_type'], ...dates } })
  }

  const toggleDomain     = (v: string) => onChange({ ...filter, domains: toggle(domains, v) })
  const toggleBrand      = (v: string) => onChange({ ...filter, brand_names: toggle(brand_names, v) })
  const toggleStar       = (v: number) => onChange({ ...filter, star_ratings: toggle(star_ratings, v) })

  // When departments change, clear groups (stale sub-category selections become invalid)
  const toggleDepartment = (v: string) => {
    const next = toggle(departments, v)
    onChange({ ...filter, departments: next, groups: [] })
  }
  const toggleGroup = (v: string) => onChange({ ...filter, groups: toggle(groups, v) })

  const clearAll = () => onChange({ ...filter, domains: [], brand_names: [], star_ratings: [], departments: [], groups: [] })

  const groupOptions = (Array.isArray(availableGroups) ? availableGroups : []).map((g) => ({ value: g.group_tag, label: g.group_name }))
  const showSegmentRow = availableDepartments.length > 0 || catalogLoading

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-visible">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filters</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-brand-600 text-white text-[10px] font-bold leading-none">{activeCount}</span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Row 1: Period | Retailers | Brands | Stars */}
      <div className="grid grid-cols-[auto_1fr_1fr_auto] divide-x divide-slate-100">

        <div className="px-4 py-3 flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Period</p>
          <div className="flex items-center gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  range.range_type === opt.value
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 flex flex-col gap-2 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Retailer{domains.length > 0 && <span className="text-brand-600 normal-case font-bold ml-1">({domains.length})</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DOMAINS.map(({ value, label }) => {
              const active = domains.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleDomain(value)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                    active
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'border-slate-200 text-slate-500 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-4 py-3 relative">
          <BrandFilter
            selected={brand_names}
            available={availableBrands}
            loading={brandsLoading}
            onToggle={toggleBrand}
          />
        </div>

        <div className="px-4 py-3 flex flex-col gap-2 shrink-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Stars</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star_ratings.includes(star)
              return (
                <button
                  key={star}
                  onClick={() => toggleStar(star)}
                  title={`${star} star${star > 1 ? 's' : ''}`}
                  className={`w-9 h-8 flex flex-col items-center justify-center rounded-md border text-center transition-colors leading-none ${
                    active
                      ? 'bg-amber-400 border-amber-400 text-white shadow-sm'
                      : 'border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                >
                  <span className="text-[11px] leading-none">★</span>
                  <span className="text-[9px] font-bold leading-none mt-0.5">{star}</span>
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* Row 2: Category | Sub-category (only when catalog data is available) */}
      {showSegmentRow && (
        <div className="border-t border-slate-100 grid grid-cols-2 divide-x divide-slate-100">

          <div className="px-4 py-3 relative">
            <MultiSelectFilter
              label="Category"
              selected={departments}
              options={availableDepartments.map((d) => ({ value: d, label: d }))}
              loading={catalogLoading && availableDepartments.length === 0}
              placeholder="Search categories…"
              onToggle={toggleDepartment}
            />
          </div>

          <div className="px-4 py-3 relative">
            <MultiSelectFilter
              label="Sub-category"
              selected={groups}
              options={groupOptions}
              loading={catalogLoading}
              placeholder={departments.length > 0 ? 'Search sub-categories…' : 'Select a category first…'}
              onToggle={toggleGroup}
            />
          </div>

        </div>
      )}

    </div>
  )
}

// ─── Util ──────────────────────────────────────────────────────────────────────

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item]
}
