// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
import type { Airport, MarkerCategory, PositionUpdate } from '@/api/types'
import { metresToFeet, toInt } from '@/utils/format'

export const MARKER_COLOURS: Record<MarkerCategory, string> = {
  carrier: 'navy',
  attacker: 'royalblue', // also used for AWACS and tankers
  vehicle: 'magenta',
  ship: 'saddlebrown',
  coaster: 'orange',
  static: 'red',
  other: 'purple',
}

/** Builds popup content from text lines (the first one bold).
 * Uses DOM nodes instead of HTML strings, because e.g. callsigns come from MP and must not be interpreted as HTML.
 */
export function buildPopupContent(lines: string[]): HTMLElement {
  const container = document.createElement('div')
  lines.forEach((line, index) => {
    if (index > 0) {
      container.appendChild(document.createElement('br'))
    }
    if (index === 0) {
      const bold = document.createElement('b')
      bold.textContent = line
      container.appendChild(bold)
    } else {
      container.appendChild(document.createTextNode(line))
    }
  })
  return container
}

export function airportKindText(kind: number): string {
  if (kind === 16) {
    return 'Sea base'
  } else if (kind === 17) {
    return 'Heliport'
  }
  return 'Land airport'
}

export function airportPopupLines(airport: Airport): string[] {
  return [airport.icao, airport.name, `(${airportKindText(airport.kind)})`]
}

export function positionPopupLines(position: PositionUpdate): string[] {
  return [
    position.callsign,
    position.kind,
    position.health_name,
    `${position.lon.toFixed(5)}, ${position.lat.toFixed(5)}`,
    `at ${toInt(metresToFeet(position.alt_m))} ft (${toInt(position.alt_m)} m)`,
  ]
}
