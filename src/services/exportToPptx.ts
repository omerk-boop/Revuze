/**
 * Exports a dashboard as an editable .pptx file.
 * Every chart is a native PowerPoint chart (editable in PPT / Google Slides).
 * Every table is a native PowerPoint table.
 */
import pptxgen from 'pptxgenjs'
import { format, parseISO, startOfMonth, endOfMonth, addMonths, isAfter } from 'date-fns'
import type {
  Dashboard, Widget,
  KPICardConfig, TimeSeriesConfig,
  BrandReviewsOvertimeConfig, StackedBarConfig,
  CustomChartConfig, CustomTableConfig, ProductsTableConfig,
} from '../types/dashboard'
import type { ApiRequestBody } from './api'
import {
  fetchStatisticsTotals,
  fetchKeyMetricsOvertime,
  fetchTopicsTrends,
  fetchProducts,
} from './api'
import type {
  StatisticsTotals, TimeSeriesResponse, TopicsTrendsResponse,
  ProductsResponse, BrandTimeSeriesData, StarRatingTimeSeriesData,
} from '../types/api'

// ─── Design tokens ────────────────────────────────────────────────────────────

const BRAND   = '6366f1'
const SLATE9  = '0f172a'
const SLATE5  = '64748b'
const WHITE   = 'FFFFFF'

const CHART_COLORS = ['6366f1','0ea5e9','10b981','f59e0b','ef4444','8b5cf6','ec4899','14b8a6']
// Star rating colors: red → orange → amber → lime → emerald
const STAR_COLORS  = ['ef4444','f97316','f59e0b','84cc16','10b981']

// Slide is 13.33" × 7.5" (widescreen)
const M   = 0.4          // margin
const TH  = 0.55         // title height
const CY  = M + TH + 0.2 // content top
const CW  = 13.33 - M*2  // content width
const CH  = 7.5 - CY - M // content height

// ─── Slide helpers ────────────────────────────────────────────────────────────

function addSlideTitle(slide: pptxgen.Slide, title: string, sub?: string) {
  // Left accent bar
  slide.addShape('rect' as pptxgen.SHAPE_NAME, {
    x: M, y: M, w: 0.05, h: TH,
    fill: { color: BRAND }, line: { color: BRAND, width: 0 },
  })
  slide.addText(title.toUpperCase(), {
    x: M + 0.18, y: M, w: CW - 0.18, h: TH,
    fontSize: 13, bold: true, color: SLATE9, valign: 'middle', charSpacing: 1,
  })
  if (sub) {
    slide.addText(sub, {
      x: M + 0.18, y: M + TH + 0.05, w: CW, h: 0.25,
      fontSize: 8.5, color: SLATE5, italic: true,
    })
  }
}

function chartOpts(extra?: Partial<pptxgen.IChartOpts>): pptxgen.IChartOpts {
  return {
    x: M, y: CY, w: CW, h: CH,
    showLegend: true, legendPos: 'b', legendFontSize: 9,
    valGridLine: { style: 'solid', color: 'E2E8F0', size: 0.5 },
    plotArea: { border: { color: 'FFFFFF', pt: 0 } },
    chartColors: CHART_COLORS,
    ...extra,
  }
}

function tableHeaderRow(keys: string[]): pptxgen.TableRow {
  return keys.map(k => ({
    text: k,
    options: { bold: true, fill: { color: 'F1F5F9' }, color: SLATE9, fontSize: 9, border: { type: 'solid' as const, pt: 0.5, color: 'E2E8F0' } },
  }))
}

function tableDataRow(values: (string | number | null)[]): pptxgen.TableRow {
  return values.map(v => ({
    text: v === null || v === undefined ? '' : String(v),
    options: { fontSize: 8.5, color: SLATE5, border: { type: 'solid' as const, pt: 0.5, color: 'E2E8F0' } },
  }))
}

