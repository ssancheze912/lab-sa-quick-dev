import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'

/**
 * Unit tests for the TanStack Query client singleton.
 *
 * Story 1.2 — Frontend Navigation Shell (Task 5 — QueryClient configuration)
 * Epic 1 — Project Foundation & Application Shell
 *
 * BMad-Integrated expansion — lib configuration coverage.
 *
 * Test IDs: UNIT-QC-01 through UNIT-QC-05
 */

describe('queryClient configuration', () => {
  /**
   * UNIT-QC-01 (P1)
   * The exported queryClient is a defined, non-null object.
   */
  it('UNIT-QC-01 — queryClient is defined', () => {
    expect(queryClient).toBeDefined()
    expect(queryClient).not.toBeNull()
  })

  /**
   * UNIT-QC-02 (P1)
   * The default staleTime is set to 5 minutes (300000ms) per dev notes.
   */
  it('UNIT-QC-02 — Default query staleTime is 5 minutes (300000ms)', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60 * 5)
  })

  /**
   * UNIT-QC-03 (P1)
   * The default retry count is 1 per dev notes (not the default 3).
   */
  it('UNIT-QC-03 — Default query retry count is 1', () => {
    const defaultOptions = queryClient.getDefaultOptions()
    expect(defaultOptions.queries?.retry).toBe(1)
  })

  /**
   * UNIT-QC-04 (P2)
   * The queryClient instance is a singleton — the same reference is returned
   * when the module is re-imported (module caching).
   */
  it('UNIT-QC-04 — queryClient is a singleton (same reference on re-import)', async () => {
    const { queryClient: sameInstance } = await import('../queryClient')
    expect(sameInstance).toBe(queryClient)
  })

  /**
   * UNIT-QC-05 (P2)
   * The queryClient has no active queries at initialization (clean state).
   */
  it('UNIT-QC-05 — queryClient has no active query cache entries at module load', () => {
    const cache = queryClient.getQueryCache()
    // A freshly imported module should not have stale queries from other tests
    // (Vitest isolates modules between test files by default)
    expect(cache).toBeDefined()
    // Verify that no query entries exist at initialization
    expect(cache.getAll()).toHaveLength(0)
  })
})
