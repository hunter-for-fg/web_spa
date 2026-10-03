<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<!-- A table with sorting (click on a column header) and filtering (inputs below the column headers).
     Cells can be customised with slots named cell-<column key>. -->
<script setup lang="ts" generic="T">
import { computed, reactive, ref, type VNode } from 'vue'

import {
  cellText, filterRows, isBooleanColumn, nextSort, sortRows,
  type CellValue, type Column, type Filters, type SortState,
} from '@/utils/table'

const props = defineProps<{
  rows: T[]
  columns: Column<T>[]
  rowKey?: (row: T, index: number) => string | number
}>()

defineSlots<{
  [name: `cell-${string}`]: (props: { row: T, value: CellValue, text: string }) => VNode[]
}>()

const sort = ref<SortState | null>(null)
const filters = reactive<Filters>(Object.fromEntries(props.columns.map((column) => [column.key, ''])))

const booleanColumns = computed(() => new Set(
  props.columns.filter((column) => isBooleanColumn(column, props.rows)).map((column) => column.key)))
const hasFilters = computed(() => props.columns.some((column) => column.filterable !== false))
const filterActive = computed(() => Object.values(filters).some((value) => value.trim() !== ''))
const displayedRows = computed(() => sortRows(filterRows(props.rows, props.columns, filters), props.columns,
                                              sort.value))

function toggleSort(column: Column<T>): void {
  if (column.sortable !== false) {
    sort.value = nextSort(sort.value, column.key)
  }
}

function ariaSort(column: Column<T>): 'ascending' | 'descending' | 'none' {
  if (sort.value?.key !== column.key) {
    return 'none'
  }
  return sort.value.direction === 'asc' ? 'ascending' : 'descending'
}

function sortIndicator(column: Column<T>): string {
  if (sort.value?.key !== column.key) {
    return column.sortable === false ? '' : '⇅'
  }
  return sort.value.direction === 'asc' ? '▲' : '▼'
}

function clearFilters(): void {
  for (const key of Object.keys(filters)) {
    filters[key] = ''
  }
}
</script>

<template>
  <p v-if="filterActive" role="status" class="muted filter_info">
    Showing {{ displayedRows.length }} of {{ rows.length }} rows.
    <button type="button" class="button" @click="clearFilters">Clear filters</button>
  </p>
  <!-- wide tables scroll horizontally within this container instead of widening the page -->
  <div class="table_scroll">
    <table class="data_table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" scope="col" :class="{ right: column.align === 'right' }"
              :aria-sort="ariaSort(column)">
            <template v-if="column.sortable === false">{{ column.label }}</template>
            <button v-else type="button" class="sort_button" :title="`Sort by ${column.label}`"
                    @click="toggleSort(column)">
              {{ column.label }} <span class="sort_indicator" aria-hidden="true">{{ sortIndicator(column) }}</span>
            </button>
          </th>
        </tr>
        <tr v-if="hasFilters" class="filter_row">
          <td v-for="column in columns" :key="column.key">
            <template v-if="column.filterable !== false">
              <select v-if="booleanColumns.has(column.key)" v-model="filters[column.key]"
                      :aria-label="`Filter ${column.label}`">
                <option value="">All</option>
                <option value="true">&checkmark; yes</option>
                <option value="false">&div; no</option>
              </select>
              <input v-else v-model="filters[column.key]" type="search" size="1" placeholder="Filter"
                     :aria-label="`Filter ${column.label}`">
            </template>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in displayedRows" :key="rowKey ? rowKey(row, index) : index">
          <td v-for="column in columns" :key="column.key" :class="{ right: column.align === 'right' }">
            <slot :name="`cell-${column.key}`" :row="row" :value="column.value(row)" :text="cellText(column, row)">
              {{ cellText(column, row) }}
            </slot>
          </td>
        </tr>
        <tr v-if="displayedRows.length === 0">
          <td :colspan="columns.length">No rows match the filter.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table_scroll {
  margin-top: calc(1.5 * var(--space));
  overflow-x: auto;
}

.data_table {
  width: 100%;
  border-collapse: collapse;
}

.data_table th, .data_table td {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  text-align: left;
}

.data_table th.right, .data_table td.right {
  text-align: right;
}

.data_table thead th, .data_table thead td {
  background-color: var(--color-border);
  color: var(--color-text);
}

.data_table thead th {
  padding-top: 0.75rem;
  padding-bottom: 0.5rem;
  white-space: nowrap;
}

/* the first row is shaded like in the Flask web-ui */
.data_table tbody tr:nth-child(odd) {
  background-color: var(--color-surface);
}

.data_table tbody tr:hover {
  background-color: #313036;
}

.sort_button {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.sort_indicator {
  font-size: smaller;
}

.filter_row td {
  padding-top: 0;
}

.filter_row input, .filter_row select {
  /* must not widen the columns - the column content decides the width */
  width: 100%;
  min-width: 3em;
  padding: 0.15rem 0.25rem;
}

.filter_info .button {
  margin-left: var(--space);
}
</style>