function addTable(slide: pptxgen.Slide, keys: string[], rows: Record<string, unknown>[]) {
  const maxRows = Math.min(rows.length, 30) // cap at 30 rows to fit on slide
  const colW = CW / keys.length
  slide.addTable(
    [tableHeaderRow(keys), ...rows.slice(0, maxRows).map(r => tableDataRow(keys.map(k => r[k] as string | number | null)))],
    { x: M, y: CY, w: CW, h: CH, colW: keys.map(() => colW), rowH: 0.28, autoPage: false },
  )
}

// ─── Per-widget slide builders ────────────────────────────────────────────────

function kpiSlide(pptx: pptxgen, widget: Widget, data: StatisticsTotals) {
  const cfg = widget.config as KPICardConfig
  const MAP = {
    sentiment:           { label: 'Sentiment', value: `${Math.round(data.sentiment * 100)}%`,             trend: data.sentiment_trend },
    volume:              { label: 'Total Reviews', value: data.volume.toLocaleString(),                     trend: data.volume_trend },
    reviews_star_rating: { label: 'Avg Star Rating', value: data.reviews_star_rating.toFixed(2),           trend: data.reviews_star_rating_trend },
    pdp_star_rating:     { label: 'PDP Star Rating', value: data.pdp_star_rating.toFixed(2),               trend: data.pdp_star_rating_trend },
    products:            { label: 'Products Tracked', value: data.products.toLocaleString(),               trend: 0 },
    brands:              { label: 'Brands Tracked', value: data.brands.toLocaleString(),                   trend: 0 },
  }
  const m = MAP[cfg.metric as keyof typeof MAP]
  if (!m) return
  const slide = pptx.addSlide()
  addSlideTitle(slide, widget.title)
  slide.addText(m.value, { x: M, y: 2.5, w: CW, h: 2, fontSize: 80, bold: true, color: BRAND, align: 'center' })
  if (m.trend !== 0) {
    const up = m.trend >= 0
    const trendStr = `${up ? '▲' : '▼'} ${Math.abs(Math.round(m.trend * 100) / 100)}% vs prior period`
    slide.addText(trendStr, { x: M, y: 4.6, w: CW, h: 0.5, fontSize: 16, color: up ? '10b981' : 'ef4444', align: 'center' })
  }
}

function timeSeriesSlide(pptx: pptxgen, widget: Widget, data: TimeSeriesResponse) {
  const cfg = widget.config as TimeSeriesConfig
  const pts = data.data ?? []
  const labels = pts.map(p => format(parseISO(p.date), 'MMM d'))
  const seriesData: pptxgen.OptsChartData[] = []
  if (cfg.metrics.includes('volume'))              seriesData.push({ name: 'Volume',      labels, values: pts.map(p => p.volume) })
  if (cfg.metrics.includes('sentiment'))           seriesData.push({ name: 'Sentiment %', labels, values: pts.map(p => Math.round(p.sentiment * 100)) })
  if (cfg.metrics.includes('reviews_star_rating')) seriesData.push({ name: 'Star Rating', labels, values: pts.map(p => Math.round(p.reviews_star_rating * 100) / 100) })
  if (!seriesData.length) return
  const slide = pptx.addSlide()
  addSlideTitle(slide, widget.title)
  slide.addChart(pptx.ChartType.line, seriesData, chartOpts({ lineSmooth: true, lineSize: 2 }))
}

function brandSlide(pptx: pptxgen, widget: Widget, data: BrandTimeSeriesData, stacked = false) {
  const labels = data.points.map(p => String(p.date))
  const seriesData: pptxgen.OptsChartData[] = data.brands.map(brand => ({
    name: brand,
    labels,
    values: data.points.map(p => (p[brand] as number) ?? 0),
  }))
  if (!seriesData.length) return
  const slide = pptx.addSlide()
  addSlideTitle(slide, widget.title)
  if (stacked) {
    slide.addChart(pptx.ChartType.bar, seriesData, chartOpts({ barGrouping: 'stacked', barDir: 'col', chartColors: CHART_COLORS }))
  } else {
    slide.addChart(pptx.ChartType.line, seriesData, chartOpts({ lineSmooth: true, lineSize: 2 }))
  }
}

