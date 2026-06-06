import { describe, it, expect } from 'vitest'
import { queryClient } from './queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient', () => {
  it('should be a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('should have staleTime of 60 seconds configured', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(60000)
  })
})
