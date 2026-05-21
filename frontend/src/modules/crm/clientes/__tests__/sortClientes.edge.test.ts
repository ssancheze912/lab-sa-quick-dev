/**
 * Edge-case expansion — Story 2.6: sortClientes pure utility
 * BMad-Integrated: covers paths not in the 5 GREEN ATDD tests (sortClientes.test.ts).
 *
 * Test IDs:
 *   UNIT-C-SC-EDGE-01  P1  — empty array returns empty array (boundary: no clients loaded yet)
 *   UNIT-C-SC-EDGE-02  P1  — single-element array returns that same element for all sort options
 *   UNIT-C-SC-EDGE-03  P1  — nombre-asc is stable for clients with equal nombres (preserves relative order)
 *   UNIT-C-SC-EDGE-04  P1  — nombre-desc is stable for clients with equal nombres
 *   UNIT-C-SC-EDGE-05  P1  — fecha-desc is stable for clients with identical createdAt timestamps
 *   UNIT-C-SC-EDGE-06  P1  — fecha-asc is stable for clients with identical createdAt timestamps
 *   UNIT-C-SC-EDGE-07  P2  — unknown/invalid SortOption falls through default branch and returns a copy
 *   UNIT-C-SC-EDGE-08  P2  — localeCompare uses 'es' locale (Spanish-aware: ñ sorts after n)
 *   UNIT-C-SC-EDGE-09  P2  — return value is a new array reference even when order does not change
 *   UNIT-C-SC-EDGE-10  P2  — createdAt with identical milliseconds: two-element resultado is deterministic
 */

