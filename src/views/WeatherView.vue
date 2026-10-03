<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { ref } from 'vue'

import { fetchMetars, fetchQfe } from '@/api/client'
import type { Metar } from '@/api/types'
import { errorMessage } from '@/composables/useApiData'
import { usePersistentState } from '@/composables/usePersistentState'
import DataTable from '@/components/DataTable.vue'
import { formatPressure } from '@/utils/format'
import type { Column } from '@/utils/table'

defineProps<{ title: string }>()

// inputs and results are kept in localStorage
const qnh = usePersistentState('weather.qnh', {
  icao: '',
  lon: '',
  lat: '',
  error: null as string | null,
  result: null as string | null,
  metars: null as Metar[] | null,
})
const qfe = usePersistentState('weather.qfe', {
  qnh: '',
  pUnit: 'mbar',
  elevation: '',
  aUnit: 'm',
  error: null as string | null,
  result: null as string | null,
})
const qnhLoading = ref(false)

const metarColumns: Column<Metar>[] = [
  { key: 'station_id', label: 'Station', value: (m) => m.station_id },
  { key: 'raw_text', label: 'METAR (click to decode)', value: (m) => m.raw_text },
]
const qfeLoading = ref(false)

// number inputs bound with v-model can hold numbers - the REST API wants strings
function asParam(value: string | number): string {
  return String(value).trim()
}

async function submitQnh(): Promise<void> {
  qnh.icao = qnh.icao.trim()
  qnhLoading.value = true
  qnh.error = null
  qnh.result = null
  qnh.metars = null
  try {
    const result = await fetchMetars(qnh.icao, asParam(qnh.lon), asParam(qnh.lat))
    qnh.metars = result.metars
    if (result.qnh_mbar !== null && result.qnh_inhg !== null) {
      qnh.result = formatPressure(result.qnh_mbar, result.qnh_inhg)
    }
  } catch (e) {
    qnh.error = errorMessage(e, 'Something went wrong when fetching METARs. Retry or give up.')
  } finally {
    qnhLoading.value = false
  }
}

