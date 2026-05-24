/**
 * Story 1.1 — queryClient edge cases and boundary conditions
 * Expands coverage beyond the happy-path ATDD tests.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { queryClient } from '@/shared/lib/queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient — edge cases', () => {
  beforeEach(() => {
    queryClient.clear()
  })

  it('is a singleton — same reference across imports', async () => {
    const { queryClient: qc2 } = await import('@/shared/lib/queryClient')
    expect(queryClient).toBe(qc2)
  })

  it('has staleTime of exactly 60 000 ms (not 0 or Infinity)', () => {
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.staleTime).toBe(60_000)
    expect(options.queries?.staleTime).not.toBe(0)
    expect(options.queries?.staleTime).not.toBe(Infinity)
  })

  it('starts with an empty query cache after clear()', () => {
    queryClient.clear()
    const cache = queryClient.getQueryCache().getAll()
    expect(cache).toHaveLength(0)
  })

  it('can store and retrieve a query result from cache', async () => {
    await queryClient.prefetchQuery({
      queryKey: ['test-key'],
      queryFn: () => Promise.resolve({ value: 42 }),
    })
    const data = queryClient.getQueryData<{ value: number }>(['test-key'])
    expect(data?.value).toBe(42)
  })

  it('returns a QueryClient instance (not a plain object)', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('does NOT throw when mutationDefaults are accessed', () => {
    expect(() => queryClient.getDefaultOptions()).not.toThrow()
  })

  it('does not expose retryDelay as 0 (avoids hammering during failures)', () => {
    const opts = queryClient.getDefaultOptions()
    // retryDelay should be undefined (default exponential) or a valid positive function
    const retryDelay = opts.queries?.retryDelay
    if (retryDelay !== undefined && typeof retryDelay === 'number') {
      expect(retryDelay).toBeGreaterThan(0)
    }
  })
})