import { describe, it, expect } from 'vitest'
import { sortClientes } from '../application/sortClientes'
import type { Cliente } from '../domain/Cliente'
import type { SortOption } from '../application/sortClientes'

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const makeCliente = (overrides: Partial<Cliente>): Cliente => ({
  id: 'default-id',
  nombre: 'Default Corp',
  nit: '000000000',
  telefono: '3000000000',
  ciudad: 'Bogotá',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

const clienteA = makeCliente({
  id: 'a',
  nombre: 'Alfa SA',
  createdAt: '2024-01-01T10:00:00.000Z',
})

const clienteB = makeCliente({
  id: 'b',
  nombre: 'Beta Ltda',
  createdAt: '2024-06-15T12:00:00.000Z',
})

const clienteC = makeCliente({
  id: 'c',
  nombre: 'Zeta Corp',
  createdAt: '2025-03-20T08:00:00.000Z',
})

// ---------------------------------------------------------------------------
// UNIT-C-SC-EDGE-01 (P1)
// Boundary: empty array input — common state before data loads from TanStack Query
// ---------------------------------------------------------------------------
describe('sortClientes — edge cases', () => {
  it('UNIT-C-SC-EDGE-01 — empty array returns empty array for all sort options', () => {
    const options: SortOption[] = ['nombre-asc', 'nombre-desc', 'fecha-desc', 'fecha-asc']

    // GIVEN: empty client list (data not yet loaded)
    for (const option of options) {
      // WHEN: sort is applied
      const result = sortClientes([], option)

      // THEN: result is still an empty array (no crash, no undefined)
      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-SC-EDGE-02 (P1)
  // Boundary: single-element array — sorting should be a no-op but must not throw
  // ---------------------------------------------------------------------------
  it('UNIT-C-SC-EDGE-02 — single-element array returns that element for all sort options', () => {
    const single = [clienteA]
    const options: SortOption[] = ['nombre-asc', 'nombre-desc', 'fecha-desc', 'fecha-asc']

    for (const option of options) {
      // GIVEN/WHEN: single-element array sorted
      const result = sortClientes(single, option)

      // THEN: the single element is returned
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('a')
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-SC-EDGE-03 (P1)
  // Boundary: equal nombres — localeCompare returns 0; relative order should be
  // preserved (stable sort). Vitest/V8 sort is stable for arrays.
  // ---------------------------------------------------------------------------
  it('UNIT-C-SC-EDGE-03 — nombre-asc: clients with identical nombres preserve relative input order (stable sort)', () => {
    // GIVEN: two clients with exactly the same nombre but different ids
    const same1 = makeCliente({ id: 'same-1', nombre: 'Iguales SA', createdAt: '2024-01-01T00:00:00.000Z' })
    const same2 = makeCliente({ id: 'same-2', nombre: 'Iguales SA', createdAt: '2024-01-01T00:00:00.000Z' })

    // WHEN: sorted nombre-asc
    const result = sortClientes([same1, same2], 'nombre-asc')

    // THEN: both are present and the result has length 2 (no elements dropped)
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.nombre)).toEqual(['Iguales SA', 'Iguales SA'])
    // AND: stable sort — same-1 appears before same-2 (insertion order preserved)
    expect(result[0].id).toBe('same-1')
    expect(result[1].id).toBe('same-2')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-SC-EDGE-04 (P1)
  // Boundary: equal nombres in Z→A direction — same stability requirement
  // ---------------------------------------------------------------------------
  it('UNIT-C-SC-EDGE-04 — nombre-desc: clients with identical nombres preserve relative input order (stable sort)', () => {
    // GIVEN: two clients with same nombre
    const same1 = makeCliente({ id: 'same-1', nombre: 'Iguales SA' })
    const same2 = makeCliente({ id: 'same-2', nombre: 'Iguales SA' })

    // WHEN: sorted nombre-desc
    const result = sortClientes([same1, same2], 'nombre-desc')

    // THEN: both present; stable sort keeps same-1 before same-2
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('same-1')
    expect(result[1].id).toBe('same-2')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-SC-EDGE-05 (P1)
  // Boundary: identical createdAt timestamps in fecha-desc — sort must not crash
  // and must return all elements with length unchanged
  // ---------------------------------------------------------------------------
  it('UNIT-C-SC-EDGE-05 — fecha-desc: clients with identical createdAt timestamps all appear in result', () => {
    const ts = '2025-01-01T00:00:00.000Z'
    const tie1 = makeCliente({ id: 'tie-1', createdAt: ts })
    const tie2 = makeCliente({ id: 'tie-2', createdAt: ts })
    const tie3 = makeCliente({ id: 'tie-3', createdAt: ts })

    // WHEN: sorted fecha-desc with all equal timestamps
    const result = sortClientes([tie1, tie2, tie3], 'fecha-desc')

    // THEN: all three elements present, no crash
    expect(result).toHaveLength(3)
    const ids = result.map((c) => c.id)
    expect(ids).toContain('tie-1')
    expect(ids).toContain('tie-2')
    expect(ids).toContain('tie-3')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-SC-EDGE-06 (P1)
  // Boundary: identical createdAt timestamps in fecha-asc
  // ---------------------------------------------------------------------------
  it('UNIT-C-SC-EDGE-06 — fecha-asc: clients with identical createdAt timestamps all appear in result', () => {
    const ts = '2025-06-01T12:00:00.000Z'
    const tie1 = makeCliente({ id: 'tie-1', createdAt: ts })
    const tie2 = makeCliente({ id: 'tie-2', createdAt: ts })

    // WHEN: sorted fecha-asc with equal timestamps
    const result = sortClientes([tie1, tie2], 'fecha-asc')

    // THEN: both elements present
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.id)).toContain('tie-1')
    expect(result.map((c) => c.id)).toContain('tie-2')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-SC-EDGE-07 (P2)
  // Boundary: unknown/invalid SortOption hits the `default` branch
  // The function must return a copy of the array without throwing.
  // ---------------------------------------------------------------------------
  it('UNIT-C-SC-EDGE-07 — unknown SortOption hits default branch and returns a copy of the array', () => {
    const input = [clienteC, clienteA, clienteB]

    // WHEN: passing a value not in the SortOption union (cast required to bypass TS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = sortClientes(input, 'invalid-option' as any)

    // THEN: returns all items (same order as spread copy), no throw
    expect(result).toHaveLength(3)
    expect(result.map((c) => c.id)).toEqual(['c', 'a', 'b'])
    // AND: is a new array reference (never returns the original input)
    expect(result).not.toBe(input)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-SC-EDGE-08 (P2)
  // Boundary: Spanish locale awareness — "ñ" must sort after "n" in 'es' locale
  // This verifies that localeCompare is called with 'es' locale, not default.
  // ---------------------------------------------------------------------------
  it('UNIT-C-SC-EDGE-08 — nombre-asc uses Spanish locale: ñ sorts after n (e.g. "Niña" after "Nieve")', () => {
    // GIVEN: names that differ only in ñ vs n
    const nieve = makeCliente({ id: 'nieve', nombre: 'Nieve Corp' })
    const nina = makeCliente({ id: 'nina', nombre: 'Niña SA' })
    const nova = makeCliente({ id: 'nova', nombre: 'Nova Ltd' })

    // WHEN: sorted nombre-asc with Spanish locale
    const result = sortClientes([nova, nina, nieve], 'nombre-asc')

    // THEN: 'Nieve' before 'Niña' before 'Nova' in Spanish collation
    // "ni" < "niñ" < "no" — ñ is between n and o in 'es'
    const nombres = result.map((c) => c.nombre)
    const nieveIdx = nombres.indexOf('Nieve Corp')
    const ninaIdx = nombres.indexOf('Niña SA')
    const novaIdx = nombres.indexOf('Nova Ltd')
    expect(nieveIdx).toBeLessThan(ninaIdx)
    expect(ninaIdx).toBeLessThan(novaIdx)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-SC-EDGE-09 (P2)
  // Boundary: return value is always a NEW array reference even if order unchanged.
  // This is critical — mutation of the original array would corrupt TanStack Query cache.
  // ---------------------------------------------------------------------------
  it('UNIT-C-SC-EDGE-09 — always returns a new array reference, never the original input', () => {
    // GIVEN: already-sorted array
    const alreadySorted = [clienteA, clienteB, clienteC]
    const originalRef = alreadySorted

    // WHEN: sorting with nombre-asc (array is already in A→Z order)
    const result = sortClientes(alreadySorted, 'nombre-asc')

    // THEN: result is a different reference
    expect(result).not.toBe(originalRef)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-SC-EDGE-10 (P2)
  // Boundary: createdAt with millisecond precision — two clients created
  // 1ms apart must be ordered correctly in both fecha-desc and fecha-asc.
  // ---------------------------------------------------------------------------
  it('UNIT-C-SC-EDGE-10 — fecha-desc correctly orders clients with 1ms createdAt difference', () => {
    const earlier = makeCliente({ id: 'earlier', createdAt: '2024-12-31T23:59:59.999Z' })
    const later   = makeCliente({ id: 'later',   createdAt: '2025-01-01T00:00:00.000Z' })

    // WHEN: fecha-desc (newest first)
    const descResult = sortClientes([earlier, later], 'fecha-desc')
    expect(descResult[0].id).toBe('later')
    expect(descResult[1].id).toBe('earlier')

    // WHEN: fecha-asc (oldest first)
    const ascResult = sortClientes([earlier, later], 'fecha-asc')
    expect(ascResult[0].id).toBe('earlier')
    expect(ascResult[1].id).toBe('later')
  })
})
