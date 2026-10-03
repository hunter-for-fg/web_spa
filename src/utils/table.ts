// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
// Sorting and filtering for the DataTable component.

export type CellValue = string | number | boolean | null | undefined

export interface Column<T> {
  key: string
  label: string
  /** Raw value used for sorting - and for display/filtering if no format is given. */
  value: (row: T) => CellValue
  /** Text displayed in the cell and used for text filtering. */
  format?: (value: CellValue, row: T) => string
  align?: 'right'
  sortable?: boolean // default true
  filterable?: boolean // default true
}

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  key: string
  direction: SortDirection
}

/** Filter value per column key. For boolean columns 'true' / 'false', else a case-insensitive substring. */
export type Filters = Record<string, string>

export function cellText<T>(column: Column<T>, row: T): string {
  const value = column.value(row)
  if (column.format) {
    return column.format(value, row)
  }
  return value === null || value === undefined ? '' : String(value)
}

export function isBooleanColumn<T>(column: Column<T>, rows: T[]): boolean {
  const first = rows.find((row) => column.value(row) !== null && column.value(row) !== undefined)
  return first !== undefined && typeof column.value(first) === 'boolean'
}

function compareValues(a: CellValue, b: CellValue): number {
  // empty values always last when ascending
  const aEmpty = a === null || a === undefined || a === ''
  const bEmpty = b === null || b === undefined || b === ''
  if (aEmpty || bEmpty) {
    return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b)
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

export function filterRows<T>(rows: T[], columns: Column<T>[], filters: Filters): T[] {
  const active = columns.filter((column) => (filters[column.key] ?? '').trim() !== '')
  if (active.length === 0) {
    return rows
  }
  return rows.filter((row) => active.every((column) => {
    const filter = (filters[column.key] ?? '').trim().toLowerCase()
    const value = column.value(row)
    if (typeof value === 'boolean' && (filter === 'true' || filter === 'false')) {
      return String(value) === filter
    }
    return cellText(column, row).toLowerCase().includes(filter)
  }))
}

/** Stable sort - rows with equal values keep the order of the REST API. */
export function sortRows<T>(rows: T[], columns: Column<T>[], sort: SortState | null): T[] {
  if (!sort) {
    return rows
  }
  const column = columns.find((c) => c.key === sort.key)
  if (!column) {
    return rows
  }
  const factor = sort.direction === 'asc' ? 1 : -1
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const aValue = column.value(a.row)
      const bValue = column.value(b.row)
      const aEmpty = aValue === null || aValue === undefined || aValue === ''
      const bEmpty = bValue === null || bValue === undefined || bValue === ''
      // empty values are always at the end - also when descending
      const result = aEmpty || bEmpty ? compareValues(aValue, bValue) : factor * compareValues(aValue, bValue)
      return result !== 0 ? result : a.index - b.index
    })
    .map(({ row }) => row)
}

/** Cycles none -> ascending -> descending -> none when clicking the same column. */
export function nextSort(current: SortState | null, key: string): SortState | null {
  if (!current || current.key !== key) {
    return { key, direction: 'asc' }
  }
  return current.direction === 'asc' ? { key, direction: 'desc' } : null
}
