<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { onMounted } from 'vue'

import { fetchSessions } from '@/api/client'
import type { HunterSession } from '@/api/types'
import DataTable from '@/components/DataTable.vue'
import RefreshBar from '@/components/RefreshBar.vue'
import { useApiData } from '@/composables/useApiData'
import { SESSION_ID_PARAM } from '@/composables/useSessionPage'
import { formatUtc } from '@/utils/format'
import type { Column } from '@/utils/table'

defineProps<{ title: string }>()

const { data: sessions, loading, error, lastFetched, load } = useApiData(fetchSessions)

onMounted(load)

const columns: Column<HunterSession>[] = [
  { key: 'session_id', label: 'ID', value: (s) => s.session_id },
  { key: 'scenario_name', label: 'Scenario Name', value: (s) => s.scenario_name },
  { key: 'mp_server_host', label: 'MP Server Host', value: (s) => s.mp_server_host },
  { key: 'started_dt', label: 'Started At (UTC)', value: (s) => s.started_dt, format: (v) => formatUtc(v as string) },
  { key: 'stopped_dt', label: 'Stopped At (UTC)', value: (s) => s.stopped_dt, format: (v) => formatUtc(v as string) },
]
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <RefreshBar :loading="loading" :last-fetched="lastFetched" @refresh="load" />
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <template v-if="sessions">
      <template v-if="sessions.length">
        <p>Choose a session by clicking on the link in column "ID".</p>
        <DataTable :rows="sessions" :columns="columns" :row-key="(s) => s.session_id">
          <template #cell-session_id="{ text }">
            <RouterLink :to="{ path: '/ongoing_session/current_session', query: { [SESSION_ID_PARAM]: text } }">
              {{ text }}
            </RouterLink>
          </template>
        </DataTable>
      </template>
      <p v-else>There are no registered sessions.</p>
    </template>
  </div>
</template>
