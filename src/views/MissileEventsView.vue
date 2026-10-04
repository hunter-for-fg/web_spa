<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { fetchMissileEvents } from '@/api/client'
import type { MissileEvent } from '@/api/types'
import DataTable from '@/components/DataTable.vue'
import SessionPageStatus from '@/components/SessionPageStatus.vue'
import { useSessionPage } from '@/composables/useSessionPage'
import { formatUtc } from '@/utils/format'
import type { Column } from '@/utils/table'

defineProps<{ title: string }>()

const { session, data: events, invalidSession, loading, error, lastFetched, refresh } = useSessionPage(
  fetchMissileEvents)

const columns: Column<MissileEvent>[] = [
  { key: 'attacker', label: 'Attacker', value: (e) => e.attacker },
  { key: 'target', label: 'Target', value: (e) => e.target },
  { key: 'unique_id', label: 'Missile ID', value: (e) => e.unique_id },
  { key: 'telemetry', label: 'Telemetry', value: (e) => e.telemetry_string },
  { key: 'time', label: 'Time', value: (e) => e.event_time, format: (v) => formatUtc(v as string) },
]
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <SessionPageStatus :session="session" :invalid-session="invalidSession" :loading="loading" :error="error"
                       :last-fetched="lastFetched" @refresh="refresh">
      <DataTable v-if="events?.length" :rows="events" :columns="columns" />
      <p v-else>There are no registered missile events in the current session.</p>
    </SessionPageStatus>
  </div>
</template>
