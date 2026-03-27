import { useState, useRef, useCallback } from 'react'
import type { KeyboardEvent } from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import type { DashboardFilter } from '../../types/dashboard'

interface FilterPanelProps {
  filter: DashboardFilter
  onChange: (filter: DashboardFilter) => void
}

const RANGE_OPTIONS = [
  { value: 'lastThreeMonths', label: '3M' },
  { value: 'lastSixMonths',   label: '6M' },
  { value: 'lastTwelveMonths',label: '12M' },
]

const RANGE_DATES: Record<string, { start_date: string; end_date: string }> = {
  lastThreeMonths:  { start_date: '2025-12-01', end_date: '2026-02-28' },
  lastSixMonths:    { start_date: '2025-09-01', end_date: '2026-02-28' },
  lastTwelveMonths: { start_date: '2025-03-01', end_date: '2026-02-28' },
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

export default function FilterPanel({ filter, onChange }: FilterPanelProps) {
  const [brandInput, setBrandInput] = useState('')
  const brandInputRef = useRef<HTMLInputElement>(null)

  const activeCount =
    filter.domains.length +
    filter.brand_names.length +
    filter.star_ratings.length

  // ── Date range ──────────────────────────────────────────────────────────────
  const setRange = (value: string) => {
    const dates = RANGE_DATES[value] ?? RANGE_DATES.lastTwelveMonths
    onChange({ ...filter, range: { ...filter.range, range_type: value as DashboardFilter['range']['range_type'], ...dates } })
  }

  // ── Domains ─────────────────────────────────────────────────────────────────
  const toggleDomain = (domain: string) => {
    const domains = filter.domains.includes(domain)
      ? filter.domains.filter((d) => d !== domain)
      : [...filter.domains, domain]
    onChange({ ...filter, domains })
  }

  // ── Brands ──────────────────────────────────────────────────────────────────
  const addBrand = useCallback((raw: string) => {
    const name = raw.trim()
    if (!name || filter.brand_names.includes(name)) { setBrandInput(''); return }
    onChange({ ...filter, brand_names: [...filter.brand_names, name] })
    setBrandInput('')
  }, [filter, onChange])

  const removeBrand = (name: string) =>
    onChange({ ...filter, brand_names: filter.brand_names.filter((b) => b !== name) })

  const handleBrandKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addBrand(brandInput) }
    if (e.key === 'Backspace' && !brandInput && filter.brand_names.length > 0)
      removeBrand(filter.brand_names[filter.brand_names.length - 1])
  }

  // ── Star ratings ────────────────────────────────────────────────────────────
  const toggleStar = (star: number) => {
    const stars = filter.star_ratings.includes(star)
      ? filter.star_ratings.filter((s) => s !== star)
      : [...filter.star_ratings, star]
    onChange({ ...filter, star_ratings: stars })
  }

  // ── Clear all ───────────────────────────────────────────────────────────────
  const clearAll = () =>
    onChange({ ...filter, domains: [], brand_names: [], star_ratings: [] })

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filters</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-brand-600 text-white text-[10px] font-bold leading-none">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Filter rows */}
      <div className="grid grid-cols-[auto_1fr_1fr_auto] divide-x divide-slate-100">

        {/* Date range */}
        <div className="px-4 py-3 flex flex-col gap-2 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Period</p>
          <div className="flex items-center gap-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filter.range.range_type === opt.value
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Retailers */}
        <div className="px-4 py-3 flex flex-col gap-2 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Retailer {filter.domains.length > 0 && <span className="text-brand-600 normal-case font-bold">({filter.domains.length})</span>}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DOMAINS.map(({ value, label }) => {
              const active = filter.domains.includes(value)
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

        {/* Brands */}
        <div className="px-4 py-3 flex flex-col gap-2 min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Brand {filter.brand_names.length > 0 && <span className="text-brand-600 normal-case font-bold">({filter.brand_names.length})</span>}
          </p>
          <div
            className="flex flex-wrap gap-1.5 min-h-[28px] cursor-text"
            onClick={() => brandInputRef.current?.focus()}
          >
            {filter.brand_names.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-600 text-white font-medium"
              >
                {b}
                <button
                  onClick={(e) => { e.stopPropagation(); removeBrand(b) }}
                  className="hover:opacity-70 transition-opacity leading-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={brandInputRef}
              value={brandInput}
              onChange={(e) => setBrandInput(e.target.value)}
              onKeyDown={handleBrandKey}
              onBlur={() => { if (brandInput.trim()) addBrand(brandInput) }}
              placeholder={filter.brand_names.length === 0 ? 'Type brand + Enter…' : '+ add'}
              className="text-xs text-slate-700 placeholder-slate-400 outline-none bg-transparent min-w-[100px] py-0.5"
            />
          </div>
        </div>

        {/* Star rating */}
        <div className="px-4 py-3 flex flex-col gap-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Star Rating</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = filter.star_ratings.includes(star)
              return (
                <button
                  key={star}
                  onClick={() => toggleStar(star)}
                  title={`${star} star${star > 1 ? 's' : ''}`}
                  className={`w-8 h-7 flex items-center justify-center rounded text-sm transition-colors ${
                    active
                      ? 'bg-amber-400 text-white shadow-sm'
                      : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50'
                  }`}
                >
                  {'★'.repeat(star)}
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
