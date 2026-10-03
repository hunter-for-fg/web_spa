import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, buildUrl, fetchMetars, fetchSession } from '@/api/client'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('client', () => {
  it('builds URLs and skips empty parameters', () => {
    expect(buildUrl('weather/metars', { icaos: 'ENAT,ENNA', lon: '', lat: undefined }))
      .toBe('/api/weather/metars?icaos=ENAT%2CENNA')
    expect(buildUrl('sessions')).toBe('/api/sessions')
  })

  it('encodes the session id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await fetchSession('a/b', true)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/sessions/a%2Fb?load_airports=true')
  })

  it('passes on the error message of the REST API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid ICAO' }), { status: 400 })))
    await expect(fetchMetars('X')).rejects.toEqual(new ApiError(400, 'Invalid ICAO'))
  })
})
