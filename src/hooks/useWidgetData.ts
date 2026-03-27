import { useState, useEffect } from 'react'
import type { DashboardFilter, DateRange, Widget } from '../types/dashboard'
import {
  fetchStatisticsTotals,
  fetchKeyMetricsOvertime,
  fetchTopicsTrends,
  fetchProducts,
} from '../services/api'
import type { ProductsTableConfig, BrandReviewsOvertimeConfig } from '../types/dashboard'
import type { BrandTimeSeriesData } from '../types/api'

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
      case 'brand_reviews_overtime': {
        const cfg = widget.config as BrandReviewsOvertimeConfig
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
