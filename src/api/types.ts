// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
// Shapes of the JSON returned by the GET endpoints in function_app.py.

export interface Airport {
  icao: string
  name: string
  lon: number
  lat: number
  kind: number // 1 = land airport, 16 = sea base, 17 = heliport (apt.dat row codes)
}

export interface HunterSession {
  session_id: string
  started_by: string
  started_dt: string // ISO timestamp
  stopped_dt: string | null
  scenario_name: string
  scenario_description: string
  scenario_icao: string
  scenario_west_lon: number
  scenario_south_lat: number
  scenario_east_lon: number
  scenario_north_lat: number
  mp_server_host: string
  gci: boolean
  heli_shoot: boolean
  drone_shoot: boolean
  ship_shoot: number
  shilka_shoot: boolean
  sam_shoot: number
  awacs: boolean
  tanker: boolean
  carrier: boolean
  callsign: string
  identifier: string
  overridden: boolean
  no_list: boolean
  airports: Airport[] // only filled if requested with load_airports
  ship_shoot_display: string
  sam_shoot_display: string
}

export interface DamageResult {
  damage_time: string
  health: number
  health_name: string
  weapon_type: number
  weapon_type_name: string
  weapon_name: string
  attacker: string
  attacker_kind: string
  target: string
  target_kind: string
  is_civilian: boolean
  shooting: boolean
}

export interface AttackerEvent {
  event_time: string
  callsign: string
  kind: string
  has_opfor_iff: boolean
  trigger: number
  trigger_name: string
}

export interface MissileEvent {
  event_time: string
  unique_id: number
  attacker: string
  target: string
  telemetry_string: string
}

export type MarkerCategory = 'carrier' | 'attacker' | 'vehicle' | 'ship' | 'coaster' | 'static' | 'other'

export interface PositionUpdate {
  callsign: string
  kind: string
  health: number
  health_name: string
  lon: number
  lat: number
  alt_m: number
  heading: number
  pitch: number
  speed: number
  marker_category: MarkerCategory | null // null = not to be displayed on a map
}

export interface Metar {
  station_id: string
  raw_text: string
  decoded_text: string
  lon: number
  lat: number
  elevation_m: number
}

export interface MetarsResult {
  metars: Metar[]
  qnh_mbar: number | null
  qnh_inhg: number | null
}

export interface QfeResult {
  qfe_mbar: number
  qfe_inhg: number
}
