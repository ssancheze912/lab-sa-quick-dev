import { describe, expect, it } from 'vitest'

import { queryClient } from './queryClient'

describe('queryClient', () => {
  it('exposes a default staleTime', () => {
    const defaults = queryClient.getDefaultOptions().queries
    expect(defaults?.staleTime).toBe(1000 * 60)
  })
})
