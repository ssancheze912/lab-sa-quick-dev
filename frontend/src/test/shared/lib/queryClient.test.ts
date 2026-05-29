import { describe, it, expect } from 'vitest'
import { queryClient } from '../../../shared/lib/queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient', () => {
  it('should be a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('should have staleTime of 1 minute', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60)
  })
})
