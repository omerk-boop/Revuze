/**
 * Fetches data for every widget in a dashboard and downloads an .xlsx file.
 * Each widget becomes one sheet; an Overview sheet is prepended with totals.
 * The file can be opened directly in Google Sheets (File → Import, or drag to Drive).
 */
import writeXlsxFile from 'write-excel-file/browser'
import { format, parseISO, startOfMonth, endOfMonth, addMonths, isAfter } from 'date-fns'
import type { Dashboard, Widget, KPICardConfig, TimeSeriesConfig, BrandReviewsOvertimeConfig, StackedBarConfig, CustomChartConfig, CustomTableConfig, ProductsTableConfig } from '../types/dashboard'
import type { ApiRequestBody } from './api'
import {
  fetchStatisticsTotals,
  fetchKeyMetricsOvertime,
  fetchTopicsTrends,
  fetchProducts,
} from './api'
import type { StatisticsTotals, TimeSeriesResponse, TopicsTrendsResponse, ProductsResponse, BrandTimeSeriesData, StarRatingTimeSeriesData } from '../types/api'

type Row = Record<string, string | number | null>

// ─── Per-widget data → flat rows ─────────────────────────────────────────────

function kpiRows(data: StatisticsTotals, cfg: KPICardConfig): Row[] {
  const metricMap: Record<string, { label: string; value: number; trend: number }> = {
    sentiment:           { label: 'Sentiment (%)',        value: Math.round(data.sentiment * 100),            trend: data.sentiment_trend },
    volume:              { label: 'Total Reviews',         value: data.volume,                                trend: data.volume_trend },
    reviews_star_rating: { label: 'Avg Star Rating',       value: Math.round(data.reviews_star_rating * 100) / 100, trend: data.reviews_star_rating_trend },
    pdp_star_rating:     { label: 'PDP Star Rating',       value: Math.round(data.pdp_star_rating * 100) / 100, trend: data.pdp_star_rating_trend },
    products:            { label: 'Products',              value: data.products,                              trend: 0 },
    brands:              { label: 'Brands',                value: data.brands,                                trend: 0 },
  }
  const m = metricMap[cfg.metric]
  if (!m) return []
  return [{ Metric: m.label, Value: m.value, 'Trend vs Prior Period (%)': Math.round(m.trend * 100) / 100 }]
}

function timeSeriesRows(data: TimeSeriesResponse, cfg: TimeSeriesConfig): Row[] {
  return (data.data ?? []).map(p => {
    const row: Row = { Date: p.date }
    if (cfg.metrics.includes('volume'))              row['Review Volume'] = p.volume
    if (cfg.metrics.includes('sentiment'))           row['Sentiment (%)'] = Math.round(p.sentiment * 100)
    if (cfg.metrics.includes('reviews_star_rating')) row['Avg Star Rating'] = Math.round(p.reviews_star_rating * 100) / 100
    return row
  })
}

function brandSeriesRows(data: BrandTimeSeriesData): Row[] {
  return data.points.map(p => {
    const row: Row = { Date: String(p.date) }
    data.brands.forEach(b => { row[b] = p[b] as number ?? null })
    return row
  })
}

function starRatingRows(data: StarRatingTimeSeriesData): Row[] {
  return data.points.map(p => ({
    Date: p.date,
    '1★ Reviews': p['1'],
    '2★ Reviews': p['2'],
    '3★ Reviews': p['3'],
    '4★ Reviews': p['4'],
    '5★ Reviews': p['5'],
  }))
}

function topicsRows(data: TopicsTrendsResponse): Row[] {
  const growing = (data.growing?.data ?? []).map(t => ({ ...t, status: 'Growing' }))
  const decreasing = (data.decreasing?.data ?? []).map(t => ({ ...t, status: 'Declining' }))
  return [...growing, ...decreasing].map(t => ({
    Topic: t.name,
    Status: t.status,
    'Review Volume': t.volume,
    'Volume Trend (%)': Math.round(t.volume_trend * 100) / 100,
    'Sentiment (%)': Math.round(t.sentiment * 100),
    'Sentiment Trend (%)': Math.round((t.sentiment_trend ?? 0) * 100) / 100,
  }))
}

function productsRows(data: ProductsResponse): Row[] {
  return (data.products ?? []).map(p => ({
    Product: p.name,
    Brand: p.brand,
    'Review Count': p.reviews_data?.reviews ?? null,
    'Review Count vs Prior': p.reviews_data?.change ?? null,
    'Avg Star Rating': Math.round((p.reviews_star_rating?.avg ?? 0) * 100) / 100,
    'Sentiment (%)': Math.round((p.sentiment_data?.sentiment ?? 0) * 100),
    'Sentiment vs Prior (%)': Math.round((p.sentiment_data?.change ?? 0) * 100) / 100,
  }))
}