async function submitQfe(): Promise<void> {
  qfeLoading.value = true
  qfe.error = null
  qfe.result = null
  try {
    const result = await fetchQfe(asParam(qfe.qnh), qfe.pUnit, asParam(qfe.elevation), qfe.aUnit)
    qfe.result = formatPressure(result.qfe_mbar, result.qfe_inhg, qfe.pUnit === 'inhg')
  } catch (e) {
    qfe.error = errorMessage(e, 'Something went wrong when calculating QFE. Retry or give up.')
  } finally {
    qfeLoading.value = false
  }
}
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <h2>Introduction</h2>
    <p>The forms below can help you to set the correct <a href="https://en.wikipedia.org/wiki/Altimeter_setting">altimeter settings</a> in your aircraft.</p>
    <p>The acronym <em>QNH</em> is one of the Q(uestion) code names developed for use in morse code (<a href="https://en.wikipedia.org/wiki/Q_code">Q-code</a>). To concisely ask for atmospheric pressure at mean sea level (MSL), the operator
      would transmit the letters <em>QNH</em> to be interpreted as "I have a question. What is the atmospheric pressure at Nil Height?"</p>
    <p>If you set the <em>QNH</em> (that can be taken from the <a href="https://en.wikipedia.org/wiki/METAR">Metar</a> or from <a href="https://en.wikipedia.org/wiki/Air_traffic_control">ATC</a>) you will fly Altitudes, and if you set the <em>QFE</em> you will fly Height.</p>

    <h2>Fetch METARs and Calculate Interpolated QNH</h2>
    <p><em>QNH</em> will be interpolated for a given lon/lat based on a linear approximation for distance given the chosen airports. If lon or lat is omitted, then only the METARs are fetched for the list of airports.</p>
    <form class="tool_form" @submit.prevent="submitQnh">
      <p v-if="qnh.error" role="alert" class="error full_row">{{ qnh.error }}</p>
      <label for="icao">List of airports (ICAO – comma separated no blanks, max 20)</label>
      <input id="icao" v-model="qnh.icao" type="text" required placeholder="Single ICAO or comma separated list like ENAT, ENNA">
      <label for="lon">Longitude (decimal)</label>
      <input id="lon" v-model="qnh.lon" type="number" min="-180" max="180" step="0.0001">
      <label for="lat">Latitude (decimal)</label>
      <input id="lat" v-model="qnh.lat" type="number" min="-90" max="90" step="0.0001">
      <div class="field_column">
        <button type="submit" class="button" :disabled="qnhLoading">Fetch and calculate</button>
      </div>
      <label class="result_label" for="qnh_result">Interpolated QNH</label>
      <output id="qnh_result" for="icao lon lat" aria-live="polite">
        {{ qnhLoading ? 'Fetching …' : (qnh.result ?? '') }}
      </output>
    </form>

    <DataTable v-if="qnh.metars?.length" :rows="qnh.metars" :columns="metarColumns" :row-key="(m) => m.station_id">
      <template #cell-raw_text="{ row }">
        <details class="metar">
          <summary>{{ row.raw_text }}</summary>
          <pre>{{ row.decoded_text }}</pre>
        </details>
      </template>
    </DataTable>
    <p v-else-if="qnh.metars && !qnh.error" class="error">No data found. Maybe you should check whether the ICAO codes actually exist.</p>

    <h2>Calculate QFE</h2>
    <form class="tool_form" @submit.prevent="submitQfe">
      <p v-if="qfe.error" role="alert" class="error full_row">{{ qfe.error }}</p>
      <label for="qnh">QNH</label>
      <div class="field_group">
        <input id="qnh" v-model="qfe.qnh" type="number" min="0" max="2000" step="0.01" required>
        <label for="p_unit">Pressure unit</label>
        <select id="p_unit" v-model="qfe.pUnit">
          <option value="mbar">mBar / hPa</option>
          <option value="inhg">inHg</option>
        </select>
      </div>
      <label for="elevation">True altitude / elevation MSL</label>
      <div class="field_group">
        <input id="elevation" v-model="qfe.elevation" type="number" required>
        <label for="a_unit">Altitude unit</label>
        <select id="a_unit" v-model="qfe.aUnit">
          <option value="m">metres (m)</option>
          <option value="ft">feet (ft)</option>
        </select>
      </div>
      <div class="field_column">
        <button type="submit" class="button" :disabled="qfeLoading">Calculate</button>
      </div>
      <label class="result_label" for="qfe_result">Calculated QFE</label>
      <output id="qfe_result" for="qnh p_unit elevation a_unit" aria-live="polite">
        {{ qfeLoading ? 'Calculating …' : (qfe.result ?? '') }}
      </output>
    </form>
  </div>
</template>

<style scoped>
/* two columns: labels right aligned, fields left aligned */
.tool_form {
  display: grid;
  grid-template-columns: minmax(10rem, 18rem) minmax(0, 36rem);
  gap: var(--space) var(--space);
  align-items: center;
  padding: var(--space);
  border: 1px solid var(--color-border);
  border-radius: 1em;
}

.tool_form > label {
  text-align: right;
  color: var(--color-muted);
}

.full_row {
  grid-column: 1 / -1;
  margin: 0;
}

.field_column {
  grid-column: 2;
}

.field_group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem var(--space);
}

.field_group label {
  color: var(--color-muted);
}

.field_group input {
  width: 9rem;
}

.tool_form > .result_label {
  font-weight: bold;
  color: var(--color-accent);
}

output {
  min-height: 2rem;
  padding: 0.25rem 0.4rem;
  border-radius: 3px;
  background: var(--color-surface-raised);
  color: var(--color-accent);
  font-weight: bold;
}

.metar summary {
  cursor: pointer;
}

.metar pre {
  margin: 0.5rem 0 0;
  font-family: inherit;
  white-space: pre-wrap;
  color: var(--color-muted);
}

/* phones: labels above the fields */
@media (width < 40rem) {
  .tool_form {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.25rem;
  }

  .tool_form > label {
    text-align: left;
    margin-top: 0.5rem;
  }

  .field_column {
    grid-column: 1;
  }
}
</style>
