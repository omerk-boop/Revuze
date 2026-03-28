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
  /** True once departments have been loaded at least once — never goes back to false. */
  hasCategoryData: boolean
}

/**
 * Fetches available departments (categories) and groups (sub-categories) from the catalog API.
 * When `selectedDepartments` is non-empty the groups are re-fetched filtered to those departments.
 *
 * `hasCategoryData` is a one-way latch: it goes true when the first non-empty departments
 * response arrives and stays true for the lifetime of the component. This prevents the
 * Category/Sub-category row from disappearing if a subsequent re-fetch returns empty
 * (e.g. during a range change before the new response arrives).
 */
export function useCatalogOptions(range: DateRange, selectedDepartments: string[]): CatalogOptions {
  const token = useToken()
  const [departments, setDepartments] = useState<string[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [loading, setLoading] = useState(false)
  const [hasCategoryData, setHasCategoryData] = useState(false)

  // Departments list is not affected by selection — fetch once per range change
  useEffect(() => {
    if (!token) return
    fetchCatalogTotals({ filter: { range: { start_date: range.start_date, end_date: range.end_date } } })
      .then((data) => {
        const deps = Array.isArray(data.departments) ? [...data.departments].sort() : []
        setDepartments(deps)
        if (deps.length > 0) setHasCategoryData(true)
      })
      .catch(() => {})
  }, [token, range.start_date, range.end_date])

  // Groups re-fetch when departments selection or range changes
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

  return { departments, groups, loading, hasCategoryData }
}
