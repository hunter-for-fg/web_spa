<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { fetchAttackerEvents } from '@/api/client'
import type { AttackerEvent } from '@/api/types'
import CheckMark from '@/components/CheckMark.vue'
import DataTable from '@/components/DataTable.vue'
import SessionPageStatus from '@/components/SessionPageStatus.vue'
import { useSessionPage } from '@/composables/useSessionPage'
import { formatUtc } from '@/utils/format'
import type { Column } from '@/utils/table'

defineProps<{ title: string }>()

const { session, data: events, invalidSession, loading, error, lastFetched, refresh } = useSessionPage(
  fetchAttackerEvents)

const columns: Column<AttackerEvent>[] = [
  { key: 'callsign', label: 'Callsign', value: (e) => e.callsign },
  { key: 'kind', label: 'Kind', value: (e) => e.kind },
  { key: 'has_opfor_iff', label: 'Has OPFOR IFF', value: (e) => e.has_opfor_iff },
  { key: 'trigger', label: 'Trigger', value: (e) => e.trigger_name },
  { key: 'time', label: 'Time', value: (e) => e.event_time, format: (v) => formatUtc(v as string) },
]
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <SessionPageStatus :session="session" :invalid-session="invalidSession" :loading="loading" :error="error"
                       :last-fetched="lastFetched" @refresh="refresh">
      <DataTable v-if="events?.length" :rows="events" :columns="columns">
        <template #cell-has_opfor_iff="{ value }"><CheckMark :value="value === true" /></template>
      </DataTable>
      <p v-else>There are no registered attacker events in the current session.</p>
    </SessionPageStatus>
  </div>
</template>
