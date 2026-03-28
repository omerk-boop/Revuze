import { useState, useEffect } from 'react'
import { useToken } from '../context/TokenContext'
import { fetchCatalogTotals } from '../services/api'
import type { DateRange } from '../types/dashboard'

export interface GroupOption {
  group_name: string
  group_tag: string
}

export interface CatalogOptions {
  departments: string[]
  groups: GroupOption[]
  loading: boolean
}

/**
 * Fetches available departments (categories) and groups (sub-categories) from the catalog API.
 * When `selectedDepartments` is non-empty the groups are re-fetched filtered to those departments.
 */
export function useCatalogOptions(range: DateRange, selectedDepartments: string[]): CatalogOptions {
  const token = useToken()
  const [departments, setDepartments] = useState<string[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [loading, setLoading] = useState(false)

  // Departments list never changes based on selection — fetch once per range
  useEffect(() => {
    if (!token) return
    fetchCatalogTotals({ filter: { range: { start_date: range.start_date, end_date: range.end_date } } })
      .then((data) => setDepartments((data.departments ?? []).sort()))
      .catch(() => {})
  }, [token, range.start_date, range.end_date])

  // Groups re-fetch when departments selection changes
  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetchCatalogTotals({
      filter: {
        range: { start_date: range.start_date, end_date: range.end_date },
        ...(selectedDepartments.length > 0 ? { departments: selectedDepartments } : {}),
      },
    })
      .then((data) => setGroups(Array.isArray(data.groups) ? data.groups : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, range.start_date, range.end_date, selectedDepartments.join(',')])

  return { departments, groups, loading }
}
