import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Dashboard } from '../types/dashboard'
import { DEFAULT_FILTER, DEFAULT_COMPARE_RANGE } from '../types/dashboard'
import { getDashboards, saveDashboard, deleteDashboard } from '../services/storage'

export const useDashboards = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>(() => getDashboards())

  const refresh = useCallback(() => setDashboards(getDashboards()), [])

  const createDashboard = useCallback((partial: Partial<Dashboard>): Dashboard => {
    const now = new Date().toISOString()
    const dashboard: Dashboard = {
      id: uuidv4(),
      name: 'New Dashboard',
      description: '',
      created_at: now,
      updated_at: now,
      filter: DEFAULT_FILTER,
      compare_range: DEFAULT_COMPARE_RANGE,
      group_by_product_line: false,
      widgets: [],
      ...partial,
    }
    saveDashboard(dashboard)
    refresh()
    return dashboard
  }, [refresh])

  const updateDashboard = useCallback(
    (dashboard: Dashboard) => {
      const updated = { ...dashboard, updated_at: new Date().toISOString() }
      saveDashboard(updated)
      refresh()
      return updated
    },
    [refresh]
  )

  const removeDashboard = useCallback(
    (id: string) => {
      deleteDashboard(id)
      refresh()
    },
    [refresh]
  )

  return { dashboards, createDashboard, updateDashboard, removeDashboard, refresh }
}
