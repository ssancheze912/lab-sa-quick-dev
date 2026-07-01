import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'

/**
 * Story 1.1 — Unit coverage for the singleton QueryClient.
 * Prevents regressions on defaultOptions.queries.staleTime, which controls
 * how long React Query caches remain fresh across the app.
 */
describe('queryClient (Story 1.1 shared infrastructure)', () => {
  it('[P2] should export a QueryClient instance', () => {
    // GIVEN: the shared queryClient module
    // WHEN: the singleton is imported
    // THEN: it is an instance of TanStack Query's QueryClient
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('[P2] should configure defaultOptions.queries.staleTime to 60_000 ms (60s)', () => {
    // GIVEN: the shared queryClient
    // WHEN: reading its default options
    const defaults = queryClient.getDefaultOptions()

    // THEN: staleTime is exactly 60 seconds
    expect(defaults.queries?.staleTime).toBe(60_000)
  })

  it('[P3] should be a singleton — repeated imports return the same reference', async () => {
    // GIVEN: two dynamic imports of the same module
    const { queryClient: a } = await import('./queryClient')
    const { queryClient: b } = await import('./queryClient')

    // THEN: same reference (singleton pattern is preserved)
    expect(a).toBe(b)
    expect(a).toBe(queryClient)
  })
})
