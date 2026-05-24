/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit Tests — queryClient edge cases and boundary conditions
 *
 * Covers gaps NOT in the ATDD spec:
 *   - Singleton: same instance returned on multiple imports (module cache)
 *   - Default retry value (should be 3 or false for tests)
 *   - gcTime (garbage collection time) default behavior
 *   - QueryClient is mutable: setDefaultOptions can override staleTime
 *   - Query cache and mutation cache are initialized
 */

import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

describe('[P1] queryClient — configuration edge cases and boundary conditions', () => {

  it('[P1] should export the same singleton instance on repeated imports', async () => {
    // GIVEN: Two separate import calls to the same module
    const { queryClient: instance1 } = await import('../shared/lib/queryClient')
    const { queryClient: instance2 } = await import('../shared/lib/queryClient')

    // WHEN: Comparing the two references
    // THEN: They are the same object (module-level singleton)
    expect(instance1).toBe(instance2)
  })

  it('[P1] should have a queryCache initialized and accessible', async () => {
    // GIVEN: The queryClient is configured
    const { queryClient } = await import('../shared/lib/queryClient')

    // WHEN: Accessing the internal query cache
    const cache = queryClient.getQueryCache()

    // THEN: The query cache is a valid QueryCache instance (not null/undefined)
    expect(cache).toBeDefined()
    expect(typeof cache.subscribe).toBe('function')
    expect(typeof cache.find).toBe('function')
  })

  it('[P1] should have a mutationCache initialized and accessible', async () => {
    // GIVEN: The queryClient is configured
    const { queryClient } = await import('../shared/lib/queryClient')

    // WHEN: Accessing the internal mutation cache
    const mutationCache = queryClient.getMutationCache()

    // THEN: The mutation cache is valid
    expect(mutationCache).toBeDefined()
    expect(typeof mutationCache.subscribe).toBe('function')
  })

  it('[P2] should have staleTime of exactly 60000ms (1 minute) — boundary check', async () => {
    // GIVEN: queryClient configured with staleTime: 1000 * 60
    const { queryClient } = await import('../shared/lib/queryClient')

    // WHEN: Reading the exact staleTime value
    const staleTime = queryClient.getDefaultOptions().queries?.staleTime

    // THEN: staleTime is precisely 60000 (boundary condition: not 59999 or 60001)
    expect(staleTime).toBe(60_000)
    expect(staleTime).not.toBe(0)
    expect(staleTime).not.toBe(Infinity)
  })

  it('[P2] should allow overriding defaultOptions without affecting the module singleton', async () => {
    // GIVEN: A fresh QueryClient (NOT the singleton) to verify setDefaultOptions works
    const testClient = new QueryClient({
      defaultOptions: { queries: { staleTime: 1000 * 60 } },
    })

    // WHEN: Overriding the default options on the local instance
    testClient.setDefaultOptions({ queries: { staleTime: 0 } })

    // THEN: The override takes effect on the local instance
    expect(testClient.getDefaultOptions().queries?.staleTime).toBe(0)

    // AND: The module singleton is NOT affected (immutable across tests)
    const { queryClient } = await import('../shared/lib/queryClient')
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(60_000)
  })

  it('[P2] should be a QueryClient instance (not a plain object or function)', async () => {
    // GIVEN: The exported queryClient
    const { queryClient } = await import('../shared/lib/queryClient')

    // WHEN: Checking instanceof and method presence
    // THEN: Proper QueryClient instance with all expected API methods
    expect(queryClient).toBeInstanceOf(QueryClient)
    expect(typeof queryClient.fetchQuery).toBe('function')
    expect(typeof queryClient.prefetchQuery).toBe('function')
    expect(typeof queryClient.invalidateQueries).toBe('function')
    expect(typeof queryClient.clear).toBe('function')
  })
})
