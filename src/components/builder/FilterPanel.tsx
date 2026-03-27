import { useState } from 'react'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import type { DashboardFilter } from '../../types/dashboard'

interface FilterPanelProps {
  filter: DashboardFilter
  onChange: (filter: DashboardFilter) => void
}

const RANGE_OPTIONS = [
  { value: 'lastThreeMonths', label: 'Last 3 months' },
  { value: 'lastSixMonths', label: 'Last 6 months' },
  { value: 'lastTwelveMonths', label: 'Last 12 months' },
]

const DOMAINS = [
  'www.amazon.com', 'www.walmart.com', 'www.target.com', 'www.babylist.com',
  'www.kohls.com', 'buybuybaby.com', 'www.macys.com', 'www.nordstrom.com',
  'www.safety1st.com', 'www.maxicosi.com', 'www.amazon.co.uk',
]

const DOMAIN_LABELS: Record<string, string> = {
  'www.amazon.com': 'Amazon US',
  'www.amazon.co.uk': 'Amazon UK',
  'www.walmart.com': 'Walmart',
  'www.target.com': 'Target',
  'www.babylist.com': 'Babylist',
  'www.kohls.com': "Kohl's",
  'buybuybaby.com': 'buybuy Baby',
  'www.macys.com': "Macy's",
  'www.nordstrom.com': 'Nordstrom',
  'www.safety1st.com': 'Safety 1st',
  'www.maxicosi.com': 'Maxi-Cosi',
}

export default function FilterPanel({ filter, onChange }: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const toggleDomain = (domain: string) => {
    const domains = filter.domains.includes(domain)
      ? filter.domains.filter((d) => d !== domain)
      : [...filter.domains, domain]
    onChange({ ...filter, domains })
  }

  const setRangeType = (value: string) => {
    const rangeMap: Record<string, { start_date: string; end_date: string }> = {
      lastThreeMonths: { start_date: '2025-12-01', end_date: '2026-02-28' },
      lastSixMonths: { start_date: '2025-09-01', end_date: '2026-02-28' },
      lastTwelveMonths: { start_date: '2025-03-01', end_date: '2026-02-28' },
    }
    const dates = rangeMap[value] || rangeMap.lastTwelveMonths
    onChange({
      ...filter,
      range: { ...filter.range, range_type: value as DashboardFilter['range']['range_type'], ...dates },
    })
  }

  const activeFilterCount =
    filter.domains.length +
    filter.departments.length +
    filter.countries.length

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Global Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              {activeFilterCount} active
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRangeType(opt.value)}
                    className={`flex-1 text-xs py-1.5 px-2 rounded-md border transition-colors ${
                      filter.range.range_type === opt.value
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Retailers */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Retailers {filter.domains.length > 0 && <span className="text-brand-600">({filter.domains.length})</span>}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => toggleDomain(domain)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      filter.domains.includes(domain)
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'
                    }`}
                  >
                    {DOMAIN_LABELS[domain] || domain}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
