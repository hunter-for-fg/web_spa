<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { computed } from 'vue'

import CheckMark from '@/components/CheckMark.vue'
import LeafletMap, { type MapMarker } from '@/components/LeafletMap.vue'
import SessionPageStatus from '@/components/SessionPageStatus.vue'
import { useSessionPage } from '@/composables/useSessionPage'
import { airportPopupLines } from '@/leaflet/markers'
import { formatUtc } from '@/utils/format'

defineProps<{ title: string }>()

// all data is in the session itself (incl. the airports)
const { session, invalidSession, loading, error, lastFetched, refresh } = useSessionPage(
  () => Promise.resolve(null), true)

const airportMarkers = computed<MapMarker[]>(() => (session.value?.airports ?? []).map((airport) => ({
  lon: airport.lon,
  lat: airport.lat,
  popupLines: airportPopupLines(airport),
  pinVariant: 'red',
})))

/** A row shows either a text or a check mark. */
interface DetailRow {
  label: string
  text?: string
  flag?: boolean
}

const detailRows = computed<DetailRow[]>(() => {
  const s = session.value
  if (!s) {
    return []
  }
  return [
    { label: 'ID', text: s.session_id },
    { label: 'Scenario name', text: s.scenario_name },
    { label: 'Scenario description', text: s.scenario_description },
    { label: 'Typical airport', text: s.scenario_icao },
    { label: 'Started by', text: s.started_by },
    { label: 'Started at (UTC)', text: formatUtc(s.started_dt) },
    { label: 'Stopped at (UTC)', text: formatUtc(s.stopped_dt) },
    { label: 'MP server host', text: s.mp_server_host },
    { label: 'GCI is enabled', flag: s.gci },
    { label: 'Shooting helis', flag: s.heli_shoot },
    { label: 'Shooting drones', flag: s.drone_shoot },
    s.ship_shoot > 0 ? { label: 'Shooting ships', text: s.ship_shoot_display } : { label: 'Shooting ships', flag: false },
    { label: 'Shooting Shilkas', flag: s.shilka_shoot },
    s.sam_shoot > 0 ? { label: 'Shooting SAMs', text: s.sam_shoot_display } : { label: 'Shooting SAMs', flag: false },
    { label: 'MP AWACS active', flag: s.awacs },
    { label: 'MP Tanker active', flag: s.tanker },
    { label: 'MP carrier active', flag: s.carrier },
    { label: 'Not in session list', flag: s.no_list },
  ]
})
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <SessionPageStatus :session="session" :invalid-session="invalidSession" :loading="loading" :error="error"
                       :last-fetched="lastFetched" @refresh="refresh">
      <template v-if="session">
        <table class="key_value_table">
          <tbody>
            <tr v-for="row in detailRows" :key="row.label">
              <th scope="row">{{ row.label }}</th>
              <td>
                <CheckMark v-if="row.flag !== undefined" :value="row.flag" />
                <template v-else>{{ row.text }}</template>
              </td>
            </tr>
          </tbody>
        </table>

        <p>Click on the red markers in the map to get info about the airport like ICAO and name.</p>

        <LeafletMap class="session_map" :key="session.session_id"
                    :bounds="[session.scenario_west_lon, session.scenario_south_lat,
                              session.scenario_east_lon, session.scenario_north_lat]"
                    :markers="airportMarkers" />
      </template>
    </SessionPageStatus>
  </div>
</template>

<style scoped>
/* the map follows the window size - with a minimum height for small windows */
.session_map {
  width: 100%;
  height: max(25rem, 70vh);
}
</style>
