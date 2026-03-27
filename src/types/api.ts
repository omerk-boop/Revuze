export interface StatisticsTotals {
  sentiment: number
  sentiment_trend: number
  volume: number
  volume_trend: number
  reviews_star_rating: number
  reviews_star_rating_trend: number
  products: number
  brands: number
  pdp_star_rating: number
  pdp_star_rating_trend: number
}

export interface TimeSeriesDataPoint {
  date: string
  volume: number
  reviews_star_rating: number
  sentiment: number
}

export interface TimeSeriesResponse {
  data: TimeSeriesDataPoint[]
}

export interface TopicDataPoint {
  identity: string
  name: string
  volume: number
  volume_trend: number
  volume_trend_delta: number
  volume_trend_period: number
  sentiment: number
  sentiment_trend: number
  reviews_star_rating: number
  promoted_volume_proportion: number
}

export interface TopicsTrendsResponse {
  growing: { data: TopicDataPoint[] }
  decreasing: { data: TopicDataPoint[] }
  total_sentiment: number
}

export interface CatalogTotals {
  topics: string[]
  countries: string[]
  max_price: number
  domains_countries: { domain: string; country: string; domain_language: string }[]
  domains: string[]
  departments: string[]
  groups: { group_name: string; group_tag: string }[]
}
