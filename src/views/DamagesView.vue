<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { fetchDamages } from '@/api/client'
import type { DamageResult } from '@/api/types'
import CheckMark from '@/components/CheckMark.vue'
import DataTable from '@/components/DataTable.vue'
import SessionPageStatus from '@/components/SessionPageStatus.vue'
import { useSessionPage } from '@/composables/useSessionPage'
import { formatUtc } from '@/utils/format'
import type { Column } from '@/utils/table'

defineProps<{ title: string }>()

const { session, data: damages, invalidSession, loading, error, lastFetched, refresh } = useSessionPage(fetchDamages)

const columns: Column<DamageResult>[] = [
  { key: 'health', label: 'Result', value: (d) => d.health_name },
  { key: 'weapon_type', label: 'Weapon type', value: (d) => d.weapon_type_name },
  { key: 'weapon_name', label: 'Weapon name', value: (d) => d.weapon_name },
  { key: 'attacker', label: 'Attacker', value: (d) => d.attacker },
  { key: 'attacker_kind', label: 'Attacker Kind', value: (d) => d.attacker_kind },
  { key: 'target', label: 'Target', value: (d) => d.target },
  { key: 'target_kind', label: 'Target Kind', value: (d) => d.target_kind },
  { key: 'shooting', label: 'Shooting?', value: (d) => d.shooting },
  { key: 'civilian', label: 'Civilian?', value: (d) => d.is_civilian },
  { key: 'time', label: 'Time', value: (d) => d.damage_time, format: (v) => formatUtc(v as string) },
]
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <SessionPageStatus :session="session" :invalid-session="invalidSession" :loading="loading" :error="error"
                       :last-fetched="lastFetched" @refresh="refresh">
      <DataTable v-if="damages?.length" :rows="damages" :columns="columns">
        <template #cell-shooting="{ value }"><CheckMark :value="value === true" /></template>
        <template #cell-civilian="{ value }"><CheckMark :value="value === true" /></template>
      </DataTable>
      <p v-else>There are no registered hits in the current session.</p>
    </SessionPageStatus>
  </div>
</template>