// Runs a custom transform and extracts flat rows from chartData or rows
function customRows(data: unknown, code: string, kind: 'chart' | 'table'): Row[] {
  try {
    const requireField = (v: unknown) => v  // non-throwing in export context — we just export what we have
    // eslint-disable-next-line no-new-func
    const fn = new Function('data', 'dateFns', 'helpers', code)
    const result = fn(data, { format, parseISO }, { requireField })
    if (kind === 'table' && Array.isArray(result?.rows)) return result.rows as Row[]
    if (kind === 'chart' && Array.isArray(result?.chartData)) return result.chartData as Row[]
    return []
  } catch {
    return []
  }
}

// ─── Fetch widget data (mirrors useWidgetData logic, non-hook) ────────────────

async function fetchWidgetData(widget: Widget, body: ApiRequestBody): Promise<Row[]> {
  const filter = body.filter

  try {
    switch (widget.type) {
      case 'kpi_card': {
        const data = await fetchStatisticsTotals(body)
        return kpiRows(data, widget.config as KPICardConfig)
      }
      case 'time_series': {
        const data = await fetchKeyMetricsOvertime(body)
        return timeSeriesRows(data as TimeSeriesResponse, widget.config as TimeSeriesConfig)
      }
      case 'topics_table':
      case 'topics_scatter': {
        const data = await fetchTopicsTrends(body)
        return topicsRows(data as TopicsTrendsResponse)
      }
      case 'products_table': {
        const cfg = widget.config as ProductsTableConfig
        const data = await fetchProducts({ ...body, size: cfg.size ?? 100 })
        return productsRows(data as ProductsResponse)
      }
      case 'brand_reviews_overtime':
      case 'stacked_bar': {
        const cfg = widget.config as BrandReviewsOvertimeConfig | StackedBarConfig
        const brands = cfg.brands?.length ? cfg.brands : filter.brand_names
        if (!brands.length) return []
        const results = await Promise.all(
          brands.map(brand =>
            fetchKeyMetricsOvertime({ ...body, filter: { ...filter, brand_names: [brand] } })
              .then(r => ({ brand, series: r.data ?? [] }))
          )
        )
        const dateMap: Record<string, Record<string, number>> = {}
        results.forEach(({ brand, series }) => {
          series.forEach(pt => {
            if (!dateMap[pt.date]) dateMap[pt.date] = {}
            dateMap[pt.date][brand] = pt.volume
          })
        })
        const bData: BrandTimeSeriesData = {
          brands,
          points: Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, vals]) => ({ date, ...vals })),
        }
        return brandSeriesRows(bData)
      }
      case 'star_rating_bar': {
        const results = await Promise.all(
          ([1, 2, 3, 4, 5] as const).map(star =>
            fetchKeyMetricsOvertime({ ...body, filter: { ...filter, star_ratings: [star] } })
              .then(r => ({ star, series: r.data ?? [] }))
          )
        )
        const dateMap: Record<string, Record<string, number>> = {}
        results.forEach(({ star, series }) => {
          series.forEach(pt => {
            if (!dateMap[pt.date]) dateMap[pt.date] = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
            dateMap[pt.date][String(star)] = pt.volume
          })
        })
        const sData: StarRatingTimeSeriesData = {
          points: Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b))
            .map(([date, vals]) => ({ date, ...vals } as StarRatingTimeSeriesData['points'][0])),
        }
        return starRatingRows(sData)
      }
      case 'custom_chart':
      case 'custom_table': {
        const cfg = widget.config as CustomChartConfig | CustomTableConfig
        let data: unknown

        if (cfg.endpoint === 'products_monthly') {
          const rangeStart = parseISO(filter.range.start_date)
          const rangeEnd = parseISO(filter.range.end_date)
          const months: string[] = []
          let cur = startOfMonth(rangeStart)
          while (!isAfter(cur, startOfMonth(rangeEnd))) {
            months.push(format(cur, 'yyyy-MM'))
            cur = addMonths(cur, 1)
          }
          const results = await Promise.all(
            months.map(month => {
              const mStart = `${month}-01`
              const mEnd = format(endOfMonth(parseISO(mStart)), 'yyyy-MM-dd')
              const mFilter = { ...filter, range: { start_date: mStart, end_date: mEnd, range_type: 'custom' as const } }
              return fetchProducts({ ...body, filter: mFilter, size: 100 }).then(r => ({ month, products: r.products }))
            })
          )
          const byMonth: Record<string, typeof results[0]['products']> = {}
          results.forEach(({ month, products }) => { byMonth[month] = products })
          data = { months, byMonth }
        } else if (cfg.endpoint === 'star_ratings_summary') {
          const results = await Promise.all(
            ([1, 2, 3, 4, 5] as const).map(star =>
              fetchKeyMetricsOvertime({ ...body, filter: { ...filter, star_ratings: [star] } })
                .then(r => ({ star, total: (r.data ?? []).reduce((s, pt) => s + pt.volume, 0) }))
            )
          )
          const summary: Record<string, number> = {}
          results.forEach(({ star, total }) => { summary[String(star)] = total })
          data = summary
        } else {
          switch (cfg.endpoint) {
            case 'key_metrics_overtime': data = await fetchKeyMetricsOvertime(body); break
            case 'topics_trends':        data = await fetchTopicsTrends(body); break
            case 'statistics_totals':    data = await fetchStatisticsTotals(body); break
            case 'products':             data = await fetchProducts({ ...body, size: 100 }); break
            default:                     data = await fetchKeyMetricsOvertime(body)
          }
        }
        return customRows(data, cfg.transformCode, widget.type === 'custom_chart' ? 'chart' : 'table')
      }
      default:
        return []
    }
  } catch {
    return []
  }
}

