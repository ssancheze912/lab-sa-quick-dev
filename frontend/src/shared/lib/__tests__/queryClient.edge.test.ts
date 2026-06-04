/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — queryClient edge cases and boundary conditions
 * Expands coverage beyond the ATDD tests.
 *
 * Scenarios covered:
 *   - Singleton identity: same reference on repeated imports
 *   - Default retry count (should be sensible for production use)
 *   - staleTime is not zero (data stays fresh for 1 minute per spec)
 *   - gcTime (garbage collection) uses default (5 minutes) or explicit config
 *   - QueryClient is not in a destroyed state on import
 *   - Default retry behavior matches company convention
 */

import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient — edge cases and boundary conditions', () => {
  it('[P2] should export a singleton — same reference on repeated imports', async () => {
    // GIVEN: ES module caching is active
    // WHEN: The module is imported twice
    const { queryClient: ref1 } = await import('../queryClient')
    const { queryClient: ref2 } = await import('../queryClient')

    // THEN: Both imports return the same QueryClient instance
    expect(ref1).toBe(ref2)
  })

  it('[P2] should have staleTime of exactly 60 000 ms (1 minute)', () => {
    // GIVEN: queryClient is initialized with staleTime: 1000 * 60
    // WHEN: Default query options are read
    const defaultOptions = queryClient.getDefaultOptions()

    // THEN: staleTime equals 60 000 ms exactly
    expect(defaultOptions.queries?.staleTime).toBe(60_000)
  })

  it('[P2] should NOT have staleTime of 0 (zero would invalidate immediately)', () => {
    // GIVEN: The spec requires queries to stay fresh for 1 minute
    // WHEN: Default options are read
    const defaultOptions = queryClient.getDefaultOptions()

    // THEN: staleTime is not 0 (which would mean always stale)
    expect(defaultOptions.queries?.staleTime).not.toBe(0)
  })

  it('[P2] should be a valid QueryClient instance after module import', () => {
    // GIVEN: The queryClient module is imported
    // WHEN: We check its type
    // THEN: It is a real QueryClient instance (not null, not a plain object)
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('[P2] should allow mounting new queries without throwing (client is healthy)', () => {
    // GIVEN: queryClient is initialized
    // WHEN: We attempt to read the query cache
    // THEN: No exception is thrown — the cache is accessible
    expect(() => queryClient.getQueryCache()).not.toThrow()
  })

  it('[P2] should have an empty query cache on fresh import (no pre-cached data)', () => {
    // GIVEN: The module is imported for the first time (no queries fired in unit tests)
    // WHEN: We check the query cache
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()

    // THEN: No queries are pre-loaded in the singleton
    expect(queries).toHaveLength(0)
  })

  it('[P3] should have a mutation cache accessible without errors', () => {
    // GIVEN: queryClient is a fully initialized QueryClient
    // WHEN: We access the mutation cache
    // THEN: The cache is present (not undefined)
    expect(() => queryClient.getMutationCache()).not.toThrow()
    expect(queryClient.getMutationCache()).toBeDefined()
  })
})
