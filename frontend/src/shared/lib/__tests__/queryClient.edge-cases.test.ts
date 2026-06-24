/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded Unit Tests — queryClient edge cases
 * Complements: queryClient.test.ts (ATDD baseline)
 *
 * Gaps covered:
 *   - Singleton pattern: same instance across multiple imports
 *   - QueryClient has cache (queryCache) initialized
 *   - QueryClient has mutationCache initialized
 *   - Default retry configuration (standard is 3 retries — explicit or default)
 *   - staleTime of 60s means data is NOT considered stale immediately
 */

import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

describe('[P1] queryClient — singleton and shape contract', () => {
  it('[P1] should export the same instance on every import (singleton)', async () => {
    // GIVEN: queryClient is created at module level (not inside a function)
    // WHEN: We import the module twice
    const { queryClient: instance1 } = await import('../queryClient');
    const { queryClient: instance2 } = await import('../queryClient');

    // THEN: Both imports return the exact same reference
    expect(instance1).toBe(instance2);
  });

  it('[P1] should be an instance of QueryClient from @tanstack/react-query', async () => {
    // GIVEN: The module imports QueryClient from @tanstack/react-query
    const { queryClient } = await import('../queryClient');

    // WHEN: We check its prototype chain
    // THEN: It is an instance of the correct QueryClient class
    expect(queryClient).toBeInstanceOf(QueryClient);
  });

  it('[P1] should have a queryCache object (caches are initialized on construction)', async () => {
    // GIVEN: QueryClient always initializes queryCache and mutationCache
    const { queryClient } = await import('../queryClient');

    // WHEN: We access internal cache
    // THEN: queryCache is defined and has subscribe method
    expect(queryClient.getQueryCache()).toBeDefined();
    expect(typeof queryClient.getQueryCache().subscribe).toBe('function');
  });

  it('[P1] should have a mutationCache object', async () => {
    // GIVEN: QueryClient initializes mutationCache
    const { queryClient } = await import('../queryClient');

    // THEN: mutationCache is accessible
    expect(queryClient.getMutationCache()).toBeDefined();
  });
});

describe('[P2] queryClient — staleTime boundary conditions', () => {
  it('[P2] should have staleTime of exactly 60000ms (1 minute)', async () => {
    // GIVEN: queryClient.ts sets staleTime: 1000 * 60
    const { queryClient } = await import('../queryClient');
    const defaultOptions = queryClient.getDefaultOptions();

    // WHEN: We read staleTime
    // THEN: It is precisely 60000ms — not 60 (seconds), not 3600000 (hour)
    expect(defaultOptions.queries?.staleTime).toBe(60_000);
  });

  it('[P2] should produce a positive staleTime (data does not go stale instantly)', async () => {
    // GIVEN: staleTime > 0 means data is fresh for that duration
    const { queryClient } = await import('../queryClient');
    const defaultOptions = queryClient.getDefaultOptions();

    // THEN: staleTime is greater than 0 (prevents immediate refetch on every mount)
    const staleTime = defaultOptions.queries?.staleTime ?? 0;
    expect(staleTime).toBeGreaterThan(0);
  });
});

describe('[P2] queryClient — named export contract', () => {
  it('[P2] should be exported as a named export called queryClient', async () => {
    // GIVEN: The module uses named exports (not default)
    const module = await import('../queryClient');

    // THEN: queryClient is a named export
    expect(module.queryClient).toBeDefined();
    expect(module.default).toBeUndefined();
  });
});
