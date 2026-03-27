import type { Dashboard } from '../types/dashboard'

const STORAGE_KEY = 'revuze_dashboards'

export const getDashboards = (): Dashboard[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveDashboard = (dashboard: Dashboard): void => {
  const dashboards = getDashboards()
  const idx = dashboards.findIndex((d) => d.id === dashboard.id)
  if (idx >= 0) {
    dashboards[idx] = dashboard
  } else {
    dashboards.push(dashboard)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards))
}

export const deleteDashboard = (id: string): void => {
  const dashboards = getDashboards().filter((d) => d.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards))
}

export const getDashboard = (id: string): Dashboard | undefined =>
  getDashboards().find((d) => d.id === id)
