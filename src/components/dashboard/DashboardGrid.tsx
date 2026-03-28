import { useCallback, useRef, useState, useEffect } from 'react'
import GridLayout from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import { useToken } from '../../context/TokenContext'
import type { Dashboard, Widget, KPICardConfig, TimeSeriesConfig, TopicsTableConfig, TopicsScatterConfig, CustomChartConfig, CustomTableConfig } from '../../types/dashboard'
import type { StatisticsTotals, TimeSeriesResponse, TopicsTrendsResponse, ProductsResponse, BrandTimeSeriesData, StarRatingTimeSeriesData } from '../../types/api'
import { type Granularity, aggregateTimeSeries, aggregateBrandSeries, aggregateStarSeries } from '../../utils/aggregateTimeSeries'
import { useWidgetData } from '../../hooks/useWidgetData'
import { getDraggingItem } from '../../utils/dragState'
import type { LibraryItem } from '../../utils/dragState'
import WidgetWrapper from '../widgets/WidgetWrapper'
import WidgetErrorBoundary from '../widgets/WidgetErrorBoundary'
import KPICard from '../widgets/KPICard'
import TimeSeriesChart from '../widgets/TimeSeriesChart'
import TopicsTable from '../widgets/TopicsTable'
import TopicsScatter from '../widgets/TopicsScatter'
import ProductsTable from '../widgets/ProductsTable'
import BrandReviewsChart from '../widgets/BrandReviewsChart'
import StackedBarChart from '../widgets/StackedBarChart'
import StarRatingBarChart from '../widgets/StarRatingBarChart'
import DynamicChart from '../widgets/DynamicChart'
import DynamicTable from '../widgets/DynamicTable'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// ─── Widget renderer ──────────────────────────────────────────────────────────

const GRANULARITY_TYPES = new Set<string>(['time_series', 'brand_reviews_overtime', 'stacked_bar', 'star_rating_bar'])