// ─── Safe sheet name (max 31 chars, no forbidden chars) ──────────────────────
function sheetName(title: string, index: number): string {
  const safe = title.replace(/[:\\/?*[\]]/g, '').trim().slice(0, 28)
  return safe || `Widget ${index + 1}`
}

// ─── Rows → write-excel-file schema ──────────────────────────────────────────
// write-excel-file expects [ [headerRow], [dataRow], ... ] where each cell is { value, type? }

type WEFCell = { value: string | number; type?: typeof String | typeof Number }
type WEFRow = WEFCell[]

function toWefSheet(rows: Row[]): WEFRow[] {
  if (rows.length === 0) return []
  const keys = Object.keys(rows[0])
  const header: WEFRow = keys.map(k => ({ value: k, type: String }))
  const data: WEFRow[] = rows.map(row =>
    keys.map(k => {
      const v = row[k]
      if (v === null || v === undefined) return { value: '', type: String }
      if (typeof v === 'number')         return { value: v, type: Number }
      return { value: String(v), type: String }
    })
  )
  return [header, ...data]
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function exportDashboardToSheets(
  dashboard: Dashboard,
  onProgress?: (msg: string) => void
): Promise<void> {
  const body: ApiRequestBody = {
    filter: dashboard.filter,
    compare_range: dashboard.compare_range,
    group_by_product_line: false,
  }

  const sheets: WEFRow[][] = []
  const names: string[] = []

  // Overview sheet
  onProgress?.('Fetching overview…')
  try {
    const totals = await fetchStatisticsTotals(body)
    const overviewRows: Row[] = [
      { Metric: 'Total Reviews',         Value: totals.volume,                                          'Trend vs Prior (%)': Math.round(totals.volume_trend * 100) / 100 },
      { Metric: 'Sentiment (%)',         Value: Math.round(totals.sentiment * 100),                    'Trend vs Prior (%)': Math.round(totals.sentiment_trend * 100) / 100 },
      { Metric: 'Avg Star Rating',       Value: Math.round(totals.reviews_star_rating * 100) / 100,    'Trend vs Prior (%)': Math.round(totals.reviews_star_rating_trend * 100) / 100 },
      { Metric: 'PDP Star Rating',       Value: Math.round(totals.pdp_star_rating * 100) / 100,        'Trend vs Prior (%)': Math.round(totals.pdp_star_rating_trend * 100) / 100 },
      { Metric: 'Products Tracked',      Value: totals.products,                                        'Trend vs Prior (%)': null },
      { Metric: 'Brands Tracked',        Value: totals.brands,                                          'Trend vs Prior (%)': null },
    ]
    sheets.push(toWefSheet(overviewRows))
    names.push('Overview')
  } catch { /* skip overview if fetch fails */ }

  // One sheet per widget
  for (let i = 0; i < dashboard.widgets.length; i++) {
    const widget = dashboard.widgets[i]
    onProgress?.(`Fetching "${widget.title}" (${i + 1}/${dashboard.widgets.length})…`)
    const rows = await fetchWidgetData(widget, body)
    if (rows.length === 0) continue
    sheets.push(toWefSheet(rows))
    names.push(sheetName(widget.title, i))
  }

  if (sheets.length === 0) return

  const filename = `${dashboard.name.replace(/[^\w\s-]/g, '').trim() || 'Dashboard'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  await writeXlsxFile(sheets, { sheets: names, fileName: filename })
}
