/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — Edge cases for QueryProvider component
 * Covers: AC1 — QueryProvider wraps children with QueryClientProvider
 *
 * Test level: Unit (node environment — source inspection)
 * Tool: Vitest
 *
 * Edge cases:
 *   - Component imports QueryClientProvider from the correct package
 *   - Component uses the shared queryClient singleton (not a local new QueryClient())
 *   - Component accepts ReactNode children prop (type safety)
 *   - Component is a named export (not default)
 *   - File resides in correct folder per feature-slice architecture
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// From frontend/src/__tests__/foundation/ → go up 3 levels to reach frontend/
const FRONTEND_ROOT = resolve(__dirname, '../../..')

const PROVIDER_PATH = resolve(FRONTEND_ROOT, 'src/app/providers/QueryProvider.tsx')

const readProvider = () => readFileSync(PROVIDER_PATH, 'utf-8')

// ─────────────────────────────────────────────────────────────────────────────
// File structure — boundary condition: file must exist at canonical path
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — file structure', () => {
  it('should exist at src/app/providers/QueryProvider.tsx', () => {
    // GIVEN: Company architecture places providers inside src/app/providers/
    expect(existsSync(PROVIDER_PATH)).toBe(true)
  })

  it('should be a .tsx file (contains JSX)', () => {
    // GIVEN: QueryProvider renders JSX — it must be .tsx, not .ts
    const tsxPath = PROVIDER_PATH
    const tsPath = PROVIDER_PATH.replace('.tsx', '.ts')
    expect(existsSync(tsxPath)).toBe(true)
    expect(existsSync(tsPath)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Import contract — edge case: wrong package or wrong singleton
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — import contract', () => {
  it('should import QueryClientProvider from @tanstack/react-query', () => {
    // GIVEN: The correct package is @tanstack/react-query per company standard
    const content = readProvider()
    // THEN: Import is from the correct package (not a re-export or custom polyfill)
    expect(content).toContain("from '@tanstack/react-query'")
    expect(content).toContain('QueryClientProvider')
  })

  it('should import the queryClient singleton from shared/lib/queryClient', () => {
    // GIVEN: The singleton must be shared across all components (not re-instantiated)
    // WHEN: We inspect the import path
    const content = readProvider()
    // THEN: Import references the singleton from shared lib — not a local new QueryClient()
    expect(content).toMatch(/from\s+['"].*shared\/lib\/queryClient['"]/)
  })

  it('should NOT instantiate a new QueryClient locally (no local new QueryClient())', () => {
    // GIVEN: Creating a local QueryClient would break shared cache across the app
    // WHEN: We scan for local instantiation
    const content = readProvider()
    // THEN: No local new QueryClient() is called in this file
    expect(content).not.toContain('new QueryClient(')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Export contract — edge case: must be named export, not default
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — export contract', () => {
  it('should be a named export (export function QueryProvider)', () => {
    // GIVEN: Named exports are required for explicit tree-shaking and refactoring safety
    const content = readProvider()
    // THEN: The component is exported as a named function
    expect(content).toMatch(/export\s+function\s+QueryProvider/)
  })

  it('should NOT have a default export (named exports only)', () => {
    // GIVEN: Default exports make refactoring harder and import names inconsistent
    const content = readProvider()
    // THEN: No default export is present
    expect(content).not.toMatch(/export\s+default/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Props contract — edge case: children prop type safety
// ─────────────────────────────────────────────────────────────────────────────

describe('QueryProvider — props contract', () => {
  it('should define a QueryProviderProps interface with children: ReactNode', () => {
    // GIVEN: Explicit prop typing prevents silent breakage when children type changes
    const content = readProvider()
    // THEN: An interface/type with children: ReactNode is declared
    expect(content).toContain('ReactNode')
    expect(content).toContain('children')
  })

  it('should import ReactNode as a type import (not a value import)', () => {
    // GIVEN: TypeScript verbatimModuleSyntax requires explicit type imports
    const content = readProvider()
    // THEN: ReactNode is imported with "import type" or "type ReactNode"
    expect(content).toMatch(/import\s+type\s+\{[^}]*ReactNode/)
  })

  it('should wrap children in QueryClientProvider (not render children directly)', () => {
    // GIVEN: The provider's job is to inject the QueryClientProvider context
    const content = readProvider()
    // THEN: QueryClientProvider is used as a wrapper around {children}
    expect(content).toContain('QueryClientProvider')
    expect(content).toContain('{children}')
  })
})
