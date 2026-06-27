import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'

/**
 * Story 1.1 — queryClient Boundary Conditions: Retry & Mutation Defaults
 *
 * BMad-Integrated: Expands coverage for queryClient beyond what is tested in
 * queryClient.test.ts (basic) and queryClient.edge.test.ts (gcTime, singleton, clear).
 *
 * Gaps covered:
 *   - retry count is configured to 1 (not 0 and not the library default of 3)
 *   - staleTime is 5 minutes (300 000 ms) — the actual configured value, not 1 minute
 *   - defaultOptions.mutations is not configured (undefined is acceptable for Story 1.1)
 *   - queryClient.isFetching() returns 0 when no queries are active
 *   - queryClient.isMutating() returns 0 when no mutations are active
 *
 * Test IDs: UNIT-FE-QC-STORY11-01 … UNIT-FE-QC-STORY11-05
 */

describe('queryClient — Story 1.1 boundary conditions', () => {
  it('[P1] UNIT-FE-QC-STORY11-01 — retry is set to 1 (not 0 and not the library default of 3)', () => {
    // GIVEN: queryClient.ts configures retry: 1 per story dev notes
    // WHEN: The retry count is read from defaultOptions
    const retry = queryClient.getDefaultOptions().queries?.retry

    // THEN: Exactly 1 retry (not 0 = no retries, not 3 = library default)
    // This boundary condition matters for transient network errors: one retry is the
    // project default to recover from momentary backend blips without overloading the server.
    expect(retry).toBe(1)
  })

  it('[P1] UNIT-FE-QC-STORY11-02 — staleTime is exactly 300000ms (5 minutes)', () => {
    // GIVEN: queryClient.ts configures staleTime: 1000 * 60 * 5
    // WHEN: The staleTime value is read
    const staleTime = queryClient.getDefaultOptions().queries?.staleTime

    // THEN: Exactly 300000ms — the value in the actual source file (not 60000ms/1min)
    // Note: Previous edge tests inherited an incorrect expected value of 60000.
    // The actual implementation uses 1000 * 60 * 5 = 300000ms per the queryClient.ts source.
    expect(staleTime).toBe(300_000)
  })

  it('[P2] UNIT-FE-QC-STORY11-03 — defaultOptions.mutations is not set (no global mutation config in Story 1.1)', () => {
    // GIVEN: Story 1.1 only sets up the query defaults — no global mutation configuration
    // WHEN: The mutations defaultOptions are inspected
    const mutations = queryClient.getDefaultOptions().mutations

    // THEN: Mutations default config is undefined (no global overrides for Story 1.1 shell)
    // Future stories (e.g. create cliente) may add mutation defaults
    expect(mutations).toBeUndefined()
  })

  it('[P2] UNIT-FE-QC-STORY11-04 — isFetching() returns 0 when no queries are active', () => {
    // GIVEN: The queryClient is in an idle state (no active queries in unit test context)
    queryClient.clear()

    // WHEN: The number of actively fetching queries is checked
    const fetchingCount = queryClient.isFetching()

    // THEN: Zero active fetches (boundary: unit tests must not trigger real network calls)
    expect(fetchingCount).toBe(0)
  })

  it('[P2] UNIT-FE-QC-STORY11-05 — isMutating() returns 0 when no mutations are active', () => {
    // GIVEN: The queryClient has no in-flight mutations
    queryClient.clear()

    // WHEN: The number of active mutations is checked
    const mutatingCount = queryClient.isMutating()

    // THEN: Zero active mutations
    expect(mutatingCount).toBe(0)
  })
})
