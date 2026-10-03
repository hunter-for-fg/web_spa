<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { fetchPositions } from '@/api/client'
import type { PositionUpdate } from '@/api/types'
import DataTable from '@/components/DataTable.vue'
import SessionPageStatus from '@/components/SessionPageStatus.vue'
import { useSessionPage } from '@/composables/useSessionPage'
import { metresToFeet, toInt } from '@/utils/format'
import type { CellValue, Column } from '@/utils/table'

defineProps<{ title: string }>()

const { session, data: positions, invalidSession, loading, error, lastFetched, refresh } = useSessionPage(
  fetchPositions)

const fixed5 = (value: CellValue): string => (value as number).toFixed(5)
const integer = (value: CellValue): string => String(toInt(value as number))

const columns: Column<PositionUpdate>[] = [
  { key: 'callsign', label: 'Callsign', value: (p) => p.callsign },
  { key: 'kind', label: 'Kind', value: (p) => p.kind },
  { key: 'health', label: 'Health', value: (p) => p.health_name },
  { key: 'lon', label: 'Lon', value: (p) => p.lon, format: fixed5 },
  { key: 'lat', label: 'Lat', value: (p) => p.lat, format: fixed5 },
  { key: 'alt_m', label: 'Altitude [m]', value: (p) => p.alt_m, format: integer, align: 'right' },
  { key: 'alt_ft', label: 'Altitude [ft]', value: (p) => metresToFeet(p.alt_m), format: integer, align: 'right' },
  { key: 'heading', label: 'Heading', value: (p) => p.heading, format: integer, align: 'right' },
  { key: 'speed', label: 'Speed', value: (p) => p.speed, format: integer, align: 'right' },
]
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <SessionPageStatus :session="session" :invalid-session="invalidSession" :loading="loading" :error="error"
                       :last-fetched="lastFetched" @refresh="refresh">
      <DataTable v-if="positions?.length" :rows="positions" :columns="columns" :row-key="(p) => p.callsign" />
      <p v-else>There are no registered positions in the current session.</p>
    </SessionPageStatus>
  </div>
</template>
