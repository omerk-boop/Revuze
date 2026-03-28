export type RangeType =
  | 'lastTwelveMonths'
  | 'lastSixMonths'
  | 'lastThreeMonths'
  | 'custom'
  | 'periodOverPeriod'

export interface DateRange {
  start_date: string
  end_date: string
  range_type: RangeType
}

export interface DashboardFilter {
  departments: string[]
  domains: string[]
  brand_names: string[]
  product_ids: string[]
  countries: string[]
  topics: string[]
  range: DateRange
  star_ratings: number[]
  pdp_star_rating: number[]
  incentivized: boolean
  organic: boolean
  syndicated: boolean
  native: boolean
  price: number[]
  keywords: string[]
  groups: string[]
  simple_search_boolean_expression: string | null
  excluded_fields: string[]
}

export type WidgetType = 'kpi_card' | 'time_series' | 'topics_table' | 'topics_scatter' | 'products_table' | 'brand_reviews_overtime' | 'stacked_bar' | 'star_rating_bar' | 'custom_chart'

export type KPIMetric =
  | 'sentiment'
  | 'volume'
  | 'reviews_star_rating'
  | 'pdp_star_rating'
  | 'products'
  | 'brands'

export interface KPICardConfig {
  metric: KPIMetric
}

export interface TimeSeriesConfig {
  metrics: ('sentiment' | 'volume' | 'reviews_star_rating')[]
}

export interface TopicsTableConfig {
  mode: 'growing' | 'decreasing' | 'all'
  limit?: number
}

export interface TopicsScatterConfig {
  limit?: number
}

export interface ProductsTableConfig {
  size?: number
  search?: string
}

export interface BrandReviewsOvertimeConfig {
  brands?: string[]
}

export interface StackedBarConfig {
  brands?: string[]
}

// star_rating_bar has no config — always shows all 5 star ratings
export interface StarRatingBarConfig {
  placeholder?: never
}

// custom_chart: AI-generated transform + declarative series spec
export type CustomChartEndpoint = 'key_metrics_overtime' | 'topics_trends' | 'statistics_totals' | 'products'

export interface CustomChartConfig {
  endpoint: CustomChartEndpoint
  // JS function body: receives `data` (raw API response) + `dateFns` ({format, parseISO})
  // Must return a DynamicChartSpec object
  transformCode: string
}

export type WidgetConfig = KPICardConfig | TimeSeriesConfig | TopicsTableConfig | TopicsScatterConfig | ProductsTableConfig | BrandReviewsOvertimeConfig | StackedBarConfig | StarRatingBarConfig | CustomChartConfig

export interface WidgetLayout {
  x: number
  y: number
  w: number
  h: number
}

export interface Widget {
  id: string
  type: WidgetType
  title: string
  layout: WidgetLayout
  config: WidgetConfig
  filter_overrides?: Partial<DashboardFilter>
}

export interface Dashboard {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
  filter: DashboardFilter
  compare_range: DateRange
  group_by_product_line: boolean
  widgets: Widget[]
}

export const DEFAULT_FILTER: DashboardFilter = {
  departments: [],
  domains: [],
  brand_names: [],
  product_ids: [],
  countries: [],
  topics: [],
  range: {
    start_date: '2025-03-01',
    end_date: '2026-02-28',
    range_type: 'lastTwelveMonths',
  },
  star_ratings: [],
  pdp_star_rating: [],
  incentivized: false,
  organic: false,
  syndicated: false,
  native: false,
  price: [],
  keywords: [],
  groups: [],
  simple_search_boolean_expression: null,
  excluded_fields: [],
}

export const DEFAULT_COMPARE_RANGE: DateRange = {
  start_date: '2024-03-01',
  end_date: '2025-02-28',
  range_type: 'periodOverPeriod',
}
