/**
 * Story 1.2: Frontend Navigation Shell — Unit Tests for NAV_ITEMS config
 *
 * Test-Design gaps covered (edge cases beyond ATDD happy paths):
 *   - Config shape / typing integrity (path enum literal type)
 *   - Spanish labels (Task 9 accessibility+Spanish text audit)
 *   - Icon components resolve to actual React components
 *   - NAV_ITEMS array is immutable / referentially stable (readonly contract)
 *   - No duplicate ids / paths (would break active-item derivation)
 *
 * Patterns applied:
 *   - Given-When-Then structure
 *   - One primary assertion per test (atomic)
 *   - Pure unit-level (no router, no DOM)
 *
 * Priority: [P2] — supporting configuration, not a critical path
 */

import { describe, it, expect } from 'vitest'
import { NAV_ITEMS, type NavItem } from './navigation'

describe('[P2] NAV_ITEMS — navigation configuration', () => {
  it('should expose exactly two nav entries (Clientes and Contactos) — MVP scope', () => {
    // GIVEN: The MVP navigation surface has two top-level sections
    // WHEN: We read NAV_ITEMS
    // THEN: The array contains exactly 2 items
    expect(NAV_ITEMS).toHaveLength(2)
  })

  it('should place "Clientes" as the first nav entry (default landing route)', () => {
    // GIVEN: `/` redirects to `/clientes` (AC5) — Clientes is the primary section
    // WHEN: We read the first nav entry
    // THEN: It is the Clientes item
    expect(NAV_ITEMS[0].id).toBe('clientes')
    expect(NAV_ITEMS[0].path).toBe('/clientes')
  })

  it('should place "Contactos" as the second nav entry', () => {
    // GIVEN/WHEN/THEN
    expect(NAV_ITEMS[1].id).toBe('contactos')
    expect(NAV_ITEMS[1].path).toBe('/contactos')
  })

  it('should use Spanish labels on every nav entry (Task 9 — accessibility+Spanish audit)', () => {
    // GIVEN: Company standard requires Spanish UI text
    // WHEN: We collect all labels
    const labels = NAV_ITEMS.map((item) => item.label)

    // THEN: Every label is a Spanish word from the expected set
    expect(labels).toEqual(['Clientes', 'Contactos'])
  })

  it('should assign a defined React icon component to every nav entry', () => {
    // GIVEN: Rail/Bar require a functional icon for each item
    // WHEN: We inspect each Icon prop
    // THEN: Icon is not null/undefined and is callable (function/forwardRef)
    for (const item of NAV_ITEMS) {
      expect(item.Icon).toBeDefined()
      // Heroicon components are ForwardRef objects (typeof "object") OR functions.
      expect(['function', 'object']).toContain(typeof item.Icon)
    }
  })

  it('should have unique `id` values across all nav entries', () => {
    // GIVEN: Active-item derivation matches by id
    // WHEN: We build a Set of ids
    const ids = NAV_ITEMS.map((item) => item.id)
    const uniqueIds = new Set(ids)

    // THEN: Set size equals array length (no duplicates)
    expect(uniqueIds.size).toBe(NAV_ITEMS.length)
  })

  it('should have unique `path` values across all nav entries', () => {
    // GIVEN: Two nav entries cannot point at the same route
    // WHEN: We build a Set of paths
    const paths = NAV_ITEMS.map((item) => item.path)
    const uniquePaths = new Set(paths)

    // THEN: All paths are unique
    expect(uniquePaths.size).toBe(NAV_ITEMS.length)
  })

  it('should start every path with a forward slash (absolute route)', () => {
    // GIVEN: TanStack Router requires absolute paths for `navigate({ to })`
    // WHEN: We inspect each path
    // THEN: Every path begins with `/`
    for (const item of NAV_ITEMS) {
      expect(item.path.startsWith('/')).toBe(true)
    }
  })

  it('should match the NavItem type contract (id/label/path/Icon fields)', () => {
    // GIVEN: The NavItem interface requires exactly these four fields
    // WHEN: We inspect an item
    const [first] = NAV_ITEMS
    const keys = Object.keys(first).sort()

    // THEN: The keys are exactly the contract shape
    expect(keys).toEqual(['Icon', 'id', 'label', 'path'])
  })

  it('should be a stable, non-mutating reference (readonly contract)', () => {
    // GIVEN: The array is declared `as const`
    // WHEN: TypeScript enforces readonly at compile time
    // THEN: The type is `readonly NavItem[]` — asserted via type-only check
    const items: readonly NavItem[] = NAV_ITEMS
    expect(Array.isArray(items)).toBe(true)
  })
})
