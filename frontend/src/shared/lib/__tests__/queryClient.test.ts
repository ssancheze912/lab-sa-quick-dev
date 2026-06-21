import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'

describe('queryClient', () => {
  it('should create a QueryClient instance', () => {
    expect(queryClient).toBeDefined()
  })

  it('should have staleTime configured to 60 seconds', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60)
  })
})
