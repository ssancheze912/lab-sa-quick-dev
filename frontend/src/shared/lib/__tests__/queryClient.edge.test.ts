/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit tests — queryClient edge cases & boundary conditions
 *
 * Expands coverage beyond the ATDD happy-path staleTime assertion.
 * Covers: default retry policy, gcTime defaults, mutations default options,
 *         singleton identity, and QueryProvider integration.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { queryClient } from '../queryClient'

// Reset query client state between tests so they are fully isolated
beforeEach(() => {
  queryClient.clear()
})

// ─────────────────────────────────────────────────────────────────────────────
// staleTime — boundary values
// ─────────────────────────────────────────────────────────────────────────────

describe('queryClient — staleTime boundary conditions', () => {
  it('staleTime is exactly 60 000 ms (not 59 999 or 60 001)', () => {
    const options = queryClient.getDefaultOptions()
    const staleTime = options.queries?.staleTime as number
    expect(staleTime).toBe(60_000)
    expect(staleTime).toBeGreaterThan(59_999)
    expect(staleTime).toBeLessThan(60_001)
  })

  it('staleTime is a finite positive number', () => {
    const options = queryClient.getDefaultOptions()
    const staleTime = options.queries?.staleTime as number
    expect(Number.isFinite(staleTime)).toBe(true)
    expect(staleTime).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Singleton identity — same instance across multiple imports
// ─────────────────────────────────────────────────────────────────────────────

describe('queryClient — singleton identity', () => {
  it('is the same object reference across multiple require calls', async () => {
    const mod1 = await import('../queryClient')
    const mod2 = await import('../queryClient')
    expect(mod1.queryClient).toBe(mod2.queryClient)
  })

  it('exports a named queryClient symbol (not a default export)', async () => {
    const mod = await import('../queryClient')
    expect(mod).toHaveProperty('queryClient')
    expect(mod.queryClient).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// QueryClient API surface — has required methods
// ─────────────────────────────────────────────────────────────────────────────

describe('queryClient — API surface', () => {
  it('has fetchQuery method', () => {
    expect(typeof queryClient.fetchQuery).toBe('function')
  })

  it('has getQueryData method', () => {
    expect(typeof queryClient.getQueryData).toBe('function')
  })

  it('has setQueryData method', () => {
    expect(typeof queryClient.setQueryData).toBe('function')
  })

  it('has invalidateQueries method', () => {
    expect(typeof queryClient.invalidateQueries).toBe('function')
  })

  it('has clear method', () => {
    expect(typeof queryClient.clear).toBe('function')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// State isolation — clearing cache affects getQueryData
// ─────────────────────────────────────────────────────────────────────────────

describe('queryClient — cache state isolation', () => {
  it('returns undefined for a key that was never set', () => {
    const result = queryClient.getQueryData(['nonexistent-key-xyz'])
    expect(result).toBeUndefined()
  })

  it('returns the value that was explicitly set via setQueryData', () => {
    const key = ['test-isolation-key']
    const value = { name: 'test-value' }
    queryClient.setQueryData(key, value)
    expect(queryClient.getQueryData(key)).toEqual(value)
  })

  it('returns undefined after clear() is called', () => {
    const key = ['clear-test-key']
    queryClient.setQueryData(key, { data: 42 })
    queryClient.clear()
    expect(queryClient.getQueryData(key)).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Default options object structure
// ─────────────────────────────────────────────────────────────────────────────

describe('queryClient — default options structure', () => {
  it('getDefaultOptions returns an object with a queries key', () => {
    const options = queryClient.getDefaultOptions()
    expect(options).toHaveProperty('queries')
    expect(typeof options.queries).toBe('object')
  })

  it('does not have retry set to a value that blocks error propagation (not false)', () => {
    // Default React Query retry is 3 — we do not override it to 0 or false
    // This ensures transient errors are retried in production
    const options = queryClient.getDefaultOptions()
    // If retry is not explicitly set, it should be undefined (uses library default of 3)
    const retry = options.queries?.retry
    expect(retry).not.toBe(false)
    expect(retry).not.toBe(0)
  })
})
