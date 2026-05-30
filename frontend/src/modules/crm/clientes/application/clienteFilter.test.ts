// Story 2.1: Client List & Search
// ATDD Unit Tests — filterClientes pure function
// Status: RED — Tests fail until filterClientes is implemented in clienteFilter.ts
// AC covered: AC#2 (case-insensitive, Unicode-normalized, < 1s with 500 records)
// Test cases: TC-E2-P1-16, TC-E2-P1-17

import { describe, it, expect } from 'vitest'
import { filterClientes } from './clienteFilter'

// ---------------------------------------------------------------------------
// TC-E2-P1-17: Filter function — Case-insensitive and Unicode-normalized matching
// AC#2: "case-insensitive, Unicode-normalized"
// ---------------------------------------------------------------------------
describe('filterClientes — TC-E2-P1-17: case-insensitive and Unicode-normalized matching', () => {
  const singleCliente = [
    {
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      nombre: 'García López',
      nit: '900-1',
      telefono: '3001111111',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00+00:00',
      updatedAt: '2026-01-01T00:00:00+00:00',
    },
  ]

  it('Given a client named "García López" When searching "garcia" (lowercase, no accent) Then the client matches', () => {
    // Given
    const clientes = singleCliente
    const query = 'garcia'

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('García López')
  })

  it('Given a client named "García López" When searching "GARCIA" (uppercase, no accent) Then the client matches', () => {
    // Given
    const clientes = singleCliente
    const query = 'GARCIA'

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('García López')
  })

  it('Given a client named "García López" When searching "García" (exact accent) Then the client matches', () => {
    // Given
    const clientes = singleCliente
    const query = 'García'

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('García López')
  })

  it('Given a client with NIT "900-1" When searching "900" (partial NIT) Then the client matches', () => {
    // Given
    const clientes = singleCliente
    const query = '900'

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(1)
    expect(result[0].nit).toBe('900-1')
  })

  it('Given a client named "García López" with NIT "900-1" When searching "xyz" (no match) Then result is empty', () => {
    // Given
    const clientes = singleCliente
    const query = 'xyz'

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(0)
  })

  it('Given an empty client list When searching any query Then result is empty', () => {
    // Given
    const clientes: typeof singleCliente = []
    const query = 'garcia'

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(0)
  })

  it('Given a client list When query is empty string Then all clients are returned', () => {
    // Given
    const clientes = singleCliente
    const query = ''

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(1)
  })

  it('Given a client list When query is whitespace only Then all clients are returned', () => {
    // Given
    const clientes = singleCliente
    const query = '   '

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(1)
  })

  it('Given two clients When query matches only one by nombre Then only matched client is returned', () => {
    // Given
    const clientes = [
      { ...singleCliente[0], nombre: 'García López', nit: '900-1' },
      {
        id: 'a1b2c3d4-0000-0000-0000-000000000002',
        nombre: 'Pedro Pérez',
        nit: '800-2',
        telefono: '3002222222',
        ciudad: 'Medellín',
        createdAt: '2026-01-02T00:00:00+00:00',
        updatedAt: '2026-01-02T00:00:00+00:00',
      },
    ]
    const query = 'garcia'

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('García López')
  })
})

// ---------------------------------------------------------------------------
// TC-E2-P1-16: Search Filter Performance — 500 records under 50ms
// AC#2: "results appear in under 1 second with up to 500 records (NFR1)"
// ---------------------------------------------------------------------------
describe('filterClientes — TC-E2-P1-16: filter performance with 500 records', () => {
  it('Given 500 mock client records When filtering by query "e" Then the filter completes in under 50ms', () => {
    // Given — Generate 500 mock clients procedurally
    const clientes = Array.from({ length: 500 }, (_, i) => ({
      id: `a1b2c3d4-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
      nombre: `Cliente ${i + 1} Test`,
      nit: `${900000000 + i}-${i}`,
      telefono: `300${String(i).padStart(7, '0')}`,
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00+00:00',
      updatedAt: '2026-01-01T00:00:00+00:00',
    }))

    // When
    const start = performance.now()
    const result = filterClientes(clientes, 'e')
    const elapsed = performance.now() - start

    // Then
    expect(elapsed).toBeLessThan(50)
    // Also sanity check that filter actually ran ("Cliente" and "Test" both contain 'e')
    expect(result.length).toBeGreaterThan(0)
    result.forEach((c) => {
      const normalizedNombre = c.nombre.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
      const normalizedNit = c.nit.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
      expect(normalizedNombre.includes('e') || normalizedNit.includes('e')).toBe(true)
    })
  })
})
