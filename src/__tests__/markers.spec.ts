import { describe, expect, it } from 'vitest'

import type { PositionUpdate } from '@/api/types'
import { airportKindText, buildPopupContent, positionPopupLines } from '@/leaflet/markers'

describe('markers', () => {
  it('does not interpret popup text as HTML', () => {
    const content = buildPopupContent(['<img src=x onerror=alert(1)>', 'second'])
    expect(content.querySelector('img')).toBeNull()
    expect(content.querySelector('b')?.textContent).toBe('<img src=x onerror=alert(1)>')
    expect(content.textContent).toContain('second')
  })

  it('maps airport kinds', () => {
    expect(airportKindText(1)).toBe('Land airport')
    expect(airportKindText(16)).toBe('Sea base')
    expect(airportKindText(17)).toBe('Heliport')
  })

  it('creates position popup lines', () => {
    const position: PositionUpdate = {
      callsign: 'OPFOR12', kind: 'bunker', health: 0, health_name: 'fit_for_fight',
      lon: 10.123456, lat: 60.5, alt_m: 100.7, heading: 0, pitch: 0, speed: 0, marker_category: 'static',
    }
    expect(positionPopupLines(position)).toEqual(
      ['OPFOR12', 'bunker', 'fit_for_fight', '10.12346, 60.50000', 'at 330 ft (100 m)'])
  })
})
