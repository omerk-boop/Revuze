import { useCallback } from 'react'
import GridLayout from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import { useToken } from '../../context/TokenContext'
import type { Dashboard, Widget, KPICardConfig, TimeSeriesConfig, TopicsTableConfig, TopicsScatterConfig } from '../../types/dashboard'
import type { StatisticsTotals, TimeSeriesResponse, TopicsTrendsResponse, ProductsResponse, BrandTimeSeriesData } from '../../types/api'
import { useWidgetData } from '../../hooks/useWidgetData'
import WidgetWrapper from '../widgets/WidgetWrapper'
import KPICard from '../widgets/KPICard'
import TimeSeriesChart from '../widgets/TimeSeriesChart'
import TopicsTable from '../widgets/TopicsTable'
import TopicsScatter from '../widgets/TopicsScatter'
import ProductsTable from '../widgets/ProductsTable'
import BrandReviewsChart from '../widgets/BrandReviewsChart'

import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface WidgetRendererProps {
  widget: Widget
  dashboard: Dashboard
  token: string | null
}

function WidgetRenderer({ widget, dashboard, token }: WidgetRendererProps) {
  const { data, loading, error } = useWidgetData(
    widget,
    dashboard.filter,
    dashboard.compare_range,
    token
  )

  const renderContent = () => {
    if (!data) return null
    switch (widget.type) {
      case 'kpi_card':
        return <KPICard data={data as StatisticsTotals} metric={(widget.config as KPICardConfig).metric} />
      case 'time_series':
        return (
          <TimeSeriesChart
            data={data as TimeSeriesResponse}
            metrics={(widget.config as TimeSeriesConfig).metrics}
          />
        )
      case 'topics_table':
        return <TopicsTable data={data as TopicsTrendsResponse} config={widget.config as TopicsTableConfig} />
      case 'topics_scatter':
        return (
          <TopicsScatter
            data={data as TopicsTrendsResponse}
            limit={(widget.config as TopicsScatterConfig).limit}
          />
        )
      case 'products_table':
        return <ProductsTable data={data as ProductsResponse} />
      case 'brand_reviews_overtime':
        return <BrandReviewsChart data={data as BrandTimeSeriesData} />
      default:
        return null
    }
  }

  return (
    <WidgetWrapper title={widget.title} type={widget.type} loading={loading} error={error}>
      {renderContent()}
    </WidgetWrapper>
  )
}

interface DashboardGridProps {
  dashboard: Dashboard
  onLayoutChange?: (widgets: Widget[]) => void
  editable?: boolean
}

export default function DashboardGrid({ dashboard, onLayoutChange, editable = false }: DashboardGridProps) {
  const token = useToken()

  const layout: Layout[] = dashboard.widgets.map((w) => ({
    i: w.id,
    x: w.layout.x,
    y: w.layout.y,
    w: w.layout.w,
    h: w.layout.h,
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

  if (dashboard.widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
        <p className="text-sm">Use the AI prompt above to generate your dashboard widgets.</p>
      </div>
    )
  }

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={80}
      width={1252}
      onLayoutChange={handleLayoutChange}
      isDraggable={editable}
      isResizable={editable}
      margin={[12, 12]}
      containerPadding={[0, 0]}
    >
      {dashboard.widgets.map((widget) => (
        <div key={widget.id}>
          <WidgetRenderer widget={widget} dashboard={dashboard} token={token} />
        </div>
      ))}
    </GridLayout>
  )
}
