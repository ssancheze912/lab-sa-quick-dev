import { describe, it, expect } from 'vitest'
import { queryClient } from './queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient', () => {
  // --- Existing happy-path tests ---
  it('[P0] is a QueryClient instance', () => {
    // GIVEN: imported queryClient singleton
    // WHEN: checking its type
    // THEN: it is a QueryClient
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('[P0] has staleTime of 60 seconds', () => {
    // GIVEN: queryClient default options
    // WHEN: reading queries staleTime
    const defaultOptions = queryClient.getDefaultOptions()
    // THEN: staleTime is exactly 60000 ms
    expect(defaultOptions.queries?.staleTime).toBe(60000)
  })

  // --- Singleton: same reference on repeated imports ---
  it('[P1] exports a single shared instance (singleton reference)', async () => {
    // GIVEN: queryClient imported again
    const { queryClient: second } = await import('./queryClient')
    // WHEN: comparing object references
    // THEN: they are identical (module cache)
    expect(queryClient).toBe(second)
  })

  // --- Edge: default retry behavior ---
  it('[P2] does not override default retry count (uses react-query default of 3)', () => {
    // GIVEN: queryClient default options
    const defaultOptions = queryClient.getDefaultOptions()
    // WHEN: checking retry setting
    // THEN: retry is undefined (not explicitly overridden, relies on library default)
    expect(defaultOptions.queries?.retry).toBeUndefined()
  })

  // --- Edge: gcTime (formerly cacheTime) uses library default ---
  it('[P2] gcTime is not explicitly set (uses react-query default)', () => {
    // GIVEN: queryClient default options
    const defaultOptions = queryClient.getDefaultOptions()
    // WHEN: reading gcTime
    // THEN: gcTime is undefined (not configured, library default applies)
    expect(defaultOptions.queries?.gcTime).toBeUndefined()
  })

  // --- Edge: mutations have no explicit default options ---
  it('[P2] mutations section of defaultOptions is not configured', () => {
    // GIVEN: queryClient default options
    const defaultOptions = queryClient.getDefaultOptions()
    // WHEN: reading mutations
    // THEN: no mutation defaults set
    const mutationDefaults = defaultOptions.mutations
    expect(mutationDefaults?.retry).toBeUndefined()
  })

  // --- Error path: queryClient can be cleared without throwing ---
  it('[P1] clear() method empties the cache without throwing', () => {
    // GIVEN: a running queryClient
    // WHEN: calling clear()
    // THEN: no exception is thrown
    expect(() => queryClient.clear()).not.toThrow()
  })
})
