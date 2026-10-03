// SPDX-FileCopyrightText: (C) 2026, rick@vanosten.net
// SPDX-License-Identifier: GPL-2.0-or-later
import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'

import { ApiError } from '@/api/client'

export const TEXT_FETCH_FAILED = 'Something went wrong when fetching data from the REST API. Retry or give up.'

export function errorMessage(error: unknown, fallback: string = TEXT_FETCH_FAILED): string {
  if (error instanceof ApiError && error.status === 400) {
    return error.message // user-facing validation message from the REST API
  }
  console.error(error)
  return fallback
}

export interface ApiData<T> {
  data: ShallowRef<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  lastFetched: Ref<Date | null>
  load: () => Promise<void>
}

/** Fetches data on request (no automatic refresh) and keeps track of loading/error state.
 * If load() is called again before a previous call returned, the older result is discarded.
 */
export function useApiData<T>(loader: () => Promise<T>): ApiData<T> {
  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetched = ref<Date | null>(null)
  let requestCounter = 0

  async function load(): Promise<void> {
    const requestId = ++requestCounter
    loading.value = true
    error.value = null
    try {
      const result = await loader()
      if (requestId === requestCounter) {
        data.value = result
        lastFetched.value = new Date()
      }
    } catch (e) {
      if (requestId === requestCounter) {
        error.value = errorMessage(e)
      }
    } finally {
      if (requestId === requestCounter) {
        loading.value = false
      }
    }
  }

  return { data, loading, error, lastFetched, load }
}
