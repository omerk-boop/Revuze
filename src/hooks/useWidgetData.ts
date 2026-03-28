import { useState, useEffect } from 'react'
import { parseISO, startOfMonth, endOfMonth, addMonths, format, isAfter } from 'date-fns'
import type { DashboardFilter, DateRange, Widget } from '../types/dashboard'
import {
  fetchStatisticsTotals,
  fetchKeyMetricsOvertime,
  fetchTopicsTrends,
  fetchProducts,
} from '../services/api'
import type { ProductsTableConfig, BrandReviewsOvertimeConfig, StackedBarConfig, CustomChartConfig, CustomTableConfig } from '../types/dashboard'
import type { BrandTimeSeriesData, StarRatingTimeSeriesData } from '../types/api'

interface WidgetDataState<T = unknown> {
  data: T | null
  loading: boolean
  error: string | null
}

export const useWidgetData = (
  widget: Widget,
  filter: DashboardFilter,
  compareRange: DateRange,
  token: string | null
) => {
  const [state, setState] = useState<WidgetDataState>({ data: null, loading: true, error: null })

  useEffect(() => {
    if (!token) {
      setState({ data: null, loading: false, error: 'Not authenticated' })
      return
    }

    const effectiveFilter: DashboardFilter = {
      ...filter,
      ...(widget.filter_overrides || {}),
    }

    const body = {
      filter: effectiveFilter,
      compare_range: compareRange,
      group_by_product_line: false,
    }

    setState({ data: null, loading: true, error: null })

    let fetchFn: Promise<unknown>

    switch (widget.type) {
      case 'kpi_card':
        fetchFn = fetchStatisticsTotals(body)
        break
      case 'time_series':
        fetchFn = fetchKeyMetricsOvertime(body)
        break
      case 'topics_table':
      case 'topics_scatter':
        fetchFn = fetchTopicsTrends(body)
        break
      case 'products_table': {
        const cfg = widget.config as ProductsTableConfig
        fetchFn = fetchProducts({ ...body, size: cfg.size ?? 20, search: cfg.search })
        break
      }
      case 'brand_reviews_overtime':
      case 'stacked_bar': {
        const cfg = widget.config as BrandReviewsOvertimeConfig | StackedBarConfig
        const brandsToFetch = cfg.brands?.length ? cfg.brands : effectiveFilter.brand_names
        if (!brandsToFetch.length) {
          setState({ data: { brands: [], points: [] } as BrandTimeSeriesData, loading: false, error: null })
          return
        }
        fetchFn = Promise.all(
          brandsToFetch.map((brand) =>
            fetchKeyMetricsOvertime({ ...body, filter: { ...effectiveFilter, brand_names: [brand] } })
              .then((r) => ({ brand, series: r.data ?? [] }))
          )
        ).then((results) => {
          const dateMap: Record<string, Record<string, number>> = {}
          results.forEach(({ brand, series }) => {
            series.forEach((pt) => {
              if (!dateMap[pt.date]) dateMap[pt.date] = {}
              dateMap[pt.date][brand] = pt.volume
            })
          })
          const points = Object.entries(dateMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, values]) => ({ date, ...values }))
          return { brands: brandsToFetch, points } as BrandTimeSeriesData
        })
        break
      }
      case 'custom_chart':
      case 'custom_table': {
        const cfg = widget.config as CustomChartConfig | CustomTableConfig
        if (cfg.endpoint === 'products_monthly') {
          // One products call per calendar month in the filter range
          const rangeStart = parseISO(effectiveFilter.range.start_date)
          const rangeEnd   = parseISO(effectiveFilter.range.end_date)
          const months: string[] = []
          let cur = startOfMonth(rangeStart)
          while (!isAfter(cur, startOfMonth(rangeEnd))) {
            months.push(format(cur, 'yyyy-MM'))
            cur = addMonths(cur, 1)
          }
          fetchFn = Promise.all(
            months.map((month) => {
              const mStart = `${month}-01`
              const mEnd   = format(endOfMonth(parseISO(mStart)), 'yyyy-MM-dd')
              const mFilter = { ...effectiveFilter, range: { start_date: mStart, end_date: mEnd, range_type: 'custom' as const } }
              return fetchProducts({ ...body, filter: mFilter, size: 100 })
                .then((r) => ({ month, products: r.products }))
            })
          ).then((results) => {
            const byMonth: Record<string, typeof results[0]['products']> = {}
            results.forEach(({ month, products }) => { byMonth[month] = products })
            return { months, byMonth }
          })
        } else {
          switch (cfg.endpoint) {
            case 'key_metrics_overtime': fetchFn = fetchKeyMetricsOvertime(body); break
            case 'topics_trends':        fetchFn = fetchTopicsTrends(body); break
            case 'statistics_totals':    fetchFn = fetchStatisticsTotals(body); break
            case 'products':             fetchFn = fetchProducts({ ...body, size: 50 }); break
            default:                     fetchFn = fetchKeyMetricsOvertime(body)
          }
        }
        break
      }
      case 'star_rating_bar': {
        // Make one call per star rating and combine into stacked series
        fetchFn = Promise.all(
          ([1, 2, 3, 4, 5] as const).map((star) =>
            fetchKeyMetricsOvertime({ ...body, filter: { ...effectiveFilter, star_ratings: [star] } })
              .then((r) => ({ star, series: r.data ?? [] }))
          )
        ).then((results) => {
          const dateMap: Record<string, Record<string, number>> = {}
          results.forEach(({ star, series }) => {
            series.forEach((pt) => {
              if (!dateMap[pt.date]) dateMap[pt.date] = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
              dateMap[pt.date][String(star)] = pt.volume
            })
          })
          const points = Object.entries(dateMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, vals]) => ({ date, ...vals }))
          return { points } as StarRatingTimeSeriesData
        })
        break
      }
      default:
        return
    }

    fetchFn
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) =>
        setState({ data: null, loading: false, error: err.response?.data?.detail || err.message })
      )
  }, [widget.type, JSON.stringify(widget.filter_overrides), JSON.stringify(filter), JSON.stringify(compareRange), token])

  return state
}
