/**
 * Story 1.1 — Expanded coverage for queryClient (edge cases).
 *
 * Baseline (queryClient.test.ts) only asserts staleTime. These tests exercise
 * additional invariants around singleton usage, cache isolation, and default
 * option boundaries.
 */
import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'

describe('queryClient — edge cases and boundary behaviour', () => {
  it('[P2] should be a QueryClient instance (not a plain object)', () => {
    // GIVEN/WHEN/THEN
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('[P2] should expose a QueryCache and MutationCache after construction', () => {
    // GIVEN: A configured QueryClient
    // WHEN: The internal caches are read
    const queryCache = queryClient.getQueryCache()
    const mutationCache = queryClient.getMutationCache()

    // THEN: Both caches are wired up (Tanstack Query invariant)
    expect(queryCache).toBeDefined()
    expect(mutationCache).toBeDefined()
  })

  it('[P2] should not set an unexpected retry override (uses Tanstack default)', () => {
    // GIVEN: queryClient.ts does not customise `retry`, so we should not read a custom value
    const options = queryClient.getDefaultOptions()

    // THEN: retry is undefined on the queries branch (default = 3 comes from the lib itself)
    expect(options.queries?.retry).toBeUndefined()
  })

  it('[P2] should treat staleTime as a positive integer number', () => {
    // GIVEN: staleTime is `1000 * 60` (60 000 ms)
    const options = queryClient.getDefaultOptions()
    const staleTime = options.queries?.staleTime as number | undefined

    // WHEN/THEN
    expect(typeof staleTime).toBe('number')
    expect(staleTime).toBeGreaterThan(0)
    expect(Number.isInteger(staleTime)).toBe(true)
  })

  it('[P2] should be a singleton reused across imports', async () => {
    // GIVEN: queryClient.ts exports a single QueryClient
    const again = await import('./queryClient')

    // WHEN/THEN: The same reference is returned on re-import
    expect(again.queryClient).toBe(queryClient)
  })
})
