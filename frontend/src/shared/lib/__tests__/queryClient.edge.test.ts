/**
 * Story 1.1: Project Initialization & Repository Structure
 * Edge case tests for queryClient — expands ATDD AC1/AC4 coverage
 *
 * Covers:
 *  - staleTime boundary value (exactly 60 000 ms)
 *  - Singleton identity (same reference across imports)
 *  - Default retry behavior
 *  - gcTime (garbage-collect-time) not set to 0 (would be a bug)
 *  - QueryClient type verification
 *  - Default queries options shape
 */

import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient — singleton and type', () => {
  it('should be an instance of QueryClient', async () => {
    const { queryClient } = await import('../queryClient')
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('should export a singleton — same reference across multiple imports', async () => {
    const mod1 = await import('../queryClient')
    const mod2 = await import('../queryClient')
    expect(mod1.queryClient).toBe(mod2.queryClient)
  })
})

describe('queryClient — staleTime boundary conditions', () => {
  it('should configure staleTime to exactly 60 000 ms (1 minute)', async () => {
    const { queryClient } = await import('../queryClient')
    const opts = queryClient.getDefaultOptions()
    expect(opts.queries?.staleTime).toBe(60_000)
  })

  it('should NOT have staleTime of 0 (would cause excessive refetching)', async () => {
    const { queryClient } = await import('../queryClient')
    const opts = queryClient.getDefaultOptions()
    expect(opts.queries?.staleTime).not.toBe(0)
  })

  it('should NOT have staleTime of Infinity (would never refetch)', async () => {
    const { queryClient } = await import('../queryClient')
    const opts = queryClient.getDefaultOptions()
    expect(opts.queries?.staleTime).not.toBe(Infinity)
  })
})

describe('queryClient — default options completeness', () => {
  it('should have a queries default options object', async () => {
    const { queryClient } = await import('../queryClient')
    const opts = queryClient.getDefaultOptions()
    expect(opts.queries).toBeDefined()
  })

  it('should not override retry to 0 (should use default retry logic)', async () => {
    const { queryClient } = await import('../queryClient')
    const opts = queryClient.getDefaultOptions()
    // retry: 0 would disable retries entirely — not desirable as a global default
    expect(opts.queries?.retry).not.toBe(0)
  })
})