function starRatingSlide(pptx: pptxgen, widget: Widget, data: StarRatingTimeSeriesData) {
  const labels = data.points.map(p => p.date)
  const seriesData: pptxgen.OptsChartData[] = ([1,2,3,4,5] as const).map((s, i) => ({
    name: `${s}★`,
    labels,
    values: data.points.map(p => p[String(s) as keyof typeof p] as number ?? 0),
    color: STAR_COLORS[i],
  }))
  const slide = pptx.addSlide()
  addSlideTitle(slide, widget.title)
  slide.addChart(pptx.ChartType.bar, seriesData, chartOpts({
    barGrouping: 'stacked', barDir: 'col', chartColors: STAR_COLORS,
  }))
}

function topicsSlide(pptx: pptxgen, widget: Widget, data: TopicsTrendsResponse) {
  const growing   = (data.growing?.data   ?? []).map(t => ({ ...t, status: 'Growing' }))
  const declining = (data.decreasing?.data ?? []).map(t => ({ ...t, status: 'Declining' }))
  const rows = [...growing, ...declining].map(t => ({
    Topic: t.name,
    Status: t.status,
    Volume: t.volume,
    'Volume Trend': `${t.volume_trend >= 0 ? '+' : ''}${Math.round(t.volume_trend * 100) / 100}%`,
    'Sentiment': `${Math.round(t.sentiment * 100)}%`,
  }))
  if (!rows.length) return
  const slide = pptx.addSlide()
  addSlideTitle(slide, widget.title)
  addTable(slide, Object.keys(rows[0]), rows)
}

function productsSlide(pptx: pptxgen, widget: Widget, data: ProductsResponse) {
  const rows = (data.products ?? []).map(p => ({
    Product: p.name,
    Brand: p.brand,
    Reviews: p.reviews_data?.reviews ?? 0,
    'Star Rating': (p.reviews_star_rating?.avg ?? 0).toFixed(2),
    'Sentiment': `${Math.round((p.sentiment_data?.sentiment ?? 0) * 100)}%`,
  }))
  if (!rows.length) return
  const slide = pptx.addSlide()
  addSlideTitle(slide, widget.title)
  addTable(slide, Object.keys(rows[0]), rows)
}

function customChartSlide(pptx: pptxgen, widget: Widget, data: unknown) {
  const cfg = widget.config as CustomChartConfig
  let spec: { chartData: Record<string,unknown>[]; xKey: string; series: { kind: string; dataKey: string; name: string; stackId?: string }[] } | null = null
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('data', 'dateFns', 'helpers', cfg.transformCode)
    spec = fn(data, { format, parseISO }, { requireField: (v: unknown) => v })
  } catch { return }
  if (!spec || !spec.chartData.length) return

  const labels = spec.chartData.map(d => String(d[spec!.xKey] ?? ''))
  const isPie  = spec.series.some(s => s.kind === 'pie')
  const isBar  = !isPie && spec.series.some(s => s.kind === 'bar')

  const slide = pptx.addSlide()
  addSlideTitle(slide, widget.title)

  if (isPie) {
    const pieSeries = spec.series.find(s => s.kind === 'pie')!
    const pieData: pptxgen.OptsChartData[] = [{
      name: pieSeries.name,
      labels,
      values: spec.chartData.map(d => Number(d[pieSeries.dataKey] ?? 0)),
    }]
    slide.addChart(pptx.ChartType.pie, pieData, chartOpts({ showPercent: true, showLabel: true, chartColors: CHART_COLORS }))
    return
  }

  const seriesData: pptxgen.OptsChartData[] = spec.series.map(s => ({
    name: s.name,
    labels,
    values: spec!.chartData.map(d => Number(d[s.dataKey] ?? 0)),
  }))

  const stacked = spec.series.some(s => s.stackId)
  const chartType = isBar ? pptx.ChartType.bar : pptx.ChartType.line
  slide.addChart(chartType, seriesData, chartOpts({
    ...(isBar ? { barGrouping: stacked ? 'stacked' : 'clustered', barDir: 'col' } : { lineSmooth: true, lineSize: 2 }),
    chartColors: CHART_COLORS,
  }))
}

