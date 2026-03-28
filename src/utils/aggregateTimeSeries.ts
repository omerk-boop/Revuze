import { parseISO, format } from 'date-fns'
import type { TimeSeriesDataPoint } from '../types/api'

export type Granularity = 'week' | 'month' | 'quarter'

// ─── Period helpers ───────────────────────────────────────────────────────────

export function toPeriodKey(dateStr: string, g: Granularity): string {
  const d = parseISO(dateStr)
  if (g === 'month')   return format(d, 'yyyy-MM')
  if (g === 'quarter') return `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`
  return dateStr // keep ISO for week — label separately
}

export function toPeriodLabel(key: string, g: Granularity): string {
  if (g === 'month')   return format(parseISO(key + '-01'), 'MMM yy')
  if (g === 'quarter') return key.replace('-', ' ')   // "2025 Q1"
  try { return format(parseISO(key), 'MMM d') } catch { return key }
}

// ─── Aggregators ──────────────────────────────────────────────────────────────

/** Roll up weekly TimeSeriesDataPoints into month/quarter buckets */
export function aggregateTimeSeries(raw: TimeSeriesDataPoint[], g: Granularity) {
  if (g === 'week') {
    return raw.map(d => ({
      date: format(parseISO(d.date), 'MMM d'),
      volume: d.volume,
      sentiment: parseFloat(d.sentiment.toFixed(1)),
      reviews_star_rating: parseFloat(d.reviews_star_rating.toFixed(2)),
    }))
  }

  const buckets: Record<string, { volume: number; sentSum: number; ratingSum: number; count: number }> = {}
  raw.forEach(d => {
    const key = toPeriodKey(d.date, g)
    if (!buckets[key]) buckets[key] = { volume: 0, sentSum: 0, ratingSum: 0, count: 0 }
    buckets[key].volume   += d.volume
    buckets[key].sentSum  += d.sentiment
    buckets[key].ratingSum += d.reviews_star_rating
    buckets[key].count++
  })

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => ({
      date: toPeriodLabel(key, g),
      volume: b.volume,
      sentiment: parseFloat((b.sentSum / b.count).toFixed(1)),
      reviews_star_rating: parseFloat((b.ratingSum / b.count).toFixed(2)),
    }))
}

/** Roll up brand time-series points (volume per brand) */
export function aggregateBrandSeries(
  points: { date: string; [brand: string]: number | string }[],
  brands: string[],
  g: Granularity
) {
  if (g === 'week') {
    return points.map(p => ({ ...p, date: toPeriodLabel(p.date as string, 'week') }))
  }

  const buckets: Record<string, Record<string, number>> = {}
  points.forEach(p => {
    const key = toPeriodKey(p.date as string, g)
    if (!buckets[key]) buckets[key] = {}
    brands.forEach(b => { buckets[key][b] = (buckets[key][b] || 0) + ((p[b] as number) || 0) })
  })

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({ date: toPeriodLabel(key, g), ...vals }))
}

/** Roll up star-rating stacked series (volume per star per week) */
export function aggregateStarSeries(
  points: { date: string; '1': number; '2': number; '3': number; '4': number; '5': number }[],
  g: Granularity
) {
  if (g === 'week') {
    return points.map(p => ({ ...p, date: toPeriodLabel(p.date, 'week') }))
  }

  const buckets: Record<string, { '1': number; '2': number; '3': number; '4': number; '5': number }> = {}
  points.forEach(p => {
    const key = toPeriodKey(p.date, g)
    if (!buckets[key]) buckets[key] = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    ;(['1', '2', '3', '4', '5'] as const).forEach(s => { buckets[key][s] += p[s] || 0 })
  })

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, vals]) => ({ date: toPeriodLabel(key, g), ...vals }))
}
