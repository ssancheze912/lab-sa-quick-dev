/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit tests — queryClient (TanStack Query default configuration)
 *
 * Edge case not covered by the ATDD suite: the singleton QueryClient must
 * carry the project-mandated default staleTime (60s) so future features
 * built on top of it don't silently refetch on every mount.
 */
import { describe, expect, test } from 'vitest'
import { queryClient } from './queryClient'

describe('queryClient configuration', () => {
  test('[P2] should default query staleTime to 60 seconds', () => {
    // GIVEN: the singleton QueryClient exported for the app
    // WHEN: reading its default query options
    const { staleTime } = queryClient.getDefaultOptions().queries ?? {}

    // THEN: staleTime is explicitly configured (not left at TanStack's 0 default)
    expect(staleTime).toBe(1000 * 60)
  })

  test('[P3] should export a single shared QueryClient instance', async () => {
    // GIVEN/WHEN: importing the module twice (ESM module cache)
    const first = await import('./queryClient')
    const second = await import('./queryClient')

    // THEN: both imports resolve to the exact same instance (singleton)
    expect(first.queryClient).toBe(second.queryClient)
  })
})
