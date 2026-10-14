<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { currentSession, SESSION_ID_PARAM, sessionIdFromQuery } from '@/composables/useSessionPage'
import { manualUrl } from '@/utils/manual'
import NavDropdown, { type NavDropdownItem } from './NavDropdown.vue'

const route = useRoute()

const SESSION_PAGES = [
  { path: '/ongoing_session/current_session', label: 'Session Details' },
  { path: '/ongoing_session/damages', label: 'Damage and Hits' },
  { path: '/ongoing_session/attacker_events', label: 'Attacker Events' },
  { path: '/ongoing_session/missile_events', label: 'Missile Events' },
  { path: '/ongoing_session/positions_list', label: 'Attacker and Target Positions: List' },
  { path: '/ongoing_session/positions_map', label: 'Attacker and Target Positions: Map' },
]

const HELP_ITEMS: NavDropdownItem[] = [
  { label: 'About', href: manualUrl('about.html') },
  { label: 'Terms of Use, Conduct and Privacy', href: manualUrl('terms_of_use.html') },
  { label: 'Using the Web UI', href: manualUrl('web_application.html') },
  { label: 'Using Hunter as a Pilot', href: manualUrl('end_user_flying.html') },
  { label: 'Operating the Hunter Controller', href: manualUrl('operators.html') },
]

// the session links are only shown on pages of a valid session
const sessionItems = computed<NavDropdownItem[] | null>(() => {
  const session = currentSession.value
  if (!route.meta.sessionPage || !session
      || session.session_id !== sessionIdFromQuery(route.query[SESSION_ID_PARAM])) {
    return null
  }
  const query = { [SESSION_ID_PARAM]: session.session_id }
  return SESSION_PAGES.map(({ path, label }) => ({ label, to: { path, query } }))
})
</script>

<template>
  <!-- the separators between the items are drawn by CSS (class sep_*) -->
  <nav aria-label="Main">
    <ul class="nav_list">
      <li><RouterLink class="home" to="/">Home</RouterLink></li>
      <li class="sep_bar"><RouterLink class="weather" to="/tools/weather">Weather</RouterLink></li>
      <li class="sep_bar"><RouterLink to="/ongoing_session/sessions_list">List of available sessions</RouterLink></li>
      <li v-if="sessionItems" class="sep_group">
        <NavDropdown label="Session pages" :items="sessionItems" />
      </li>
      <li class="sep_diamond help">
        <NavDropdown label="Help" :items="HELP_ITEMS" />
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.nav_list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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

.help {
  --nav-dropdown-color: hotpink;
}
</style>
