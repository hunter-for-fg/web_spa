<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
defineProps<{ value: boolean }>()
</script>

<template>
  <span v-if="value" class="check_true"><span aria-hidden="true">&checkmark;</span><span class="visually_hidden">yes</span></span>
  <span v-else class="check_false"><span aria-hidden="true">&div;</span><span class="visually_hidden">no</span></span>
</template>

<style scoped>
.check_true {
  color: var(--color-ok);
}

.check_false {
  color: var(--color-bad);
}
</style>
