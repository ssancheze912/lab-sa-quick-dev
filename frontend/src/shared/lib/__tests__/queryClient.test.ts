import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'

describe('queryClient', () => {
  it('should be a singleton QueryClient instance', () => {
    expect(queryClient).toBeDefined()
  })

  it('should have staleTime of 60 seconds', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(60000)
  })
})