function WidgetRenderer({ widget, dashboard, token, onDelete }: { widget: Widget; dashboard: Dashboard; token: string | null; onDelete?: () => void }) {
  const { data, loading, error } = useWidgetData(widget, dashboard.filter, dashboard.compare_range, token)
  const [granularity, setGranularity] = useState<Granularity>('week')
  const supportsGranularity = GRANULARITY_TYPES.has(widget.type)

  const renderContent = () => {
    if (!data) return null
    switch (widget.type) {
      case 'kpi_card':
        return <KPICard data={data as StatisticsTotals} metric={(widget.config as KPICardConfig).metric} />
      case 'time_series': {
        const raw = data as TimeSeriesResponse
        const aggregated = { data: aggregateTimeSeries(raw.data ?? [], granularity) }
        return <TimeSeriesChart data={aggregated as TimeSeriesResponse} metrics={(widget.config as TimeSeriesConfig).metrics} />
      }
      case 'topics_table':
        return <TopicsTable data={data as TopicsTrendsResponse} config={widget.config as TopicsTableConfig} />
      case 'topics_scatter':
        return <TopicsScatter data={data as TopicsTrendsResponse} limit={(widget.config as TopicsScatterConfig).limit} />
      case 'products_table':
        return <ProductsTable data={data as ProductsResponse} />
      case 'brand_reviews_overtime': {
        const raw = data as BrandTimeSeriesData
        const aggregated: BrandTimeSeriesData = { brands: raw.brands, points: aggregateBrandSeries(raw.points, raw.brands, granularity) }
        return <BrandReviewsChart data={aggregated} />
      }
      case 'stacked_bar': {
        const raw = data as BrandTimeSeriesData
        const aggregated: BrandTimeSeriesData = { brands: raw.brands, points: aggregateBrandSeries(raw.points, raw.brands, granularity) }
        return <StackedBarChart data={aggregated} />
      }
      case 'star_rating_bar': {
        const raw = data as StarRatingTimeSeriesData
        const aggregated: StarRatingTimeSeriesData = { points: aggregateStarSeries(raw.points, granularity) }
        return <StarRatingBarChart data={aggregated} />
      }
      case 'custom_chart': {
        const cfg = widget.config as CustomChartConfig
        return <DynamicChart data={data} transformCode={cfg.transformCode} />
      }
      case 'custom_table': {
        const cfg = widget.config as CustomTableConfig
        return <DynamicTable data={data} transformCode={cfg.transformCode} />
      }
      default:
        return null
    }
  }

  return (
    <WidgetErrorBoundary title={widget.title} onDelete={onDelete}>
      <WidgetWrapper
        title={widget.title}
        type={widget.type}
        loading={loading}
        error={error}
        onDelete={onDelete}
        granularity={supportsGranularity ? granularity : undefined}
        onGranularityChange={supportsGranularity ? setGranularity : undefined}
      >
        {renderContent()}
      </WidgetWrapper>
    </WidgetErrorBoundary>
  )
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface DashboardGridProps {
  dashboard: Dashboard
  onLayoutChange?: (widgets: Widget[]) => void
  onWidgetDrop?: (item: LibraryItem, x: number, y: number) => void
  onWidgetDelete?: (id: string) => void
  editable?: boolean
}

export default function DashboardGrid({
  dashboard,
  onLayoutChange,
  onWidgetDrop,
  onWidgetDelete,
  editable = false,
}: DashboardGridProps) {
  const token = useToken()
  const containerRef = useRef<HTMLDivElement>(null)
  const [gridWidth, setGridWidth] = useState(1200)

  // Measure container width so the grid fills its parent (adjusts when sidebar opens/closes)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setGridWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const layout: Layout[] = dashboard.widgets.map((w) => ({
    i: w.id,
    x: w.layout?.x ?? 0,
    y: w.layout?.y ?? 0,
    w: w.layout?.w ?? 6,
    h: w.layout?.h ?? 3,
    static: !editable,
  }))

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (!onLayoutChange) return
      const updatedWidgets = dashboard.widgets.map((widget) => {
        const newPos = newLayout.find((l) => l.i === widget.id)
        if (!newPos) return widget
        return { ...widget, layout: { x: newPos.x, y: newPos.y, w: newPos.w, h: newPos.h } }
      })
      onLayoutChange(updatedWidgets)
    },
    [dashboard.widgets, onLayoutChange]
  )

  const handleDrop = useCallback(
    (_layout: Layout[], item: Layout, _e: MouseEvent) => {
      const libItem = getDraggingItem()
      if (!libItem || !onWidgetDrop) return
      onWidgetDrop(libItem, item.x, item.y)
    },
    [onWidgetDrop]
  )

  const handleDropDragOver = useCallback(() => {
    const item = getDraggingItem()
    return item ? { w: item.defaultW, h: item.defaultH } : { w: 3, h: 2 }
  }, [])

  const emptyCanvas = dashboard.widgets.length === 0

  return (
    <div ref={containerRef} className="w-full">
      {emptyCanvas ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 bg-white/50">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Your canvas is empty</p>
            <p className="text-xs text-slate-400 mt-1">Drag widgets from the library or use the AI prompt to get started</p>
          </div>
        </div>
      ) : (
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={80}
          width={gridWidth}
          onLayoutChange={handleLayoutChange}
          isDraggable={editable}
          isResizable={editable}
          isDroppable={editable}
          droppingItem={{ i: '__dropping__', w: 3, h: 2 }}
          onDrop={handleDrop}
          onDropDragOver={handleDropDragOver}
          margin={[12, 12]}
          containerPadding={[0, 0]}
        >
          {dashboard.widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetRenderer
                widget={widget}
                dashboard={dashboard}
                token={token}
                onDelete={onWidgetDelete ? () => onWidgetDelete(widget.id) : undefined}
              />
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  )
}
