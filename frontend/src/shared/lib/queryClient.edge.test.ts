/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — QueryClient Edge Cases (automate expansion)
 * Covers: queryClient configuration boundary conditions and behaviors
 * not addressed by the ATDD acceptance tests or queryClient.test.ts.
 *
 * Test levels: Unit (Vitest)
 * Priority: P1 (core data-fetching infrastructure used by all feature stories)
 */

import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'

describe('[P1] queryClient — edge cases and boundary conditions', () => {
  describe('singleton identity', () => {
    it('[P1] should export the same instance across multiple imports (ES module singleton)', async () => {
      // GIVEN: Multiple parts of the app import queryClient
      // WHEN: Two separate dynamic imports are resolved
      const modA = await import('./queryClient')
      const modB = await import('./queryClient')

      // THEN: Both refer to the same QueryClient instance
      expect(modA.queryClient).toBe(modB.queryClient)
    })

    it('[P1] should be a named export (not a default export)', async () => {
      // GIVEN: Company standards require named exports
      // WHEN: The module is inspected
      const mod = await import('./queryClient')

      // THEN: queryClient is a named export and is defined
      expect(mod.queryClient).toBeDefined()
    })
  })

  describe('default options — boundary values', () => {
    it('[P1] staleTime should be exactly 60000ms (1 minute — not 0 or Infinity)', () => {
      // GIVEN: The queryClient is configured with staleTime: 1000 * 60
      // WHEN: Default query options are read
      const defaultOptions = queryClient.getDefaultOptions()

      // THEN: staleTime is 60000 (boundary: avoids excessive refetching vs stale data risk)
      expect(defaultOptions.queries?.staleTime).toBe(60000)
    })

    it('[P2] staleTime should NOT be 0 (which would cause over-fetching on every mount)', () => {
      // GIVEN: staleTime of 0 means data is always stale — causes network storms on busy UIs
      // WHEN: Default query options are read
      const defaultOptions = queryClient.getDefaultOptions()

      // THEN: staleTime is not 0
      expect(defaultOptions.queries?.staleTime).not.toBe(0)
    })

    it('[P2] staleTime should NOT be Infinity (which would prevent any background refetching)', () => {
      // GIVEN: staleTime of Infinity means data is never considered stale
      // WHEN: Default query options are read
      const defaultOptions = queryClient.getDefaultOptions()

      // THEN: staleTime is not Infinity (allows background refresh after 1 minute)
      expect(defaultOptions.queries?.staleTime).not.toBe(Infinity)
    })
  })

  describe('QueryClient instance type', () => {
    it('[P1] should be a QueryClient instance (not a plain object)', () => {
      // GIVEN: The queryClient module is imported
      // WHEN: The type is inspected
      // THEN: It is an actual QueryClient instance
      expect(queryClient).toBeInstanceOf(QueryClient)
    })

    it('[P1] should have a queryCache accessible', () => {
      // GIVEN: A properly initialized QueryClient exposes its queryCache
      // WHEN: The cache is accessed
      // THEN: The queryCache is defined (needed for invalidation and prefetching)
      expect(queryClient.getQueryCache()).toBeDefined()
    })

    it('[P1] should have a mutationCache accessible', () => {
      // GIVEN: A properly initialized QueryClient exposes its mutationCache
      // WHEN: The mutation cache is accessed
      // THEN: The mutationCache is defined (required for mutation lifecycle hooks)
      expect(queryClient.getMutationCache()).toBeDefined()
    })
  })

  describe('QueryClient API surface', () => {
    it('[P1] should expose standard cache management methods', () => {
      // GIVEN: The queryClient is a proper QueryClient instance
      // WHEN: Core methods are checked
      // THEN: All essential methods are present (required by feature stories)
      expect(typeof queryClient.invalidateQueries).toBe('function')
      expect(typeof queryClient.prefetchQuery).toBe('function')
      expect(typeof queryClient.setQueryData).toBe('function')
      expect(typeof queryClient.getQueryData).toBe('function')
      expect(typeof queryClient.cancelQueries).toBe('function')
    })
  })
})
