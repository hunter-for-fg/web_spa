<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
</script>

<template>
  <header class="page_header">
    <NavBar />
  </header>

  <main class="page_main">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" :title="route.meta.title" />
    </RouterView>
  </main>

  <footer class="page_footer">
    Copyright &copy; 2026 Rick Gruber-Riemer
  </footer>
</template>

<style scoped>
/* full window width like the Flask web-ui - e.g. the maps grow with the window */
.page_header, .page_main, .page_footer {
  padding: 0 var(--space);
}

.page_header {
  padding-top: 0.5rem;
}

.page_footer {
  margin-top: calc(2 * var(--space));
  padding-bottom: var(--space);
  font-size: 0.8125rem;
  font-style: italic;
  text-align: center;
  color: var(--color-muted);
}
</style>
