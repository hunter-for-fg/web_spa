<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { formatUtcTime } from '@/utils/format'

defineProps<{ loading: boolean, lastFetched: Date | null }>()
defineEmits<{ refresh: [] }>()
</script>

<template>
  <div class="refresh_bar">
    <button type="button" class="button" :disabled="loading" @click="$emit('refresh')">Refresh</button>
    <!-- role status: changes are announced by screen readers -->
    <span role="status" class="muted">
      <template v-if="loading">Fetching data …</template>
      <template v-else-if="lastFetched">Last fetched at {{ formatUtcTime(lastFetched) }} UTC</template>
    </span>
  </div>
</template>

<style scoped>
.refresh_bar {
  display: flex;
  align-items: center;
  gap: var(--space);
  margin: var(--space) 0;
}
</style>
