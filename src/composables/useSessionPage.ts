// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
import { computed, ref, shallowRef, watch, type ComputedRef, type Ref, type ShallowRef } from 'vue'
import { useRoute } from 'vue-router'

import { ApiError, fetchSession } from '@/api/client'
import type { HunterSession } from '@/api/types'
import { errorMessage } from './useApiData'

export const SESSION_ID_PARAM = 'session_id'

/** The session shown on the current page - used by the navigation bar to display the session links. */
export const currentSession = shallowRef<HunterSession | null>(null)

export function sessionIdFromQuery(value: unknown): string | null {
  if (Array.isArray(value)) {
    value = value[0]
  }
  return typeof value === 'string' && value !== '' ? value : null
}

export interface SessionPage<T> {
  sessionId: ComputedRef<string | null>
  session: ShallowRef<HunterSession | null>
  data: ShallowRef<T | null>
  invalidSession: Ref<boolean>
  loading: Ref<boolean>
  error: Ref<string | null>
  lastFetched: Ref<Date | null>
  refresh: () => Promise<void>
}

/** Loads the session given by the session_id query parameter plus the page specific data.
 * Fetching is done when the page is opened / the session_id changes and when refresh() is called.
 */
export function useSessionPage<T>(fetchPageData: (sessionId: string) => Promise<T>,
                                  loadAirports = false): SessionPage<T> {
  const route = useRoute()
  const sessionId = computed(() => sessionIdFromQuery(route.query[SESSION_ID_PARAM]))
  const session = shallowRef<HunterSession | null>(null)
  const data = shallowRef<T | null>(null)
  const invalidSession = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<Date | null>(null)
  let requestCounter = 0

  async function refresh(): Promise<void> {
    const requestId = ++requestCounter
    const id = sessionId.value
    error.value = null
    if (id === null) {
      setInvalid()
      return
    }
    loading.value = true
    try {
      const [loadedSession, pageData] = await Promise.all([fetchSession(id, loadAirports), fetchPageData(id)])
      if (requestId !== requestCounter) {
        return
      }
      session.value = loadedSession
      currentSession.value = loadedSession
      data.value = pageData
      invalidSession.value = false
      lastFetched.value = new Date()
    } catch (e) {
      if (requestId !== requestCounter) {
        return
      }
      if (e instanceof ApiError && e.status === 404) {
        setInvalid()
      } else {
        error.value = errorMessage(e)
      }
    } finally {
      if (requestId === requestCounter) {
        loading.value = false
      }
    }
  }

  function setInvalid(): void {
    session.value = null
    currentSession.value = null
    data.value = null
    invalidSession.value = true
  }

  watch(sessionId, () => {
    // do not show data of another session while loading
    session.value = null
    data.value = null
    void refresh()
  }, { immediate: true })

  return { sessionId, session, data, invalidSession, loading, error, lastFetched, refresh }
}
