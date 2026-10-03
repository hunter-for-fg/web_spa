// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
import { reactive, watch, type UnwrapNestedRefs } from 'vue'

const KEY_PREFIX = 'hunter.'

/** Reactive state, which is stored in the browser's localStorage, such that it survives a reload. */
export function usePersistentState<T extends object>(key: string, defaults: T): UnwrapNestedRefs<T> {
  const storageKey = KEY_PREFIX + key
  let stored: Partial<T> = {}
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (raw) {
      stored = JSON.parse(raw) as Partial<T>
    }
  } catch {
    // e.g. localStorage not available or garbage stored - just use the defaults
  }
  const state = reactive({ ...defaults, ...stored })
  watch(state, (value) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // e.g. quota exceeded - not important enough to bother the user
    }
  }, { deep: true })
  return state
}
