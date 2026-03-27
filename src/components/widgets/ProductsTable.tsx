import type { ProductsResponse } from '../../types/api'

interface ProductsTableProps {
  data: ProductsResponse
}

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-slate-400 text-xs">—</span>
  const positive = value > 0
  return (
    <span className={`text-xs font-medium ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-amber-400 text-sm">★</span>
      <span className="text-xs font-medium text-slate-700">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function ProductsTable({ data }: ProductsTableProps) {
  const { products, paging } = data

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No products found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="overflow-auto flex-1">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-3 font-semibold text-slate-500 whitespace-nowrap">Product</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-500 whitespace-nowrap">Brand</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-500 whitespace-nowrap">Reviews</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-500 whitespace-nowrap">Star Rating</th>
              <th className="text-right py-2 px-3 font-semibold text-slate-500 whitespace-nowrap">Sentiment</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.identity} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-2 px-3 max-w-[200px]">
                  <div className="flex items-center gap-2">
                    {p.image && (
                      <img
                        src={p.image}
                        alt=""
                        className="w-7 h-7 rounded object-cover shrink-0 bg-slate-100"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )}
                    <span className="truncate text-slate-800 font-medium" title={p.name}>{p.name}</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{p.brand}</td>
                <td className="py-2 px-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-slate-800">{p.reviews_data.reviews.toLocaleString()}</span>
                    <TrendBadge value={p.reviews_data.change} />
                  </div>
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex flex-col items-end">
                    <Stars rating={p.reviews_star_rating.avg} />
                    <TrendBadge value={p.reviews_star_rating.change} />
                  </div>
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-slate-800">{p.sentiment_data.sentiment}%</span>
                    <TrendBadge value={p.sentiment_data.change} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paging.number_of_results > products.length && (
        <div className="px-3 py-1.5 border-t border-slate-100 text-xs text-slate-400 shrink-0">
          Showing {products.length} of {paging.number_of_results.toLocaleString()} products
        </div>
      )}
    </div>
  )
}
