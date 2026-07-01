/**
 * Unit tests for filterClientes — Story 2.1 AC #2.
 *
 * Given-When-Then: exercises the pure client-side filter.
 * Test IDs: 2.1-UNIT-001..007
 * Priority: P0 (client-side filter is the core of AC #2 and NFR1).
 */
import { describe, it, expect } from 'vitest'
import { filterClientes } from './filterClientes'
import type { Cliente } from '../domain/Cliente'

const iso = '2025-01-01T00:00:00.000Z'

const build = (over: Partial<Cliente>): Cliente => ({
  id: over.id ?? 'id-x',
  nombre: over.nombre ?? 'Cliente X',
  nit: over.nit ?? '900000000',
  telefono: over.telefono ?? '3000000000',
  ciudad: over.ciudad ?? 'Bogotá',
  createdAt: over.createdAt ?? iso,
  updatedAt: over.updatedAt ?? iso,
})

const dataset: Cliente[] = [
  build({ id: 'a', nombre: 'Acme Corporation', nit: '900123456' }),
  build({ id: 'b', nombre: 'Peña & Asociados', nit: '800987654' }),
  build({ id: 'c', nombre: 'Global Foods S.A.', nit: '901555444' }),
]

describe('filterClientes — Story 2.1 AC #2', () => {
  it('[P0][2.1-UNIT-001] given an empty query, when filtering, then it returns all clientes (copy, not the same reference)', () => {
    // GIVEN
    const q = ''
    // WHEN
    const result = filterClientes(dataset, q)
    // THEN
    expect(result).toHaveLength(dataset.length)
    expect(result).not.toBe(dataset)
  })

  it('[P1][2.1-UNIT-002] given a whitespace-only query, when filtering, then it returns all clientes', () => {
    // WHEN
    const result = filterClientes(dataset, '   ')
    // THEN
    expect(result).toHaveLength(dataset.length)
  })

  it('[P0][2.1-UNIT-003] given a query that matches nombre, when filtering, then it returns only matching clientes', () => {
    // WHEN
    const result = filterClientes(dataset, 'Acme')
    // THEN
    expect(result.map((c) => c.id)).toEqual(['a'])
  })

  it('[P0][2.1-UNIT-004] given a query that matches nit, when filtering, then it returns only clientes matching that NIT substring', () => {
    // WHEN
    const result = filterClientes(dataset, '800987')
    // THEN
    expect(result.map((c) => c.id)).toEqual(['b'])
  })

  it('[P1][2.1-UNIT-005] given a mixed-case query, when filtering, then the match is case-insensitive', () => {
    // WHEN
    const result = filterClientes(dataset, 'aCmE')
    // THEN
    expect(result.map((c) => c.id)).toEqual(['a'])
  })

  it('[P1][2.1-UNIT-006] given a diacritic-free query, when filtering diacritic data, then the match is diacritic-tolerant', () => {
    // WHEN — "pena" must match "Peña"
    const result = filterClientes(dataset, 'pena')
    // THEN
    expect(result.map((c) => c.id)).toEqual(['b'])
  })

  it('[P1][2.1-UNIT-007] given a query that matches no records, when filtering, then it returns an empty array', () => {
    // WHEN
    const result = filterClientes(dataset, 'zzzzzz-no-match')
    // THEN
    expect(result).toEqual([])
  })
})
