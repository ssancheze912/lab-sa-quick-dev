import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'

/**
 * Unit tests for queryClient (TanStack React Query singleton)
 *
 * Validates the data-layer infrastructure required by Story 1.1 AC #1
 * (frontend stack initialized) and ensures regression guards on the
 * staleTime config that downstream stories (1.2, 2.x, 3.x) depend on.
 */
describe('queryClient', () => {
  // ─── Original ATDD-level assertions (preserved) ──────────────────────────
  it('[P1] exports a configured QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('[P1] configures default staleTime of 60 seconds', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBe(60_000)
  })

  // ─── Edge cases (automate phase expansion) ───────────────────────────────
  describe('Edge cases — singleton semantics', () => {
    it('[P2] should expose the same instance on repeated imports (module singleton)', async () => {
      // GIVEN: queryClient is exported as a module-level const
      // WHEN: Importing the module twice
      const moduleA = await import('./queryClient')
      const moduleB = await import('./queryClient')

      // THEN: Both imports yield the exact same instance reference
      expect(moduleA.queryClient).toBe(moduleB.queryClient)
      expect(moduleA.queryClient).toBe(queryClient)
    })

    it('[P2] should expose a fully functional query cache', () => {
      // GIVEN: The QueryClient instance
      // WHEN: Accessing the query cache
      // THEN: It is defined and is an instance with `subscribe` and `clear` methods
      const cache = queryClient.getQueryCache()
      expect(cache).toBeDefined()
      expect(typeof cache.subscribe).toBe('function')
      expect(typeof cache.clear).toBe('function')
    })

    it('[P2] should expose a fully functional mutation cache', () => {
      // GIVEN: The QueryClient instance
      // WHEN: Accessing the mutation cache
      // THEN: It is defined and is an instance with `subscribe` and `clear` methods
      const cache = queryClient.getMutationCache()
      expect(cache).toBeDefined()
      expect(typeof cache.subscribe).toBe('function')
      expect(typeof cache.clear).toBe('function')
    })
  })

  describe('Edge cases — default options sanity', () => {
    it('[P2] should NOT define mutations defaults (no global retry/cache for mutations)', () => {
      // GIVEN: Only queries.staleTime is configured in queryClient.ts
      // WHEN: Inspecting defaultOptions.mutations
      // THEN: Mutations defaults are undefined (intentional — story 1.1 scope)
      const defaults = queryClient.getDefaultOptions()
      expect(defaults.mutations).toBeUndefined()
    })

    it('[P2] should expose query defaults that match the configured staleTime', () => {
      // GIVEN: queries.staleTime = 60_000
      // WHEN: Reading defaultOptions.queries
      // THEN: staleTime is exactly 60_000 (no accidental change)
      const queries = queryClient.getDefaultOptions().queries
      expect(queries).toBeDefined()
      expect(queries?.staleTime).toBe(60_000)
    })

    it('[P2] should not auto-retry queries by an unexpected count (uses TanStack default)', () => {
      // GIVEN: No retry override is configured in queryClient.ts
      // WHEN: Inspecting queries.retry
      // THEN: retry is undefined — falls back to TanStack's default behavior
      const queries = queryClient.getDefaultOptions().queries
      expect(queries?.retry).toBeUndefined()
    })
  })

  describe('Edge cases — runtime behavior', () => {
    it('[P2] should allow setQueryData / getQueryData round-trips', () => {
      // GIVEN: An empty cache
      // WHEN: Writing arbitrary data under a key and reading it back
      const key = ['test-roundtrip', 'unit', Math.random()]
      const payload = { id: 1, name: 'Cliente Test' }
      queryClient.setQueryData(key, payload)

      // THEN: The value is retrievable
      expect(queryClient.getQueryData(key)).toEqual(payload)

      // Cleanup
      queryClient.removeQueries({ queryKey: key })
      expect(queryClient.getQueryData(key)).toBeUndefined()
    })

    it('[P2] should support cache invalidation without throwing', async () => {
      // GIVEN: A query key with no observers
      // WHEN: invalidateQueries is called
      // THEN: The promise resolves without throwing (regression guard)
      await expect(
        queryClient.invalidateQueries({ queryKey: ['nonexistent-key'] })
      ).resolves.not.toThrow()
    })
  })
})
