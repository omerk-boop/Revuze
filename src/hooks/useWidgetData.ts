import { useState, useEffect } from 'react'
import type { DashboardFilter, DateRange, Widget } from '../types/dashboard'
import {
  fetchStatisticsTotals,
  fetchKeyMetricsOvertime,
  fetchTopicsTrends,
} from '../services/api'

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
