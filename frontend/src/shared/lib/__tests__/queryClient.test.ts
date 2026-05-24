import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'

describe('queryClient', () => {
  it('should export a QueryClient instance', () => {
    // GIVEN: The queryClient module is loaded
    // WHEN: The exported value is evaluated
    // THEN: It is defined and accessible
    expect(queryClient).toBeDefined()
  })

  it('should have staleTime of 60 seconds configured', () => {
    // GIVEN: queryClient is created with defaultOptions.queries.staleTime = 1000 * 60
    // WHEN: The default staleTime is read from the instance
    // THEN: It equals 60000ms (60 seconds)
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60)
  })
})
