import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient', () => {
  it('should be a QueryClient instance', () => {
    // GIVEN: The queryClient module is imported
    // WHEN: We check its type
    // THEN: It is a real QueryClient instance
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('should have staleTime of 1 minute for queries', () => {
    // GIVEN: queryClient is initialized with staleTime: 1000 * 60
    // WHEN: Default query options are read
    // THEN: staleTime equals 60 000 ms
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(60000)
  })
})
