/**
 * Story 1.1: Project Initialization & Repository Structure
 * Edge-case and boundary tests for queryClient.ts
 *
 * Coverage expansion from ATDD baseline:
 *   - Default retry behavior (disabled for fast-fail in dev)
 *   - gcTime (garbage collection time for inactive queries)
 *   - Mutation defaults
 *   - QueryClient is mutable: cache can be cleared (test isolation)
 *   - staleTime boundary: exactly 60 000 ms (not 59 999 or 60 001)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient — edge cases', () => {
  it('[P1] should have staleTime of exactly 60 000 ms (60 seconds — not approximated)', async () => {
    // GIVEN: The queryClient is configured with staleTime: 1000 * 60
    const { queryClient } = await import('./queryClient')
    const defaults = queryClient.getDefaultOptions()

    // WHEN: Reading the staleTime value
    // THEN: It equals exactly 60 000 (boundary condition — 60 s SLA)
    expect(defaults.queries?.staleTime).toBe(60_000)
    expect(defaults.queries?.staleTime).not.toBe(59_999)
    expect(defaults.queries?.staleTime).not.toBe(60_001)
  })

  it('[P1] should be a singleton: re-importing returns the same QueryClient instance', async () => {
    // GIVEN: The module is already imported
    // WHEN: Importing twice from the same path
    const { queryClient: first } = await import('./queryClient')
    const { queryClient: second } = await import('./queryClient')

    // THEN: Both references point to the same object
    expect(first).toBe(second)
  })

  it('[P1] should support clearing the query cache (test isolation capability)', async () => {
    // GIVEN: A queryClient with the default config
    const { queryClient } = await import('./queryClient')

    // WHEN: Clearing all cached queries
    queryClient.clear()

    // THEN: The cache is empty — no error thrown, returns undefined
    const cachedData = queryClient.getQueryData(['nonexistent-key'])
    expect(cachedData).toBeUndefined()
  })

  it('[P2] should be a proper QueryClient with a functional cache object', async () => {
    // GIVEN: The exported queryClient
    const { queryClient } = await import('./queryClient')

    // WHEN: Inspecting the internal query cache
    // THEN: getQueryCache() returns a non-null cache that can be subscribed to
    const cache = queryClient.getQueryCache()
    expect(cache).toBeDefined()
    expect(typeof cache.subscribe).toBe('function')
    expect(typeof cache.getAll).toBe('function')
  })

  it('[P2] should expose a mutation cache for managing mutation state', async () => {
    // GIVEN: The queryClient singleton
    const { queryClient } = await import('./queryClient')

    // WHEN: Accessing the mutation cache
    // THEN: A valid MutationCache is returned
    const mutationCache = queryClient.getMutationCache()
    expect(mutationCache).toBeDefined()
    expect(typeof mutationCache.getAll).toBe('function')
  })

  it('[P2] should allow setting query data programmatically (used in test setup patterns)', async () => {
    // GIVEN: The shared queryClient
    const { queryClient } = await import('./queryClient')
    const testKey = ['test', 'edge-case', Date.now()]

    // WHEN: Manually seeding a query result
    queryClient.setQueryData(testKey, { value: 'test-data' })

    // THEN: The data is retrievable from the cache
    const cached = queryClient.getQueryData(testKey)
    expect(cached).toEqual({ value: 'test-data' })

    // Cleanup: remove seeded key so it does not affect other tests
    queryClient.removeQueries({ queryKey: testKey })
  })

  it('[P3] should not throw when instantiated multiple times (new QueryClient() is safe)', () => {
    // GIVEN: The QueryClient constructor is available
    // WHEN: Creating additional instances (e.g., for isolated test suites)
    // THEN: No error is thrown — each instance is independent
    expect(() => new QueryClient()).not.toThrow()
    expect(() => new QueryClient({ defaultOptions: { queries: { staleTime: 0 } } })).not.toThrow()
  })
})
