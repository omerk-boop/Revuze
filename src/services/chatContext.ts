/**
 * Builds a compact text context describing the dashboard and its data.
 * Fetched once when the chat opens; passed as system context to Claude.
 */
import type { Dashboard } from '../types/dashboard'
import type { ApiRequestBody } from './api'
import {
  fetchStatisticsTotals,
  fetchKeyMetricsOvertime,
  fetchTopicsTrends,
  fetchProducts,
} from './api'
import type { TimeSeriesDataPoint, TopicDataPoint } from '../types/api'

function pct(n: number) { return `${(n * 100).toFixed(1)}%` }
function signed(n: number) { return n >= 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%` }
function round2(n: number) { return Math.round(n * 100) / 100 }

export async function buildDashboardContext(dashboard: Dashboard): Promise<string> {
  const { filter, compare_range, widgets } = dashboard
  const body: ApiRequestBody = { filter, compare_range, group_by_product_line: false }

  const lines: string[] = []

  // ── Header ──────────────────────────────────────────────────────────────────
  lines.push(`DASHBOARD: ${dashboard.name}`)
  lines.push(`DATE RANGE: ${filter.range.start_date} → ${filter.range.end_date}`)
  if (filter.brand_names?.length) lines.push(`BRANDS: ${filter.brand_names.join(', ')}`)
  if (filter.domains?.length) lines.push(`DOMAINS: ${filter.domains.join(', ')}`)
  lines.push('')

  // ── Overview totals ──────────────────────────────────────────────────────────
  try {
    const totals = await fetchStatisticsTotals(body)
    lines.push('=== OVERVIEW (totals for full date range) ===')
    lines.push(`Reviews: ${totals.volume.toLocaleString()} (${signed(totals.volume_trend)} vs prior period)`)
    lines.push(`Sentiment: ${pct(totals.sentiment)} (${signed(totals.sentiment_trend)} vs prior)`)
    lines.push(`Avg Star Rating (reviews): ${round2(totals.reviews_star_rating)} (${signed(totals.reviews_star_rating_trend)} vs prior)`)
    if (totals.pdp_star_rating) lines.push(`PDP Star Rating: ${round2(totals.pdp_star_rating)} (${signed(totals.pdp_star_rating_trend)} vs prior)`)
    lines.push(`Products tracked: ${totals.products} | Brands: ${totals.brands}`)
    lines.push('')
  } catch { /* skip if fetch fails */ }

  // ── Time-series trend ────────────────────────────────────────────────────────
  try {
    const ts = await fetchKeyMetricsOvertime(body)
    const pts: TimeSeriesDataPoint[] = ts.data ?? []
    if (pts.length) {
      lines.push('=== WEEKLY TREND (recent 8 weeks) ===')
      const recent = pts.slice(-8)
      lines.push('Date         | Volume | Sentiment | Star Rating')
      recent.forEach((p) =>
        lines.push(`${p.date} | ${p.volume.toString().padStart(6)} | ${pct(p.sentiment).padStart(9)} | ${round2(p.reviews_star_rating)}`)
      )
      // Trend direction
      if (pts.length >= 2) {
        const first = pts[0], last = pts[pts.length - 1]
        const volChg = ((last.volume - first.volume) / (first.volume || 1)) * 100
        lines.push(`Volume trend over period: ${signed(volChg)}`)
      }
      lines.push('')
    }
  } catch { /* skip */ }

  // ── Topics ───────────────────────────────────────────────────────────────────
  try {
    const topics = await fetchTopicsTrends(body)
    const growing: TopicDataPoint[] = topics.growing?.data?.slice(0, 10) ?? []
    const decreasing: TopicDataPoint[] = topics.decreasing?.data?.slice(0, 10) ?? []
    if (growing.length || decreasing.length) {
      lines.push('=== TOP TOPICS ===')
      if (growing.length) {
        lines.push('Growing topics:')
        growing.forEach((t) =>
          lines.push(`  - ${t.name}: ${t.volume.toLocaleString()} reviews, ${pct(t.sentiment)} sentiment, ${signed(t.volume_trend)}`)
        )
      }
      if (decreasing.length) {
        lines.push('Declining topics:')
        decreasing.forEach((t) =>
          lines.push(`  - ${t.name}: ${t.volume.toLocaleString()} reviews, ${pct(t.sentiment)} sentiment, ${signed(t.volume_trend)}`)
        )
      }
      lines.push(`Overall sentiment: ${pct(topics.total_sentiment)}`)
      lines.push('')
    }
  } catch { /* skip */ }

  // ── Products ─────────────────────────────────────────────────────────────────
  try {
    const prods = await fetchProducts({ ...body, size: 20 })
    const list = prods.products ?? []
    if (list.length) {
      lines.push('=== TOP PRODUCTS (by review count) ===')
      list.forEach((p, i) => {
        const reviews = p.reviews_data?.reviews ?? 0
        const sentiment = p.sentiment_data?.sentiment ?? 0
        const rating = p.reviews_star_rating?.avg ?? 0
        lines.push(`${i + 1}. ${p.name} (${p.brand}): ${reviews.toLocaleString()} reviews, ${pct(sentiment)} sentiment, ${round2(rating)}★`)
      })
      lines.push('')
    }
  } catch { /* skip */ }

  // ── Widget inventory ─────────────────────────────────────────────────────────
  if (widgets.length) {
    lines.push('=== DASHBOARD WIDGETS ===')
    widgets.forEach((w) => lines.push(`- "${w.title}" [${w.type}]`))
  }

  return lines.join('\n')
}
