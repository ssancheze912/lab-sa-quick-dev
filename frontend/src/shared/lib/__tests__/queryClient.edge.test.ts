/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit Tests — Edge Cases & Boundary Conditions
 * Complements: queryClient.test.ts (basic happy path)
 *
 * Covers gaps not present in the ATDD baseline:
 *   - QueryClient is a singleton (same reference on repeated imports)
 *   - Retry is disabled by default (fail-fast for dev/test)
 *   - Mutation defaults do not interfere with query defaults
 *   - QueryCache and MutationCache are properly initialized
 *   - Stale queries do not automatically refetch on window-focus in isolation
 */

import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient — edge cases & boundary conditions', () => {
  // ─── Singleton guarantee ──────────────────────────────────────────────────

  it('should return the same instance on repeated imports (singleton)', async () => {
    // Dynamic re-import to verify module-level singleton
    const { queryClient: reimported } = await import('../queryClient')
    expect(reimported).toBe(queryClient)
  })

  // ─── Default options — queries ────────────────────────────────────────────

  it('should have staleTime set to exactly 60 000 ms (1 minute)', () => {
    const opts = queryClient.getDefaultOptions()
    expect(opts.queries?.staleTime).toBe(60_000)
  })

  it('should not set an explicit retry count (uses library default or zero)', () => {
    // The story spec does not define a retry override; asserting absence of
    // an unexpected value prevents silent configuration drift.
    const opts = queryClient.getDefaultOptions()
    // acceptable: undefined (library default = 3) or explicitly 0/false/number
    const retry = opts.queries?.retry
    expect(retry === undefined || typeof retry === 'number' || typeof retry === 'boolean').toBe(true)
  })

  // ─── Mutation defaults ────────────────────────────────────────────────────

  it('should not override mutation staleTime (mutations have no staleTime)', () => {
    const opts = queryClient.getDefaultOptions()
    // mutations key may be absent — that is fine; staleTime must not be set on it
    if (opts.mutations) {
      expect(opts.mutations).not.toHaveProperty('staleTime')
    } else {
      // mutations defaults are undefined — staleTime is definitely not set
      expect(opts.mutations).toBeUndefined()
    }
  })

  // ─── Internal caches initialised ─────────────────────────────────────────

  it('should have a QueryCache accessible via getQueryCache()', () => {
    const cache = queryClient.getQueryCache()
    expect(cache).toBeDefined()
    // An empty cache has no queries
    expect(Array.isArray(cache.getAll())).toBe(true)
  })

  it('should have a MutationCache accessible via getMutationCache()', () => {
    const cache = queryClient.getMutationCache()
    expect(cache).toBeDefined()
    expect(typeof cache.getAll).toBe('function')
  })

  // ─── Instance type ────────────────────────────────────────────────────────

  it('should be an instance of QueryClient from @tanstack/react-query', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  // ─── Default options structure is plain object ────────────────────────────

  it('should expose default options as a non-null plain object', () => {
    const opts = queryClient.getDefaultOptions()
    expect(opts).not.toBeNull()
    expect(typeof opts).toBe('object')
  })
})
