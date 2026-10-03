<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<!-- Shows the state of a session page; the page content (default slot) is only shown when a session is loaded. -->
<script setup lang="ts">
import type { HunterSession } from '@/api/types'
import RefreshBar from './RefreshBar.vue'

defineProps<{
  session: HunterSession | null
  invalidSession: boolean
  loading: boolean
  error: string | null
  lastFetched: Date | null
}>()
defineEmits<{ refresh: [] }>()
</script>

<template>
  <p v-if="invalidSession">
    Somehow you managed to choose an invalid session.
    Choose a different session: <RouterLink to="/ongoing_session/sessions_list">List of available Sessions</RouterLink>
  </p>
  <template v-else>
    <RefreshBar :loading="loading" :last-fetched="lastFetched" @refresh="$emit('refresh')" />
    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <slot v-if="session" />
  </template>
</template>
