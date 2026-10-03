<!-- SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net -->
<!-- SPDX-License-Identifier: GPL-2.0-or-later -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

import { CoordinatesControl } from '@/leaflet/coordinatesControl'
import { buildPopupContent } from '@/leaflet/markers'

export interface MapMarker {
  lon: number
  lat: number
  popupLines: string[]
  colour?: string // if given, then a circle marker in that colour is used instead of a default marker
}

const props = defineProps<{
  /** [west_lon, south_lat, east_lon, north_lat] - the map is fitted to it when first displayed */
  bounds: [number, number, number, number]
  markers: MapMarker[]
  showCoordinates?: boolean
}>()

// L.Icon.Default derives its image paths from the CSS, which does not work with bundled assets
const defaultIcon = L.icon({
  ...L.Icon.Default.prototype.options,
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
})

const mapElement = useTemplateRef<HTMLElement>('mapElement')
let map: L.Map | null = null
// the map size can change with the window size (the map has a relative width)
const resizeObserver = new ResizeObserver(() => map?.invalidateSize())
const markerLayer = L.layerGroup()

function updateMarkers(markers: MapMarker[]): void {
  // only the markers are replaced, such that zoom and pan of the user are kept on refresh
  markerLayer.clearLayers()
  for (const marker of markers) {
    const latLng: L.LatLngExpression = [marker.lat, marker.lon]
    const layer = marker.colour
      ? L.circleMarker(latLng, { color: marker.colour, fillColor: marker.colour, fillOpacity: 0.5, radius: 8 })
      : L.marker(latLng, { icon: defaultIcon })
    layer.bindPopup(buildPopupContent(marker.popupLines))
    markerLayer.addLayer(layer)
  }
}

onMounted(() => {
  if (!mapElement.value) {
    return
  }
  const [westLon, southLat, eastLon, northLat] = props.bounds
  map = L.map(mapElement.value).fitBounds([[southLat, westLon], [northLat, eastLon]])
  L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="https://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  }).addTo(map)
  L.control.scale().addTo(map)
  markerLayer.addTo(map)
  if (props.showCoordinates) {
    const coordinates = new CoordinatesControl()
    coordinates.addTo(map)
    map.on('click', (event: L.LeafletMouseEvent) => coordinates.setCoordinates(event))
  }
  updateMarkers(props.markers)
  resizeObserver.observe(mapElement.value)
})

watch(() => props.markers, updateMarkers)

onBeforeUnmount(() => {
  resizeObserver.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <section ref="mapElement" aria-label="Map"></section>
</template>
