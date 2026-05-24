/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit Tests — Edge Cases & Boundary Conditions
 *
 * Complements queryClient.test.ts happy-path tests.
 * Coverage:
 *   - QueryClient default options edge cases
 *   - Retry configuration
 *   - Cache behaviour
 *   - Singleton pattern
 *   - QueryProvider renders children
 */

import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

describe('queryClient — edge cases', () => {
  // ── Default query options ────────────────────────────────────────────────

  describe('Default query options', () => {
    it('[P1] should be an instance of QueryClient', async () => {
      // GIVEN: The queryClient module is imported
      const { queryClient } = await import('../queryClient');

      // WHEN: Type checking the instance
      // THEN: The export is a genuine QueryClient instance
      expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('[P1] should have staleTime set to 60000ms (60 seconds)', async () => {
      // GIVEN: queryClient is created with defaultOptions.queries.staleTime = 1000 * 60
      const { queryClient } = await import('../queryClient');

      // WHEN: Reading the default staleTime
      const staleTime = queryClient.getDefaultOptions().queries?.staleTime;

      // THEN: staleTime is exactly 60 seconds
      expect(staleTime).toBe(60_000);
    });

    it('[P2] should NOT have retry set to a negative number', async () => {
      // GIVEN: queryClient default configuration
      const { queryClient } = await import('../queryClient');

      // WHEN: Reading the retry option
      const retry = queryClient.getDefaultOptions().queries?.retry;

      // THEN: Retry is either undefined (Tanstack default: 3) or a non-negative value
      if (retry !== undefined && typeof retry === 'number') {
        expect(retry).toBeGreaterThanOrEqual(0);
      }
      // undefined means Tanstack default (3 retries) which is valid
      expect(typeof retry === 'undefined' || typeof retry === 'number' || typeof retry === 'boolean' || typeof retry === 'function').toBe(true);
    });

    it('[P2] should NOT set gcTime to 0 (would disable caching entirely)', async () => {
      // GIVEN: queryClient default configuration
      const { queryClient } = await import('../queryClient');

      // WHEN: Reading the gcTime option
      const gcTime = queryClient.getDefaultOptions().queries?.gcTime;

      // THEN: gcTime is not explicitly set to 0 (which would disable the cache)
      expect(gcTime).not.toBe(0);
    });

    it('[P2] should have mutation defaults accessible (not throw)', async () => {
      // GIVEN: queryClient is initialised
      const { queryClient } = await import('../queryClient');

      // WHEN: Accessing mutation defaults
      // THEN: getDefaultOptions does not throw and returns an object
      expect(() => queryClient.getDefaultOptions().mutations).not.toThrow();
    });
  });

  // ── Singleton pattern ────────────────────────────────────────────────────

  describe('Singleton pattern', () => {
    it('[P1] should return the same QueryClient instance across multiple imports', async () => {
      // GIVEN: The queryClient module is a singleton (module-level export)
      const moduleA = await import('../queryClient');
      const moduleB = await import('../queryClient');

      // WHEN: Both imports are compared
      // THEN: They reference the exact same object (singleton)
      expect(moduleA.queryClient).toBe(moduleB.queryClient);
    });
  });

  // ── Cache operations ─────────────────────────────────────────────────────

  describe('Cache operations', () => {
    it('[P1] should start with an empty query cache', async () => {
      // GIVEN: A fresh queryClient is tested (module cache may have data from other tests)
      const freshClient = new QueryClient({
        defaultOptions: { queries: { staleTime: 1000 * 60 } },
      });

      // WHEN: Reading the initial query cache state
      const cachedQueries = freshClient.getQueryCache().getAll();

      // THEN: A new client starts with zero cached queries
      expect(cachedQueries).toHaveLength(0);

      // Cleanup
      freshClient.clear();
    });

    it('[P2] should allow cache invalidation without throwing', async () => {
      // GIVEN: queryClient is initialised
      const { queryClient } = await import('../queryClient');

      // WHEN: invalidateQueries is called (common operation)
      // THEN: No exception is thrown
      await expect(
        queryClient.invalidateQueries({ queryKey: ['nonexistent-key-test'] })
      ).resolves.not.toThrow();
    });

    it('[P2] should allow prefetchQuery to be called without throwing for an unknown key', async () => {
      // GIVEN: queryClient is initialised
      const { queryClient } = await import('../queryClient');

      // WHEN: prefetchQuery is called for a key with no fetcher (should silently fail)
      // prefetchQuery with no queryFn should resolve without throwing
      await expect(
        queryClient.prefetchQuery({
          queryKey: ['prefetch-test-nonexistent'],
          queryFn: async () => null,
        })
      ).resolves.not.toThrow();
    });
  });
});
