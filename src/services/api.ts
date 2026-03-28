import axios from 'axios'
import type { DashboardFilter, DateRange } from '../types/dashboard'
import type { StatisticsTotals, TimeSeriesResponse, TopicsTrendsResponse, CatalogTotals, ProductsResponse } from '../types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ci-hub-be.stg.revuze.it'

let authToken: string | null = null

export const setAuthToken = (token: string) => {
  authToken = token
}

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

export interface ApiRequestBody {
  filter: DashboardFilter
  compare_range: DateRange
  group_by_product_line: boolean
}

export const fetchStatisticsTotals = (body: ApiRequestBody): Promise<StatisticsTotals> =>
  client.post('/statistics/totals', body).then((r) => r.data)

export const fetchKeyMetricsOvertime = (body: ApiRequestBody): Promise<TimeSeriesResponse> =>
  client.post('/key-metrics/overtime/week', body).then((r) => r.data)

export const fetchTopicsTrends = (body: ApiRequestBody): Promise<TopicsTrendsResponse> =>
  client.post('/topics/trends', body).then((r) => r.data)

export const fetchCatalogTotals = (body: {
  filter: {
    range: { start_date: string; end_date: string }
    departments?: string[]
  }
}): Promise<CatalogTotals> => client.post('/catalog/totals', body).then((r) => r.data)

export const fetchProducts = (
  body: ApiRequestBody & { page_index?: number; size?: number; search?: string }
): Promise<ProductsResponse> => client.post('/products/', body).then((r) => r.data)
