import { describe, expect, it } from 'vitest'

import { MANUAL_BASE_URL, manualUrl } from '@/utils/manual'

describe('manual', () => {
  it('builds URLs relative to the manual base URL', () => {
    expect(manualUrl('about.html')).toBe(`${MANUAL_BASE_URL}about.html`)
    expect(manualUrl('about.html')).toBe('https://hunter-for-fg.github.io/manual/about.html')
  })
})
