// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
// Client for the GET endpoints of the REST API (function_app.py). They all allow anonymous access.
import type {
  AttackerEvent,
  DamageResult,
  HunterSession,
  MetarsResult,
  MissileEvent,
  PositionUpdate,
  QfeResult,
} from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

/** The REST API answered with an error status. message is user-facing if the API returned one. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function buildUrl(path: string, params: Record<string, string | undefined> = {}): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, value)
    }
  }
  const queryString = query.toString()
  return `${API_BASE_URL}/${path}` + (queryString ? `?${queryString}` : '')
}

async function get<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const response = await fetch(buildUrl(path, params), { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    let message = `The REST API answered with HTTP status ${response.status}.`
    try {
      const body: unknown = await response.json()
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        message = body.error
      }
    } catch {
      // body is not JSON - keep the generic message
    }
    throw new ApiError(response.status, message)
  }
  return (await response.json()) as T
}

function sessionPath(sessionId: string, sub = ''): string {
  return `sessions/${encodeURIComponent(sessionId)}` + (sub ? `/${sub}` : '')
}

export function fetchSessions(): Promise<HunterSession[]> {
  return get<HunterSession[]>('sessions')
}

export function fetchSession(sessionId: string, loadAirports = false): Promise<HunterSession> {
  return get<HunterSession>(sessionPath(sessionId), { load_airports: String(loadAirports) })
}

export function fetchDamages(sessionId: string): Promise<DamageResult[]> {
  return get<DamageResult[]>(sessionPath(sessionId, 'damages'))
}

export function fetchAttackerEvents(sessionId: string): Promise<AttackerEvent[]> {
  return get<AttackerEvent[]>(sessionPath(sessionId, 'attacker-events'))
}

export function fetchMissileEvents(sessionId: string): Promise<MissileEvent[]> {
  return get<MissileEvent[]>(sessionPath(sessionId, 'missile-events'))
}

export function fetchPositions(sessionId: string): Promise<PositionUpdate[]> {
  return get<PositionUpdate[]>(sessionPath(sessionId, 'positions'))
}

export function fetchMetars(icaos: string, lon?: string, lat?: string): Promise<MetarsResult> {
  return get<MetarsResult>('weather/metars', { icaos, lon, lat })
}

export function fetchQfe(qnh: string, pUnit: string, elevation: string, aUnit: string): Promise<QfeResult> {
  return get<QfeResult>('weather/qfe', { qnh, p_unit: pUnit, elevation, a_unit: aUnit })
}
