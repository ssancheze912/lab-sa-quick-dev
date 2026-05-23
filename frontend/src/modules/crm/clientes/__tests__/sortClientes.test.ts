/**
 * ATDD — Story 2.6: Sort Client List
 * Unit tests for sortClientes pure utility function.
 *
 * Tests are in RED phase — they define expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing:
 *   frontend/src/modules/crm/clientes/application/sortClientes.ts
 *
 * Coverage:
 *   UNIT-C-05 (P1) — sortClientes('nombre-asc') returns alphabetically ascending
 *   UNIT-C-06 (P1) — sortClientes('nombre-desc') returns alphabetically descending
 *   UNIT-C-07 (P1) — sortClientes('fecha-desc') returns newest first (by createdAt)
 *   UNIT-C-08 (P1) — sortClientes('fecha-asc') returns oldest first (by createdAt)
 */

import { describe, it, expect } from 'vitest'
import { sortClientes } from '../application/sortClientes'
import type { Cliente } from '../domain/Cliente'

// ---------------------------------------------------------------------------
// Fixed test data — controlled names and dates for deterministic assertions
// ---------------------------------------------------------------------------
const clienteAlpha: Cliente = {
  id: '1',
  nombre: 'Alpha Corp',
  nit: '100000001',
  telefono: '3001111111',
  ciudad: 'Bogotá',
  createdAt: '2024-01-01T10:00:00.000Z', // oldest
  updatedAt: '2024-01-01T10:00:00.000Z',
}

const clienteBeta: Cliente = {
  id: '2',
  nombre: 'Beta Ltda',
  nit: '100000002',
  telefono: '3002222222',
  ciudad: 'Medellín',
  createdAt: '2024-06-15T12:00:00.000Z', // middle
  updatedAt: '2024-06-15T12:00:00.000Z',
}

const clienteZeta: Cliente = {
  id: '3',
  nombre: 'Zeta SA',
  nit: '100000003',
  telefono: '3003333333',
  ciudad: 'Cali',
  createdAt: '2025-03-20T08:00:00.000Z', // newest
  updatedAt: '2025-03-20T08:00:00.000Z',
}

// Input array intentionally in non-sorted order to verify sort effectiveness
const unsortedClientes: Cliente[] = [clienteBeta, clienteZeta, clienteAlpha]

// ---------------------------------------------------------------------------
// UNIT-C-05 (P1 · AC1)
// Given a list of clients with distinct names
// When sortClientes is called with 'nombre-asc'
// Then the returned array is sorted alphabetically ascending by nombre (A→Z)
// ---------------------------------------------------------------------------
describe('sortClientes', () => {
  it('UNIT-C-05 — nombre-asc: returns clients alphabetically ascending by nombre', () => {
    // GIVEN: array with clients in non-alphabetical order
    const input = [...unsortedClientes]

    // WHEN: sorting with nombre-asc option
    const result = sortClientes(input, 'nombre-asc')

    // THEN: first client is Alpha, last is Zeta
    expect(result[0].nombre).toBe('Alpha Corp')
    expect(result[1].nombre).toBe('Beta Ltda')
    expect(result[2].nombre).toBe('Zeta SA')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-06 (P1 · AC2)
  // Given a list of clients with distinct names
  // When sortClientes is called with 'nombre-desc'
  // Then the returned array is sorted alphabetically descending by nombre (Z→A)
  // ---------------------------------------------------------------------------
  it('UNIT-C-06 — nombre-desc: returns clients alphabetically descending by nombre', () => {
    // GIVEN: array with clients in non-alphabetical order
    const input = [...unsortedClientes]

    // WHEN: sorting with nombre-desc option
    const result = sortClientes(input, 'nombre-desc')

    // THEN: first client is Zeta, last is Alpha
    expect(result[0].nombre).toBe('Zeta SA')
    expect(result[1].nombre).toBe('Beta Ltda')
    expect(result[2].nombre).toBe('Alpha Corp')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-07 (P1 · AC3)
  // Given a list of clients with distinct createdAt timestamps
  // When sortClientes is called with 'fecha-desc'
  // Then the returned array orders by createdAt descending (newest first)
  // ---------------------------------------------------------------------------
  it('UNIT-C-07 — fecha-desc: returns clients newest first by createdAt', () => {
    // GIVEN: array with clients having known createdAt dates
    const input = [...unsortedClientes]

    // WHEN: sorting with fecha-desc option
    const result = sortClientes(input, 'fecha-desc')

    // THEN: newest client (2025) is first, oldest (2024-01) is last
    expect(result[0].id).toBe(clienteZeta.id)   // 2025-03-20
    expect(result[1].id).toBe(clienteBeta.id)   // 2024-06-15
    expect(result[2].id).toBe(clienteAlpha.id)  // 2024-01-01
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-08 (P1 · AC4)
  // Given a list of clients with distinct createdAt timestamps
  // When sortClientes is called with 'fecha-asc'
  // Then the returned array orders by createdAt ascending (oldest first)
  // ---------------------------------------------------------------------------
  it('UNIT-C-08 — fecha-asc: returns clients oldest first by createdAt', () => {
    // GIVEN: array with clients having known createdAt dates
    const input = [...unsortedClientes]

    // WHEN: sorting with fecha-asc option
    const result = sortClientes(input, 'fecha-asc')

    // THEN: oldest client (2024-01) is first, newest (2025) is last
    expect(result[0].id).toBe(clienteAlpha.id)  // 2024-01-01
    expect(result[1].id).toBe(clienteBeta.id)   // 2024-06-15
    expect(result[2].id).toBe(clienteZeta.id)   // 2025-03-20
  })

  // ---------------------------------------------------------------------------
  // Immutability guard — verify input array is never mutated
  // ---------------------------------------------------------------------------
  it('does not mutate the input array', () => {
    // GIVEN: original array in a known order
    const input = [clienteZeta, clienteAlpha, clienteBeta]
    const inputCopy = [...input]

    // WHEN: any sort option is applied
    sortClientes(input, 'nombre-asc')

    // THEN: original array order is unchanged
    expect(input).toEqual(inputCopy)
  })
})
