<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { currentSession, SESSION_ID_PARAM, sessionIdFromQuery } from '@/composables/useSessionPage'

const route = useRoute()

// like the Flask app: the session links are only shown on pages of a valid session
const sessionQuery = computed(() => {
  const session = currentSession.value
  if (!route.meta.sessionPage || !session
      || session.session_id !== sessionIdFromQuery(route.query[SESSION_ID_PARAM])) {
    return null
  }
  return { [SESSION_ID_PARAM]: session.session_id }
})
</script>

<template>
  <!-- the separators between the items are drawn by CSS (class sep_*) -->
  <nav aria-label="Main">
    <ul class="nav_list">
      <li><RouterLink class="home" to="/">Home</RouterLink></li>
      <li class="sep_bar"><RouterLink class="weather" to="/tools/weather_qfe">Weather</RouterLink></li>
      <li class="sep_bar"><RouterLink to="/ongoing_session/sessions_list">List of available sessions</RouterLink></li>
      <template v-if="sessionQuery">
        <li class="sep_group">
          <RouterLink :to="{ path: '/ongoing_session/current_session', query: sessionQuery }">Session Details</RouterLink>
        </li>
        <li class="sep_bar">
          <RouterLink :to="{ path: '/ongoing_session/damages', query: sessionQuery }">Damage and Hits</RouterLink>
        </li>
        <li class="sep_bar">
          <RouterLink :to="{ path: '/ongoing_session/attacker_events', query: sessionQuery }">Attacker Events</RouterLink>
        </li>
        <li class="sep_bar">
          Attacker and Target Positions
          <RouterLink :to="{ path: '/ongoing_session/positions_list', query: sessionQuery }">List</RouterLink>
          <span aria-hidden="true"> &bullet; </span>
          <RouterLink :to="{ path: '/ongoing_session/positions_map', query: sessionQuery }">Map</RouterLink>
        </li>
      </template>
      <li class="sep_diamond">
        <a class="documentation" rel="external noopener" target="_blank"
           href="https://vanosten.gitlab.io/hunter/end_user_flying.html">Hunter Documentation <span aria-hidden="true">&#10697;</span><span class="visually_hidden"> (opens in a new tab)</span></a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.nav_list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* the text after the slash is the alternative text for screen readers - i.e. nothing */
.sep_bar::before {
  content: "\00a6" / "";
  margin: 0 0.4em;
  color: var(--color-muted);
}

.sep_group::before {
  content: "\2016" / "";
  margin: 0 0.6em;
  color: var(--color-muted);
}

.sep_diamond::before {
  content: "\2666" / "";
  margin: 0 0.6em;
}

a.home {
  color: #ff6666;
}

a.weather {
  color: var(--color-accent);
}

a.documentation {
  color: hotpink;
}
</style>