function customTableSlide(pptx: pptxgen, widget: Widget, data: unknown) {
  const cfg = widget.config as CustomTableConfig
  let spec: { columns: { key: string; label: string }[]; rows: Record<string,unknown>[] } | null = null
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('data', 'helpers', cfg.transformCode)
    spec = fn(data, { requireField: (v: unknown) => v })
  } catch { return }
  if (!spec || !spec.rows.length) return

  const slide = pptx.addSlide()
  addSlideTitle(slide, widget.title)
  const keys = spec.columns.map(c => c.label)
  const rows = spec.rows.map(r => {
    const mapped: Record<string,unknown> = {}
    spec!.columns.forEach(c => { mapped[c.label] = r[c.key] })
    return mapped
  })
  addTable(slide, keys, rows)
}

// ─── Data fetching (mirrors useWidgetData for each type) ──────────────────────

async function buildWidgetSlide(pptx: pptxgen, widget: Widget, body: ApiRequestBody) {
  const filter = body.filter
  try {
    switch (widget.type) {
      case 'kpi_card': {
        const data = await fetchStatisticsTotals(body)
        kpiSlide(pptx, widget, data as StatisticsTotals); break
      }
      case 'time_series': {
        const data = await fetchKeyMetricsOvertime(body)
        timeSeriesSlide(pptx, widget, data as TimeSeriesResponse); break
      }
      case 'topics_table':
      case 'topics_scatter': {
        const data = await fetchTopicsTrends(body)
        topicsSlide(pptx, widget, data as TopicsTrendsResponse); break
      }
      case 'products_table': {
        const cfg = widget.config as ProductsTableConfig
        const data = await fetchProducts({ ...body, size: cfg.size ?? 20 })
        productsSlide(pptx, widget, data as ProductsResponse); break
      }
      case 'brand_reviews_overtime': {
        const cfg = widget.config as BrandReviewsOvertimeConfig
        const brands = cfg.brands?.length ? cfg.brands : filter.brand_names
        if (!brands.length) break
        const results = await Promise.all(brands.map(b =>
          fetchKeyMetricsOvertime({ ...body, filter: { ...filter, brand_names: [b] } }).then(r => ({ brand: b, series: r.data ?? [] }))
        ))
        const dateMap: Record<string, Record<string, number>> = {}
        results.forEach(({ brand, series }) => series.forEach(pt => {
          if (!dateMap[pt.date]) dateMap[pt.date] = {}
          dateMap[pt.date][brand] = pt.volume
        }))
        const bData: BrandTimeSeriesData = {
          brands,
          points: Object.entries(dateMap).sort(([a],[b])=>a.localeCompare(b)).map(([date,v])=>({date,...v})),
        }
        brandSlide(pptx, widget, bData, false); break
      }
      case 'stacked_bar': {
        const cfg = widget.config as StackedBarConfig
        const brands = cfg.brands?.length ? cfg.brands : filter.brand_names
        if (!brands.length) break
        const results = await Promise.all(brands.map(b =>
          fetchKeyMetricsOvertime({ ...body, filter: { ...filter, brand_names: [b] } }).then(r => ({ brand: b, series: r.data ?? [] }))
        ))
        const dateMap: Record<string, Record<string, number>> = {}
        results.forEach(({ brand, series }) => series.forEach(pt => {
          if (!dateMap[pt.date]) dateMap[pt.date] = {}
          dateMap[pt.date][brand] = pt.volume
        }))
        const bData: BrandTimeSeriesData = {
          brands,
          points: Object.entries(dateMap).sort(([a],[b])=>a.localeCompare(b)).map(([date,v])=>({date,...v})),
        }
        brandSlide(pptx, widget, bData, true); break
      }
      case 'star_rating_bar': {
        const results = await Promise.all(([1,2,3,4,5] as const).map(star =>
          fetchKeyMetricsOvertime({ ...body, filter: { ...filter, star_ratings: [star] } }).then(r => ({ star, series: r.data ?? [] }))
        ))
        const dateMap: Record<string, Record<string, number>> = {}
        results.forEach(({ star, series }) => series.forEach(pt => {
          if (!dateMap[pt.date]) dateMap[pt.date] = {'1':0,'2':0,'3':0,'4':0,'5':0}
          dateMap[pt.date][String(star)] = pt.volume
        }))
        const sData: StarRatingTimeSeriesData = {
          points: Object.entries(dateMap).sort(([a],[b])=>a.localeCompare(b))
            .map(([date,v])=>({date,...v} as StarRatingTimeSeriesData['points'][0])),
        }
        starRatingSlide(pptx, widget, sData); break
      }
      case 'custom_chart': {
        const cfg = widget.config as CustomChartConfig
        let data: unknown
        if (cfg.endpoint === 'star_ratings_summary') {
          const results = await Promise.all(([1,2,3,4,5] as const).map(s =>
            fetchKeyMetricsOvertime({ ...body, filter: { ...filter, star_ratings: [s] } }).then(r => ({ s, total: (r.data??[]).reduce((acc,p)=>acc+p.volume,0) }))
          ))
          const summary: Record<string,number> = {}; results.forEach(({s,total})=>{summary[String(s)]=total}); data = summary
        } else if (cfg.endpoint === 'products_monthly') {
          const rangeStart = parseISO(filter.range.start_date), rangeEnd = parseISO(filter.range.end_date)
          const months: string[] = []; let cur = startOfMonth(rangeStart)
          while (!isAfter(cur, startOfMonth(rangeEnd))) { months.push(format(cur,'yyyy-MM')); cur = addMonths(cur,1) }
          const results = await Promise.all(months.map(m => {
            const mStart=`${m}-01`, mEnd=format(endOfMonth(parseISO(mStart)),'yyyy-MM-dd')
            const mFilter={...filter,range:{start_date:mStart,end_date:mEnd,range_type:'custom' as const}}
            return fetchProducts({...body,filter:mFilter,size:100}).then(r=>({month:m,products:r.products}))
          }))
          const byMonth: Record<string,typeof results[0]['products']> = {}; results.forEach(({month,products})=>{byMonth[month]=products}); data={months,byMonth}
        } else {
          switch (cfg.endpoint) {
            case 'key_metrics_overtime': data = await fetchKeyMetricsOvertime(body); break
            case 'topics_trends':        data = await fetchTopicsTrends(body); break
            case 'statistics_totals':    data = await fetchStatisticsTotals(body); break
            case 'products':             data = await fetchProducts({...body, size:100}); break
            default:                     data = await fetchKeyMetricsOvertime(body)
          }
        }
        customChartSlide(pptx, widget, data); break
      }
      case 'custom_table': {
        const cfg = widget.config as CustomTableConfig
        let data: unknown
        switch (cfg.endpoint) {
          case 'key_metrics_overtime': data = await fetchKeyMetricsOvertime(body); break
          case 'topics_trends':        data = await fetchTopicsTrends(body); break
          case 'statistics_totals':    data = await fetchStatisticsTotals(body); break
          case 'products':             data = await fetchProducts({...body, size:100}); break
          default:                     data = await fetchKeyMetricsOvertime(body)
        }
        customTableSlide(pptx, widget, data); break
      }
    }
  } catch { /* skip failed widgets silently */ }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function exportDashboardToPptx(
  dashboard: Dashboard,
  onProgress?: (msg: string) => void,
): Promise<void> {
  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title  = dashboard.name

  const body: ApiRequestBody = {
    filter: dashboard.filter,
    compare_range: dashboard.compare_range,
    group_by_product_line: false,
  }

  // ── Title slide ────────────────────────────────────────────────────────────
  const title = pptx.addSlide()
  title.background = { color: SLATE9 }
  title.addShape('rect' as pptxgen.SHAPE_NAME, { x:0, y:0, w:0.12, h:7.5, fill:{color:BRAND}, line:{color:BRAND,width:0} })
  title.addText(dashboard.name, { x:0.5, y:2.2, w:12.5, h:1.5, fontSize:40, bold:true, color:WHITE })
  const range = `${dashboard.filter.range.start_date}  →  ${dashboard.filter.range.end_date}`
  title.addText(range, { x:0.5, y:3.8, w:12.5, h:0.5, fontSize:14, color:'94a3b8' })
  if (dashboard.filter.brand_names?.length) {
    title.addText(`Brands: ${dashboard.filter.brand_names.join(' · ')}`, { x:0.5, y:4.4, w:12.5, h:0.4, fontSize:11, color:'64748b' })
  }
  title.addText(`Generated ${format(new Date(), 'MMMM d, yyyy')}`, { x:0.5, y:6.8, w:12.5, h:0.3, fontSize:9, color:'334155' })

  // ── Overview KPI slide ─────────────────────────────────────────────────────
  onProgress?.('Fetching overview…')
  try {
    const totals = await fetchStatisticsTotals(body) as StatisticsTotals
    const overview = pptx.addSlide()
    addSlideTitle(overview, 'Overview')

    const metrics = [
      { label: 'Total Reviews',   value: totals.volume.toLocaleString(),                          trend: totals.volume_trend },
      { label: 'Sentiment',       value: `${Math.round(totals.sentiment * 100)}%`,                trend: totals.sentiment_trend },
      { label: 'Avg Star Rating', value: totals.reviews_star_rating.toFixed(2),                  trend: totals.reviews_star_rating_trend },
      { label: 'Products',        value: totals.products.toLocaleString(),                        trend: 0 },
    ]
    const bw = CW / metrics.length
    metrics.forEach((m, i) => {
      const x = M + i * bw
      overview.addShape('rect' as pptxgen.SHAPE_NAME, { x, y: CY, w: bw - 0.2, h: CH, fill:{color:'F8FAFC'}, line:{color:'E2E8F0',width:1} })
      overview.addText(m.label, { x, y: CY + 0.3, w: bw - 0.2, h: 0.4, fontSize: 10, color: SLATE5, align: 'center' })
      overview.addText(m.value, { x, y: CY + 0.8, w: bw - 0.2, h: 1.4, fontSize: 36, bold: true, color: BRAND, align: 'center' })
      if (m.trend !== 0) {
        const up = m.trend >= 0
        overview.addText(`${up?'▲':'▼'} ${Math.abs(Math.round(m.trend*100)/100)}%`, {
          x, y: CY + 2.3, w: bw - 0.2, h: 0.4, fontSize: 12, color: up ? '10b981' : 'ef4444', align: 'center',
        })
      }
    })
  } catch { /* skip */ }

  // ── One slide per widget ───────────────────────────────────────────────────
  for (let i = 0; i < dashboard.widgets.length; i++) {
    const widget = dashboard.widgets[i]
    onProgress?.(`Building "${widget.title}" (${i + 1}/${dashboard.widgets.length})…`)
    await buildWidgetSlide(pptx, widget, body)
  }

  const filename = `${dashboard.name.replace(/[^\w\s-]/g, '').trim() || 'Dashboard'}_${format(new Date(), 'yyyy-MM-dd')}.pptx`
  await pptx.writeFile({ fileName: filename })
}
