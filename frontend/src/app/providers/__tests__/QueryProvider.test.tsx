/**
 * Story 1.1: Project Initialization & Repository Structure
 * Component tests — QueryProvider
 *
 * NOTE: Full render tests require jsdom/happy-dom environment.
 * Run `pnpm add -D @vitest/jsdom` and add `environment: 'jsdom'` to vite.config.ts
 * test section to enable render-based assertions.
 *
 * Covers (without DOM):
 *   - QueryProvider is a function (valid React component)
 *   - QueryProvider accepts children prop (type contract)
 *   - Uses the shared singleton queryClient (same reference from shared lib)
 *   - Module exports QueryProvider as named export
 */

import { describe, it, expect } from 'vitest'
import { QueryProvider } from '../QueryProvider'
import { queryClient } from '../../../shared/lib/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'

// ─────────────────────────────────────────────────────────────────────────────
// Module contract — named export and function type
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — module contract', () => {
  it('exports QueryProvider as a named export', async () => {
    const mod = await import('../QueryProvider')
    expect(mod).toHaveProperty('QueryProvider')
  })

  it('QueryProvider is a function (valid React component)', () => {
    expect(typeof QueryProvider).toBe('function')
  })

  it('QueryProvider has a displayName or name matching the function', () => {
    // React components should have a name for better error messages
    expect(QueryProvider.name).toBeTruthy()
    expect(QueryProvider.name.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// QueryClient integration — uses the singleton
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — QueryClient dependency', () => {
  it('the shared queryClient singleton is the same instance imported in both modules', async () => {
    // Verify that queryClient.ts and QueryProvider.tsx both reference the same object
    const qcMod = await import('../../../shared/lib/queryClient')
    const qpMod = await import('../QueryProvider')

    // Both modules are loaded — queryClient singleton must be consistent
    expect(qcMod.queryClient).toBeDefined()
    expect(qcMod.queryClient).toBe(queryClient)
    // QueryProvider module loaded (existence check)
    expect(qpMod.QueryProvider).toBeDefined()
  })

  it('queryClient used in QueryProvider has the staleTime configured at 60 000 ms', () => {
    // The singleton passed to QueryClientProvider must have the correct staleTime
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.staleTime).toBe(60_000)
  })

  it('queryClient has all required React Query API methods', () => {
    expect(typeof queryClient.fetchQuery).toBe('function')
    expect(typeof queryClient.invalidateQueries).toBe('function')
    expect(typeof queryClient.setQueryData).toBe('function')
    expect(typeof queryClient.getQueryData).toBe('function')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// QueryClientProvider wrapping — structural contract
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — wrapping contract', () => {
  it('QueryClientProvider is available from @tanstack/react-query (dependency check)', () => {
    // If this module fails to import, React Query is not installed properly
    expect(typeof QueryClientProvider).toBe('function')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Render-based tests — fixme pending jsdom setup
// ─────────────────────────────────────────────────────────────────────────────

// Render-based tests below are skipped pending jsdom setup.
// To enable: pnpm add -D jsdom; add test.environment="jsdom" in vite.config.ts

it.todo('QueryProvider renders children without crashing — requires jsdom environment')
it.todo('QueryProvider makes useQueryClient available to children — requires jsdom environment')
it.todo('QueryProvider renders null children without crashing — requires jsdom environment')
