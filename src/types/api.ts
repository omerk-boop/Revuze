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

export interface ProductItem {
  identity: string
  name: string
  brand: string
  sources: string[]
  image: string
  brand_image: string
  sentiment_data: { sentiment: number; sentiment_previous: number; change: number }
  reviews_data: { reviews: number; reviews_previous: number; change: number }
  reviews_star_rating: { avg: number; avg_previous: number; change: number }
  pdp_star_rating: number
  ratings_count: number
  department: string
  price: number
  product_url: string
}

export interface ProductsResponse {
  paging: {
    number_of_pages: number
    page_index: number
    page_size: number
    number_of_results: number
  }
  products: ProductItem[]
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
