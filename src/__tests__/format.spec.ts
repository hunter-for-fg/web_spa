import { describe, expect, it } from 'vitest'

import { formatPressure, formatUtc, metresToFeet, toInt } from '@/utils/format'

describe('format', () => {
  it('formats ISO timestamps in UTC', () => {
    expect(formatUtc('2026-10-03T12:34:56.789+00:00')).toBe('2026-10-03 12:34:56')
    expect(formatUtc('2026-10-03T14:34:56+02:00')).toBe('2026-10-03 12:34:56')
    expect(formatUtc(null)).toBe('')
    expect(formatUtc('garbage')).toBe('garbage')
  })

  it('truncates like Jinja int', () => {
    expect(toInt(12.9)).toBe(12)
    expect(toInt(-12.9)).toBe(-12)
  })

  it('converts metres to feet', () => {
    expect(toInt(metresToFeet(1000))).toBe(3280)
  })

  it('formats pressures', () => {
    expect(formatPressure(1013.25, 29.921)).toBe('1013.3 mbar (29.92 inHg)')
    expect(formatPressure(1013.25, 29.921, true)).toBe('29.92 inHg (1013.3 mbar)')
  })
})
