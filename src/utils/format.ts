// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later

export const METRES_TO_FEET = 3.2808399 // same as hunter.geometry

/** Formats an ISO timestamp as UTC 'YYYY-MM-DD HH:MM:SS'. Empty string for null/undefined. */
export function formatUtc(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) {
    return ''
  }
  const date = new Date(isoTimestamp)
  if (Number.isNaN(date.getTime())) {
    return isoTimestamp
  }
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

/** Formats the time part of a Date as UTC 'HH:MM:SS'. */
export function formatUtcTime(date: Date): string {
  return date.toISOString().slice(11, 19)
}

/** Truncates towards zero (also for negative values). */
export function toInt(value: number): number {
  return Math.trunc(value)
}

export function metresToFeet(metres: number): number {
  return metres * METRES_TO_FEET
}

export function formatPressure(mbar: number, inhg: number, inhgFirst = false): string {
  if (inhgFirst) {
    return `${inhg.toFixed(2)} inHg (${mbar.toFixed(1)} mbar)`
  }
  return `${mbar.toFixed(1)} mbar (${inhg.toFixed(2)} inHg)`
}
