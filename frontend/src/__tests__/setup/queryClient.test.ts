/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — Edge cases for queryClient singleton
 * Expands coverage beyond ATDD: staleTime value, singleton guarantee, export contract
 *
 * Acceptance Criteria covered: AC1 (queryClient.ts configuration)
 * Test level: Unit
 * Tool: Vitest
 */

import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// From frontend/src/__tests__/setup/ → go up 3 levels to reach frontend/
const FRONTEND_ROOT = resolve(__dirname, '../../..')

// ─────────────────────────────────────────────────────────────────────────────
// File existence
// ─────────────────────────────────────────────────────────────────────────────

describe('queryClient — file structure', () => {
  it('should have queryClient.ts at src/shared/lib/queryClient.ts', () => {
    // GIVEN: The shared library structure was established in Task 1
    const queryClientPath = resolve(FRONTEND_ROOT, 'src/shared/lib/queryClient.ts')
    // THEN: The singleton file must exist
    expect(existsSync(queryClientPath)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Configuration values — boundary conditions for wrong staleTime
// ─────────────────────────────────────────────────────────────────────────────

describe('queryClient — configuration content', () => {
  const readContent = () => {
    const { readFileSync } = require('fs')
    return readFileSync(resolve(FRONTEND_ROOT, 'src/shared/lib/queryClient.ts'), 'utf-8') as string
  }

  it('should configure staleTime to 60000ms (1 minute) as default for queries', () => {
    // GIVEN: Company standard sets staleTime: 1000 * 60 to avoid over-fetching
    // WHEN: We inspect the QueryClient defaultOptions
    const content = readContent()

    // THEN: staleTime is set — exact value is 60000 or expressed as 1000 * 60
    expect(content).toContain('staleTime')
    // Check for 60000 literal OR the expression pattern
    const has60000 = content.includes('60000') || (content.includes('1000') && content.includes('60'))
    expect(has60000).toBe(true)
  })

  it('should export queryClient as a named export (not default export)', () => {
    // GIVEN: Named exports are required by import contract in QueryProvider.tsx
    const content = readContent()
    // THEN: export const queryClient is declared
    expect(content).toMatch(/export\s+const\s+queryClient/)
  })

  it('should instantiate exactly one QueryClient (singleton — no factory function)', () => {
    // GIVEN: A singleton QueryClient shares cache across the app
    // Multiple instantiations would lose cached data between components
    const content = readContent()

    // THEN: The file exports a single pre-instantiated QueryClient
    // (not a factory function that returns new QueryClient() on every call)
    expect(content).toContain('new QueryClient(')
    // Should NOT be inside a function body that could create multiple instances
    // (detecting "export function" or "export const get...= () => new QueryClient()")
    expect(content).not.toMatch(/export\s+(function|const\s+\w+\s*=\s*\(\s*\)\s*=>)\s*.*new\s+QueryClient/)
  })

  it('should import QueryClient from @tanstack/react-query (not a local polyfill)', () => {
    // GIVEN: The correct package is @tanstack/react-query as per company standard
    const content = readContent()
    // THEN: Import comes from the correct package
    expect(content).toContain("from '@tanstack/react-query'")
  })

  it('should configure defaultOptions.queries (not mutations or subscriptions only)', () => {
    // GIVEN: The staleTime applies to queries specifically — not mutations
    const content = readContent()
    // THEN: defaultOptions.queries is present
    expect(content).toContain('queries')
    expect(content).toContain('defaultOptions')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Runtime behavior — import the singleton and validate at runtime
// ─────────────────────────────────────────────────────────────────────────────

describe('queryClient — runtime singleton behavior', () => {
  it('should be the same instance on every import (singleton guarantee)', async () => {
    // GIVEN: The queryClient is exported as a module-level singleton
    // WHEN: The module is imported twice
    const { queryClient: instance1 } = await import('../../shared/lib/queryClient')
    const { queryClient: instance2 } = await import('../../shared/lib/queryClient')

    // THEN: Both imports return the exact same object reference
    expect(instance1).toBe(instance2)
  })

  it('should have staleTime of 60000ms set on the runtime QueryClient instance', async () => {
    // GIVEN: defaultOptions.queries.staleTime is 1000 * 60
    const { queryClient } = await import('../../shared/lib/queryClient')

    // THEN: The runtime value is 60000
    const defaultStaleTime = queryClient.getDefaultOptions().queries?.staleTime
    expect(defaultStaleTime).toBe(60000)
  })

  it('should produce a QueryClient instance (not null/undefined)', async () => {
    // GIVEN: The module exports a constructed QueryClient
    const { queryClient } = await import('../../shared/lib/queryClient')

    // THEN: The export is a truthy object
    expect(queryClient).toBeDefined()
    expect(queryClient).not.toBeNull()
  })

  it('should have a getQueryCache method (valid QueryClient API surface)', async () => {
    // GIVEN: A properly constructed QueryClient must expose its cache API
    const { queryClient } = await import('../../shared/lib/queryClient')

    // THEN: Core QueryClient methods are present (not a plain object)
    expect(typeof queryClient.getQueryCache).toBe('function')
    expect(typeof queryClient.invalidateQueries).toBe('function')
  })
})
