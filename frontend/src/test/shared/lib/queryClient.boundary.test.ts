/**
 * Story 1.1 — queryClient boundary conditions
 * Tests cache invalidation, mutation defaults, and retry boundary behavior.
 * Distinct from queryClient.edge.test.ts — focuses on cache state boundaries.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { queryClient } from '@/shared/lib/queryClient'

describe('queryClient — cache and retry boundary conditions', () => {
  beforeEach(() => {
    queryClient.clear()
  })

  it('cache is empty after clear() even if queries were prefetched', async () => {
    // Prefetch a query to populate the cache
    await queryClient.prefetchQuery({
      queryKey: ['pre-populate'],
      queryFn: () => Promise.resolve({ data: 'value' }),
    })
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0)

    // After clear, cache must be empty
    queryClient.clear()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('can setQueryData and retrieve it without a prefetch', () => {
    queryClient.setQueryData(['static-key'], { id: 1, name: 'test' })
    const result = queryClient.getQueryData<{ id: number; name: string }>(['static-key'])
    expect(result?.id).toBe(1)
    expect(result?.name).toBe('test')
  })

  it('returns undefined for a query key that was never set', () => {
    const result = queryClient.getQueryData(['key-never-set-xyz'])
    expect(result).toBeUndefined()
  })

  it('does not share cache between two different query keys', async () => {
    await queryClient.prefetchQuery({
      queryKey: ['key-alpha'],
      queryFn: () => Promise.resolve(100),
    })

    const alpha = queryClient.getQueryData<number>(['key-alpha'])
    const beta = queryClient.getQueryData<number>(['key-beta'])

    expect(alpha).toBe(100)
    expect(beta).toBeUndefined()
  })

  it('overrides setQueryData when called twice with the same key', () => {
    queryClient.setQueryData(['overwrite-key'], 'first')
    queryClient.setQueryData(['overwrite-key'], 'second')
    const result = queryClient.getQueryData<string>(['overwrite-key'])
    expect(result).toBe('second')
  })

  it('staleTime is applied globally — not per-query override at initialization', () => {
    const opts = queryClient.getDefaultOptions()
    // The global staleTime is 60 000ms — no per-query override should exist at this level
    expect(opts.queries?.staleTime).toBe(60_000)
  })

  it('default retry count is not 0 (disabled) — should retry failed queries', () => {
    const opts = queryClient.getDefaultOptions()
    const retry = opts.queries?.retry
    // undefined means the TanStack default (3 retries) — acceptable
    // false or 0 means no retries — not acceptable for production resilience
    if (retry !== undefined) {
      expect(retry).not.toBe(false)
      expect(retry).not.toBe(0)
    }
  })

  it('invalidateQueries does not throw on an empty cache', async () => {
    queryClient.clear()
    await expect(
      queryClient.invalidateQueries({ queryKey: ['non-existent'] })
    ).resolves.not.toThrow()
  })
})
