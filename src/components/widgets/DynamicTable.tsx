import { useMemo } from 'react'

export interface ColumnSpec {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  // optional: 'badge-sentiment' renders a coloured pill based on numeric value
  render?: 'badge-sentiment' | 'badge-volume-trend' | 'star'
}

export interface DynamicTableSpec {
  columns: ColumnSpec[]
  rows: Record<string, unknown>[]
}

interface DynamicTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  transformCode: string
}

function SentimentBadge({ value }: { value: number }) {
  const rounded = Math.round(value)
  const cls = rounded >= 80 ? 'bg-emerald-100 text-emerald-700'
    : rounded >= 60 ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-600'
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{rounded}%</span>
}

function TrendBadge({ value }: { value: number }) {
  const rounded = parseFloat(Number(value).toFixed(1))
  const cls = rounded > 0 ? 'text-emerald-600' : rounded < 0 ? 'text-red-500' : 'text-slate-400'
  return <span className={`text-xs font-medium ${cls}`}>{rounded > 0 ? '+' : ''}{rounded}%</span>
}

function StarDisplay({ value }: { value: number }) {
  return <span className="text-xs font-semibold text-amber-500">{'★'.repeat(Math.round(value))} {Number(value).toFixed(1)}</span>
}

function CellContent({ value, render }: { value: unknown; render?: ColumnSpec['render'] }) {
  if (render === 'badge-sentiment') return <SentimentBadge value={Number(value)} />
  if (render === 'badge-volume-trend') return <TrendBadge value={Number(value)} />
  if (render === 'star') return <StarDisplay value={Number(value)} />
  if (value === null || value === undefined) return <span className="text-slate-300">—</span>
  return <>{String(value)}</>
}

export default function DynamicTable({ data, transformCode }: DynamicTableProps) {
  const spec = useMemo<DynamicTableSpec | null>(() => {
    const requireField = (value: unknown, fieldPath: string): NonNullable<typeof value> => {
      if (value === null || value === undefined) {
        throw new Error(`Required field "${fieldPath}" is missing from the API response. This data may not be available from the selected endpoint.`)
      }
      return value
    }
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('data', 'helpers', transformCode)
      const result = fn(data, { requireField })
      if (!result || !Array.isArray(result.columns) || !Array.isArray(result.rows)) {
        throw new Error('Transform must return { columns: [{key, label}], rows: [...] }')
      }
      if (result.rows.length === 0) {
        throw new Error('No data returned — the API response may not contain the requested fields for this endpoint.')
      }
      return result as DynamicTableSpec
    } catch (e) {
      throw new Error(`Table transform error: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [data, transformCode])

  if (!spec || spec.rows.length === 0) {
    return <div className="flex items-center justify-center h-full text-xs text-slate-400">No data</div>
  }

  const alignClass = (a?: ColumnSpec['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b border-slate-100">
            {spec.columns.map((col) => (
              <th
                key={col.key}
                className={`py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap ${alignClass(col.align)}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spec.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
            >
              {spec.columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-2 px-3 text-xs text-slate-700 ${alignClass(col.align)}`}
                >
                  <CellContent value={row[col.key]} render={col.render} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
