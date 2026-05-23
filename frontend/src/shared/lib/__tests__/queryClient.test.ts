import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'

describe('queryClient', () => {
  it('is initialized with staleTime of 60 seconds', () => {
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.staleTime).toBe(1000 * 60)
  })
})
