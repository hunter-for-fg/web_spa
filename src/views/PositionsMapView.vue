<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { computed } from 'vue'

import { fetchPositions } from '@/api/client'
import LeafletMap, { type MapMarker } from '@/components/LeafletMap.vue'
import SessionPageStatus from '@/components/SessionPageStatus.vue'
import { useSessionPage } from '@/composables/useSessionPage'
import { MARKER_COLOURS, positionPopupLines } from '@/leaflet/markers'

defineProps<{ title: string }>()

const { session, data: positions, invalidSession, loading, error, lastFetched, refresh } = useSessionPage(
  fetchPositions)

const positionMarkers = computed<MapMarker[]>(() => {
  const markers: MapMarker[] = []
  for (const position of positions.value ?? []) {
    if (position.marker_category === null) {
      continue
    }
    markers.push({
      lon: position.lon,
      lat: position.lat,
      popupLines: positionPopupLines(position),
      colour: MARKER_COLOURS[position.marker_category],
    })
  }
  return markers
})
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <SessionPageStatus :session="session" :invalid-session="invalidSession" :loading="loading" :error="error"
                       :last-fetched="lastFetched" @refresh="refresh">
      <template v-if="session">
        <p>Marker colours:</p>
        <ul>
          <li>attacker planes have light blue markers – the carrier is navy blue (dark)</li>
          <li>offshore ships are brown and coasters are orange</li>
          <li>vehicles are magenta</li>
          <li>static stuff (e.g. a bunker) is red</li>
          <li>the rest (mostly flying) is purple.</li>
        </ul>
        <p>Zoom in on the markers and then click on them to get more info like their callsign, type and position.</p>
        <p>Click on the map to get the lon/lat displayed in the lower left corner – click again to get a popup with easy copyable coordinates.</p>
        <LeafletMap class="positions_map" :key="session.session_id"
                    :bounds="[session.scenario_west_lon, session.scenario_south_lat,
                              session.scenario_east_lon, session.scenario_north_lat]"
                    :markers="positionMarkers" show-coordinates />
      </template>
    </SessionPageStatus>
  </div>
</template>

<style scoped>
/* the map follows the window size - with a minimum height for small windows */
.positions_map {
  width: 100%;
  height: max(25rem, 80vh);
}
</style>
