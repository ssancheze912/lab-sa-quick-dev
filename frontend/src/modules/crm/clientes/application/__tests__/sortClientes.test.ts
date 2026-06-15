/**
 * Story 2.6: Sort Client List
 * Epic 2: Gestión de Clientes
 *
 * Unit tests for the pure `sortClientes` utility (Application layer).
 * Covers AC #11 sub-cases:
 *   - sortClientes_util_sorts_by_nombre_asc
 *   - sortClientes_util_sorts_by_nombre_desc
 *   - sortClientes_util_sorts_by_fecha_desc_default
 *   - sortClientes_util_sorts_by_fecha_asc
 *   - sortClientes_util_tiebreak_identical_nombre
 *   - sortClientes_util_tiebreak_identical_createdAt
 *   - sortClientes_util_returns_new_array_does_not_mutate_input
 */

import { describe, expect, test } from 'vitest'
import {
  DEFAULT_SORT,
  sortClientes,
  type SortOption,
} from '@/modules/crm/clientes/application/sortClientes'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

const makeCliente = (overrides: Partial<Cliente> & { id: string }): Cliente => ({
  id: overrides.id,
  nombre: overrides.nombre ?? 'Sin nombre',
  nit: overrides.nit ?? '000000000-0',
  telefono: overrides.telefono ?? null,
  ciudad: overrides.ciudad ?? null,
  createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
})

describe('sortClientes — Story 2.6 unit suite', () => {
  test('DEFAULT_SORT is "fecha-desc"', () => {
    const expected: SortOption = 'fecha-desc'
    expect(DEFAULT_SORT).toBe(expected)
  })

  test('sortClientes_util_sorts_by_nombre_asc — case-insensitive Spanish locale', () => {
    const input: Cliente[] = [
      makeCliente({ id: '1', nombre: 'Beltrán', createdAt: '2026-01-01T00:00:00.000Z' }),
      makeCliente({ id: '2', nombre: 'álvarez', createdAt: '2026-01-02T00:00:00.000Z' }),
      makeCliente({ id: '3', nombre: 'Carrillo', createdAt: '2026-01-03T00:00:00.000Z' }),
      makeCliente({ id: '4', nombre: 'Álvarez', createdAt: '2026-01-04T00:00:00.000Z' }),
    ]

    const result = sortClientes(input, 'nombre-asc')

    // Both "álvarez" (id=2, older) and "Álvarez" (id=4) are case-insensitively
    // equal. Tie-break (createdAt ASC) places id=2 (Jan 2) before id=4 (Jan 4).
    expect(result.map((c) => c.id)).toEqual(['2', '4', '1', '3'])
  })

  test('sortClientes_util_sorts_by_nombre_desc — reversed', () => {
    const input: Cliente[] = [
      makeCliente({ id: '1', nombre: 'Beltrán', createdAt: '2026-01-01T00:00:00.000Z' }),
      makeCliente({ id: '2', nombre: 'álvarez', createdAt: '2026-01-02T00:00:00.000Z' }),
      makeCliente({ id: '3', nombre: 'Carrillo', createdAt: '2026-01-03T00:00:00.000Z' }),
      makeCliente({ id: '4', nombre: 'Álvarez', createdAt: '2026-01-04T00:00:00.000Z' }),
    ]

    const result = sortClientes(input, 'nombre-desc')

    // Reversed primary: Carrillo, Beltrán, then tie group (álvarez/Álvarez).
    // Tie-break still createdAt ASC: id=2 (older) before id=4.
    expect(result.map((c) => c.id)).toEqual(['3', '1', '2', '4'])
  })

  test('sortClientes_util_sorts_by_fecha_desc_default — newest first', () => {
    const input: Cliente[] = [
      makeCliente({ id: 'a', createdAt: '2026-06-15T08:00:00Z', nombre: 'A' }),
      makeCliente({ id: 'b', createdAt: '2026-06-14T08:00:00Z', nombre: 'B' }),
      makeCliente({ id: 'c', createdAt: '2026-06-16T08:00:00Z', nombre: 'C' }),
    ]

    const result = sortClientes(input, 'fecha-desc')

    expect(result.map((c) => c.id)).toEqual(['c', 'a', 'b'])
  })

  test('sortClientes_util_sorts_by_fecha_asc — oldest first', () => {
    const input: Cliente[] = [
      makeCliente({ id: 'a', createdAt: '2026-06-15T08:00:00Z', nombre: 'A' }),
      makeCliente({ id: 'b', createdAt: '2026-06-14T08:00:00Z', nombre: 'B' }),
      makeCliente({ id: 'c', createdAt: '2026-06-16T08:00:00Z', nombre: 'C' }),
    ]

    const result = sortClientes(input, 'fecha-asc')

    expect(result.map((c) => c.id)).toEqual(['b', 'a', 'c'])
  })

  test('sortClientes_util_tiebreak_identical_nombre — older createdAt first within identical nombre', () => {
    const input: Cliente[] = [
      makeCliente({ id: 'newer', nombre: 'Acme', createdAt: '2026-06-15T08:00:00Z' }),
      makeCliente({ id: 'older', nombre: 'Acme', createdAt: '2026-01-01T08:00:00Z' }),
    ]

    const result = sortClientes(input, 'nombre-asc')

    expect(result.map((c) => c.id)).toEqual(['older', 'newer'])
  })

  test('sortClientes_util_tiebreak_identical_createdAt — nombre ASC within identical createdAt', () => {
    const sameDate = '2026-06-15T08:00:00.000Z'
    const input: Cliente[] = [
      makeCliente({ id: 'z', nombre: 'Zeta', createdAt: sameDate }),
      makeCliente({ id: 'a', nombre: 'Alpha', createdAt: sameDate }),
    ]

    const result = sortClientes(input, 'fecha-desc')

    expect(result.map((c) => c.id)).toEqual(['a', 'z'])
  })

  test('sortClientes_util_returns_new_array_does_not_mutate_input', () => {
    const input: Cliente[] = [
      makeCliente({ id: '1', nombre: 'Carlos', createdAt: '2026-01-03T00:00:00Z' }),
      makeCliente({ id: '2', nombre: 'Ana', createdAt: '2026-01-01T00:00:00Z' }),
      makeCliente({ id: '3', nombre: 'Beatriz', createdAt: '2026-01-02T00:00:00Z' }),
    ]
    const originalOrder = input.map((c) => c.id)

    const result = sortClientes(input, 'nombre-asc')

    // Pure-function contract: new array reference.
    expect(Object.is(input, result)).toBe(false)
    // Input order unchanged.
    expect(input.map((c) => c.id)).toEqual(originalOrder)
    // Result is correctly sorted.
    expect(result.map((c) => c.id)).toEqual(['2', '3', '1'])
  })
})
