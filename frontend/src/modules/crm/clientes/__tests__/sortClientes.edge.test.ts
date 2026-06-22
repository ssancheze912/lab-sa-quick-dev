/**
 * Edge Case Tests — Story 2.6: Sort Client List
 * Unit tests for sortClientes pure utility — boundary conditions and error paths.
 *
 * Expands coverage beyond ATDD suite (UNIT-C-05 to UNIT-C-08).
 * Tests IDs: UNIT-C-EDGE-01 … UNIT-C-EDGE-10
 *
 * Risks covered:
 *   - Empty array input (boundary — no items to sort)
 *   - Single-element array (boundary — trivially sorted)
 *   - Identical nombres (stable sort expectation / no crash)
 *   - Identical createdAt timestamps (no crash, stable result)
 *   - Invalid/NaN createdAt (NaN dates sort last by standard JS)
 *   - Special characters in nombre (accents, ñ — localeCompare 'es')
 *   - Input immutability guard for all sort paths
 */

import { describe, it, expect } from 'vitest'
import { sortClientes } from '../application/sortClientes'
import type { Cliente } from '../domain/Cliente'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function makeCliente(overrides: Partial<Cliente> & { id: string }): Cliente {
  return {
    nombre: `Cliente ${overrides.id}`,
    nit: `90000000${overrides.id}`,
    telefono: `3001000000`,
    ciudad: 'Bogotá',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// UNIT-C-EDGE-01 (P1)
// Boundary: empty array must be returned as empty array for all sort options.
// No crash, no mutation.
// ---------------------------------------------------------------------------
describe('sortClientes — edge cases', () => {
  it('UNIT-C-EDGE-01 — empty array returns empty array for all sort options', () => {
    const empty: Cliente[] = []

    expect(sortClientes(empty, 'nombre-asc')).toEqual([])
    expect(sortClientes(empty, 'nombre-desc')).toEqual([])
    expect(sortClientes(empty, 'fecha-desc')).toEqual([])
    expect(sortClientes(empty, 'fecha-asc')).toEqual([])
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-02 (P1)
  // Boundary: single-element array is returned unchanged for all sort options.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-02 — single-element array is returned unchanged for all sort options', () => {
    const single = [makeCliente({ id: '1', nombre: 'Única Empresa SA' })]

    const resultNombreAsc = sortClientes([...single], 'nombre-asc')
    expect(resultNombreAsc).toHaveLength(1)
    expect(resultNombreAsc[0].id).toBe('1')

    const resultFechaDesc = sortClientes([...single], 'fecha-desc')
    expect(resultFechaDesc).toHaveLength(1)
    expect(resultFechaDesc[0].id).toBe('1')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-03 (P1)
  // Boundary: clients with identical nombres must not crash; order is
  // implementation-defined but length must be preserved.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-03 — clients with identical nombres do not crash; all are returned', () => {
    const clientes = [
      makeCliente({ id: 'a', nombre: 'Empresa Igual SAS' }),
      makeCliente({ id: 'b', nombre: 'Empresa Igual SAS' }),
      makeCliente({ id: 'c', nombre: 'Empresa Igual SAS' }),
    ]

    const resultAsc = sortClientes(clientes, 'nombre-asc')
    expect(resultAsc).toHaveLength(3)

    const resultDesc = sortClientes(clientes, 'nombre-desc')
    expect(resultDesc).toHaveLength(3)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-04 (P1)
  // Boundary: clients with identical createdAt timestamps must not crash;
  // all items must be present in the result.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-04 — clients with identical createdAt timestamps do not crash; all are returned', () => {
    const sameDate = '2024-06-01T12:00:00.000Z'
    const clientes = [
      makeCliente({ id: 'x', createdAt: sameDate, updatedAt: sameDate }),
      makeCliente({ id: 'y', createdAt: sameDate, updatedAt: sameDate }),
      makeCliente({ id: 'z', createdAt: sameDate, updatedAt: sameDate }),
    ]

    const resultDesc = sortClientes(clientes, 'fecha-desc')
    expect(resultDesc).toHaveLength(3)

    const resultAsc = sortClientes(clientes, 'fecha-asc')
    expect(resultAsc).toHaveLength(3)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-05 (P2)
  // Error path: client with an empty createdAt string produces a NaN date.
  // The function must not throw; it must return all items.
  // NaN comparisons in JS sort produce stable but arbitrary relative order.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-05 — client with empty createdAt does not throw; all items returned', () => {
    const clientes = [
      makeCliente({ id: '1', createdAt: '2024-01-01T00:00:00.000Z' }),
      makeCliente({ id: '2', createdAt: '' }),          // NaN date
      makeCliente({ id: '3', createdAt: '2025-01-01T00:00:00.000Z' }),
    ]

    expect(() => sortClientes(clientes, 'fecha-desc')).not.toThrow()
    const result = sortClientes(clientes, 'fecha-desc')
    expect(result).toHaveLength(3)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-06 (P1)
  // Boundary: Spanish accents and ñ must sort correctly with localeCompare('es').
  // 'Ñoño' should sort after 'N' names and before 'O' names in Spanish locale.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-06 — Spanish accents and ñ sort correctly with localeCompare in nombre-asc', () => {
    const clientes = [
      makeCliente({ id: '1', nombre: 'Óptima Solutions SAS' }),
      makeCliente({ id: '2', nombre: 'Ñoño & Asociados' }),
      makeCliente({ id: '3', nombre: 'Mármol Industrial SA' }),
    ]

    const result = sortClientes(clientes, 'nombre-asc')

    // In Spanish locale, M < Ñ < O
    const marmolIdx = result.findIndex((c) => c.id === '3')
    const nonioIdx = result.findIndex((c) => c.id === '2')
    const optimaIdx = result.findIndex((c) => c.id === '1')

    expect(marmolIdx).toBeLessThan(nonioIdx)
    expect(nonioIdx).toBeLessThan(optimaIdx)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-07 (P1)
  // Immutability: original array order is preserved for ALL sort options,
  // not just 'nombre-asc'. Covers the spread [...clientes] guard for all paths.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-07 — input array is NOT mutated by any sort option', () => {
    const original = [
      makeCliente({ id: 'z', nombre: 'Zeta Corp', createdAt: '2025-01-01T00:00:00.000Z' }),
      makeCliente({ id: 'a', nombre: 'Alpha Inc', createdAt: '2023-01-01T00:00:00.000Z' }),
      makeCliente({ id: 'm', nombre: 'Medio Ltda', createdAt: '2024-06-01T00:00:00.000Z' }),
    ]
    const options = ['nombre-asc', 'nombre-desc', 'fecha-desc', 'fecha-asc'] as const

    for (const option of options) {
      const copy = [...original]
      sortClientes(copy, option)
      // Original order: z, a, m — must be unchanged
      expect(copy[0].id).toBe('z')
      expect(copy[1].id).toBe('a')
      expect(copy[2].id).toBe('m')
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-08 (P2)
  // Boundary: result array is a NEW array reference (not same object).
  // Callers depend on React's referential equality check (useMemo deps).
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-08 — returned array is a new reference, not the same object as input', () => {
    const input = [makeCliente({ id: '1' }), makeCliente({ id: '2' })]
    const options = ['nombre-asc', 'nombre-desc', 'fecha-desc', 'fecha-asc'] as const

    for (const option of options) {
      const result = sortClientes(input, option)
      expect(result).not.toBe(input)
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-09 (P1)
  // Boundary: large array (50 items) must sort without error and produce
  // a result with the same length. Regression guard against O(n²) correctness.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-09 — large array (50 items) sorts without error', () => {
    const clientes: Cliente[] = Array.from({ length: 50 }, (_, i) =>
      makeCliente({
        id: String(i),
        nombre: `Empresa ${String(i).padStart(3, '0')} SAS`,
        createdAt: new Date(2024, 0, i + 1).toISOString(),
        updatedAt: new Date(2024, 0, i + 1).toISOString(),
      })
    )

    const options = ['nombre-asc', 'nombre-desc', 'fecha-desc', 'fecha-asc'] as const
    for (const option of options) {
      const result = sortClientes(clientes, option)
      expect(result).toHaveLength(50)
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-10 (P1)
  // Boundary: nombre-desc must reverse exactly the nombre-asc order.
  // Ensures the two comparators are true inverses of each other.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-10 — nombre-desc is the exact reverse of nombre-asc', () => {
    const clientes = [
      makeCliente({ id: 'a', nombre: 'Alfa SA' }),
      makeCliente({ id: 'b', nombre: 'Beta Ltda' }),
      makeCliente({ id: 'c', nombre: 'Gamma Corp' }),
      makeCliente({ id: 'd', nombre: 'Delta Inc' }),
    ]

    const asc = sortClientes(clientes, 'nombre-asc')
    const desc = sortClientes(clientes, 'nombre-desc')

    const ascNames = asc.map((c) => c.nombre)
    const descNames = desc.map((c) => c.nombre)

    expect(descNames).toEqual([...ascNames].reverse())
  })
})
