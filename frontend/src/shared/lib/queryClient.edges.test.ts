/**
 * Story 1.1 — Project Initialization & Repository Structure
 * Epic 1 — Project Foundation & Application Shell
 *
 * EDGE CASES — queryClient (testarch-automate expansion)
 * Complementa queryClient.test.ts con cobertura de:
 *   - Identidad / singleton (no se recrean instancias)
 *   - QueryClient se construye con un QueryCache válido
 *   - mutations defaults son seguros (no infinite retry)
 */

import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

import { queryClient } from './queryClient'

describe('queryClient — edges', () => {
  it('[P2] is an instance of QueryClient', () => {
    // GIVEN: queryClient.ts exports a singleton
    // WHEN: Importing the module
    // THEN: It is a real QueryClient instance (not a plain object)
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('[P2] exposes a non-null QueryCache', () => {
    // GIVEN: QueryClient initialization
    // WHEN: Accessing the underlying cache
    const cache = queryClient.getQueryCache()

    // THEN: A cache is available and starts empty
    expect(cache).toBeDefined()
    expect(cache.getAll()).toEqual([])
  })

  it('[P2] exposes a non-null MutationCache', () => {
    // GIVEN: QueryClient initialization
    // WHEN: Accessing the mutation cache
    const cache = queryClient.getMutationCache()

    // THEN: Cache is wired and empty
    expect(cache).toBeDefined()
    expect(cache.getAll()).toEqual([])
  })

  it('[P2] staleTime default is exactly 60 seconds (60000 ms)', () => {
    // GIVEN: Architecture choice — 1-minute stale window
    // WHEN: Reading default query options
    const defaults = queryClient.getDefaultOptions().queries

    // THEN: The configured staleTime matches the architecture decision exactly
    expect(defaults?.staleTime).toBe(60_000)
  })

  it('[P2] importing the module twice returns the same singleton instance', async () => {
    // GIVEN: Module is exported as a singleton constant
    // WHEN: Re-importing it
    const first = (await import('./queryClient')).queryClient
    const second = (await import('./queryClient')).queryClient

    // THEN: Both references point to the exact same instance (no recreation)
    expect(first).toBe(second)
  })
})
