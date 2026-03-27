import type { WidgetType, WidgetConfig } from '../types/dashboard'

export interface LibraryItem {
  id: string
  type: WidgetType
  name: string
  description: string
  category: 'kpi' | 'chart' | 'table'
  defaultW: number
  defaultH: number
  config: WidgetConfig
}

// Module-level mutable — avoids React re-renders during drag
let _current: LibraryItem | null = null
export const setDraggingItem = (item: LibraryItem | null) => { _current = item }
export const getDraggingItem = () => _current
