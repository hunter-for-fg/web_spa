import { describe, expect, it } from 'vitest'

import { filterRows, isBooleanColumn, nextSort, sortRows, type Column } from '@/utils/table'

interface Row {
  name: string
  alt: number
  shooting: boolean
  stopped: string | null
}

const rows: Row[] = [
  { name: 'OPFOR10', alt: 100.7, shooting: true, stopped: '2026-09-28T00:23:02+00:00' },
  { name: 'opfor2', alt: -5, shooting: false, stopped: null },
  { name: 'EAGLE01', alt: 3000, shooting: true, stopped: '2026-09-27T00:00:00+00:00' },
]

const columns: Column<Row>[] = [
  { key: 'name', label: 'Name', value: (r) => r.name },
  { key: 'alt', label: 'Alt', value: (r) => r.alt, format: (v) => String(Math.trunc(v as number)) },
  { key: 'shooting', label: 'Shooting', value: (r) => r.shooting },
  { key: 'stopped', label: 'Stopped', value: (r) => r.stopped },
]

const names = (result: Row[]): string[] => result.map((r) => r.name)

describe('table', () => {
  it('cycles the sort state', () => {
    expect(nextSort(null, 'name')).toEqual({ key: 'name', direction: 'asc' })
    expect(nextSort({ key: 'name', direction: 'asc' }, 'name')).toEqual({ key: 'name', direction: 'desc' })
    expect(nextSort({ key: 'name', direction: 'desc' }, 'name')).toBeNull()
    expect(nextSort({ key: 'name', direction: 'desc' }, 'alt')).toEqual({ key: 'alt', direction: 'asc' })
  })

  it('sorts strings naturally and case-insensitive', () => {
    expect(names(sortRows(rows, columns, { key: 'name', direction: 'asc' }))).toEqual(['EAGLE01', 'opfor2', 'OPFOR10'])
  })

  it('sorts numbers numerically', () => {
    expect(names(sortRows(rows, columns, { key: 'alt', direction: 'desc' }))).toEqual(['EAGLE01', 'OPFOR10', 'opfor2'])
  })

  it('keeps empty values at the end in both directions', () => {
    expect(names(sortRows(rows, columns, { key: 'stopped', direction: 'asc' }))).toEqual(['EAGLE01', 'OPFOR10', 'opfor2'])
    expect(names(sortRows(rows, columns, { key: 'stopped', direction: 'desc' }))).toEqual(['OPFOR10', 'EAGLE01', 'opfor2'])
  })

  it('keeps the original order without sort and for equal values', () => {
    expect(sortRows(rows, columns, null)).toBe(rows)
    expect(names(sortRows(rows, columns, { key: 'shooting', direction: 'desc' }))).toEqual(['OPFOR10', 'EAGLE01', 'opfor2'])
  })

  it('filters by case-insensitive substring of the displayed text', () => {
    expect(names(filterRows(rows, columns, { name: 'opfor' }))).toEqual(['OPFOR10', 'opfor2'])
    expect(names(filterRows(rows, columns, { alt: '100' }))).toEqual(['OPFOR10']) // displayed text, not 100.7
    expect(filterRows(rows, columns, { name: '  ' })).toBe(rows)
  })

  it('filters booleans and combines filters', () => {
    expect(names(filterRows(rows, columns, { shooting: 'false' }))).toEqual(['opfor2'])
    expect(names(filterRows(rows, columns, { shooting: 'true', name: 'opfor' }))).toEqual(['OPFOR10'])
  })

  it('detects boolean columns', () => {
    expect(isBooleanColumn(columns[2]!, rows)).toBe(true)
    expect(isBooleanColumn(columns[0]!, rows)).toBe(false)
  })
})
