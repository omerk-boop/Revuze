import { useState, useEffect } from 'react'
import { useToken } from '../context/TokenContext'
import { fetchProducts } from '../services/api'
import { DEFAULT_COMPARE_RANGE } from '../types/dashboard'
import type { DateRange } from '../types/dashboard'

export const useBrands = (range: DateRange): { brands: string[]; loading: boolean } => {
  const token = useToken()
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchProducts({
      filter: {
        departments: [], domains: [], brand_names: [], product_ids: [],
        countries: [], topics: [], range,
        star_ratings: [], pdp_star_rating: [], incentivized: false, organic: false,
        syndicated: false, native: false, price: [], keywords: [], groups: [],
        simple_search_boolean_expression: null, excluded_fields: [],
      },
      compare_range: DEFAULT_COMPARE_RANGE,
      group_by_product_line: false,
      size: 200,
      page_index: 0,
    })
      .then((r) => {
        const unique = [...new Set(r.products.map((p) => p.brand))]
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b))
        setBrands(unique)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, range.start_date, range.end_date])

  return { brands, loading }
}
