// Story 2.1: Client List & Search — Automate expansion
// Unit edge case tests for filterClientes pure function
// Coverage: edge cases, boundary conditions, negative paths NOT in ATDD tests
// Level: Unit | Priority: P1-P2

import { describe, it, expect } from 'vitest'
import { filterClientes } from './clienteFilter'
import type { Cliente } from '../domain/Cliente'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const base: Cliente = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  nombre: 'García López',
  nit: '900-111-001',
  telefono: '3001111111',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00+00:00',
  updatedAt: '2026-01-01T00:00:00+00:00',
}

const second: Cliente = {
  id: 'a1b2c3d4-0000-0000-0000-000000000002',
  nombre: 'Óscar Muñoz',
  nit: '800-222-002',
  telefono: '3002222222',
  ciudad: 'Medellín',
  createdAt: '2026-01-02T00:00:00+00:00',
  updatedAt: '2026-01-02T00:00:00+00:00',
}

// ---------------------------------------------------------------------------
// [P1] Multi-match: query matches multiple clients simultaneously
// Edge case: ensure ALL matching records are returned (not just first)
// ---------------------------------------------------------------------------
describe('filterClientes — [P1] query matching multiple clients', () => {
  it('Given three clients When query matches nombre of two Then both are returned and the non-matching is excluded', () => {
    // Given
    const clientes: Cliente[] = [
      { ...base, nombre: 'Ana García' },
      { ...second, nombre: 'Luis García' },
      {
        ...base,
        id: 'a1b2c3d4-0000-0000-0000-000000000003',
        nombre: 'Pedro Pérez',
        nit: '700-333-003',
      },
    ]

    // When
    const result = filterClientes(clientes, 'garcia')

    // Then
    expect(result).toHaveLength(2)
    const nombres = result.map((c) => c.nombre)
    expect(nombres).toContain('Ana García')
    expect(nombres).toContain('Luis García')
  })

  it('Given two clients sharing partial NIT prefix When searching that prefix Then both are returned', () => {
    // Given
    const clientes: Cliente[] = [
      { ...base, nit: '900-111-001' },
      { ...second, nit: '900-222-002' },
    ]

    // When
    const result = filterClientes(clientes, '900')

    // Then
    expect(result).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// [P1] Query matches both nombre AND nit on the same record
// Ensures no duplication (client returned once even if both fields match)
// ---------------------------------------------------------------------------
describe('filterClientes — [P1] query matching both nombre and nit on same record', () => {
  it('Given a client whose nombre AND nit both contain the query When filtering Then the client appears exactly once', () => {
    // Given — nombre contains "100" and nit contains "100"
    const client: Cliente = { ...base, nombre: 'Empresa 100 SA', nit: '100-000-001' }
    const clientes: Cliente[] = [client]

    // When
    const result = filterClientes(clientes, '100')

    // Then — returned exactly once
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(client.id)
  })
})

// ---------------------------------------------------------------------------
// [P1] All Spanish accent variants normalized correctly
// Edge case: all five accented vowels á, é, í, ó, ú must work as query and as stored value
// ---------------------------------------------------------------------------
describe('filterClientes — [P1] full accent normalization across all Spanish vowels', () => {
  const accentedClientes: Cliente[] = [
    { ...base, nombre: 'Álvaro Ávila', nit: '901-001' },
    { ...base, id: 'uuid-2', nombre: 'Élida Érika', nit: '902-002' },
    { ...base, id: 'uuid-3', nombre: 'Íñigo Ídolo', nit: '903-003' },
    { ...base, id: 'uuid-4', nombre: 'Óscar Órtega', nit: '904-004' },
    { ...base, id: 'uuid-5', nombre: 'Úrsula Última', nit: '905-005' },
  ]

  it('Given "Álvaro Ávila" When searching "alvaro" (no accent) Then matches', () => {
    const result = filterClientes(accentedClientes, 'alvaro')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Álvaro Ávila')
  })

  it('Given "Élida Érika" When searching "elida" (no accent) Then matches', () => {
    const result = filterClientes(accentedClientes, 'elida')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Élida Érika')
  })

  it('Given "Íñigo Ídolo" When searching "inigo" (no accent, no tilde) Then matches', () => {
    const result = filterClientes(accentedClientes, 'inigo')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Íñigo Ídolo')
  })

  it('Given "Óscar Órtega" When searching "oscar" (no accent) Then matches', () => {
    const result = filterClientes(accentedClientes, 'oscar')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Óscar Órtega')
  })

  it('Given "Úrsula Última" When searching "ursula" (no accent) Then matches', () => {
    const result = filterClientes(accentedClientes, 'ursula')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Úrsula Última')
  })
})

// ---------------------------------------------------------------------------
// [P1] NIT formats with special separators (hyphens, dots)
// Edge case: partial NIT with separator characters
// ---------------------------------------------------------------------------
describe('filterClientes — [P1] NIT with separator characters', () => {
  it('Given NIT "900-111-001" When searching "111" (middle segment) Then client matches', () => {
    // Given
    const clientes: Cliente[] = [{ ...base, nit: '900-111-001' }]

    // When
    const result = filterClientes(clientes, '111')

    // Then
    expect(result).toHaveLength(1)
  })

  it('Given NIT "900.111.001" (dots) When searching "900" Then client matches', () => {
    // Given
    const clientes: Cliente[] = [{ ...base, nit: '900.111.001' }]

    // When
    const result = filterClientes(clientes, '900')

    // Then
    expect(result).toHaveLength(1)
  })

  it('Given NIT "9001110010" (no separators) When searching full NIT Then client matches', () => {
    // Given
    const clientes: Cliente[] = [{ ...base, nit: '9001110010' }]

    // When
    const result = filterClientes(clientes, '9001110010')

    // Then
    expect(result).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// [P1] Single character query
// Boundary condition: minimum meaningful search input
// ---------------------------------------------------------------------------
describe('filterClientes — [P1] single character query', () => {
  it('Given multiple clients When query is single letter "a" Then all clients whose nombre/nit contain "a" are returned', () => {
    // Given
    const clientes: Cliente[] = [
      { ...base, nombre: 'Ana García', nit: '900-1' },
      { ...second, nombre: 'Luis Pérez', nit: '800-2' },
    ]

    // When — "a" matches "Ana García" (nombre has "a") but "Luis Pérez" has no "a" in nombre or nit "800-2"
    const result = filterClientes(clientes, 'a')

    // Then — only client with "a" in nombre or nit
    expect(result.length).toBeGreaterThanOrEqual(1)
    result.forEach((c) => {
      const normalNombre = c.nombre.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
      const normalNit = c.nit.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
      expect(normalNombre.includes('a') || normalNit.includes('a')).toBe(true)
    })
  })

  it('Given a client When query is a single digit "9" matching NIT Then client is returned', () => {
    // Given
    const clientes: Cliente[] = [{ ...base, nit: '900-1' }]

    // When
    const result = filterClientes(clientes, '9')

    // Then
    expect(result).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// [P2] Query longer than any field value
// Boundary condition: oversized query should return empty
// ---------------------------------------------------------------------------
describe('filterClientes — [P2] query longer than any field value', () => {
  it('Given a client When query is extremely long (200 chars) and does not match Then result is empty', () => {
    // Given
    const clientes: Cliente[] = [{ ...base }]
    const longQuery = 'x'.repeat(200)

    // When
    const result = filterClientes(clientes, longQuery)

    // Then
    expect(result).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// [P2] Query is tab character only (not just spaces)
// Boundary: whitespace-only via different whitespace character
// ---------------------------------------------------------------------------
describe('filterClientes — [P2] tab and mixed whitespace query', () => {
  it('Given a client list When query is a tab character Then all clients are returned (treated as blank)', () => {
    // Given
    const clientes: Cliente[] = [base, second]
    const query = '\t'

    // When
    const result = filterClientes(clientes, query)

    // Then — tab-only trims to empty, returns all
    expect(result).toHaveLength(2)
  })

  it('Given a client list When query is mixed spaces and tabs Then all clients are returned', () => {
    // Given
    const clientes: Cliente[] = [base, second]
    const query = '  \t  '

    // When
    const result = filterClientes(clientes, query)

    // Then
    expect(result).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// [P2] Case combinations — UPPERCASE query against UPPERCASE stored name
// ---------------------------------------------------------------------------
describe('filterClientes — [P2] uppercase stored nombre with uppercase query', () => {
  it('Given nombre stored in UPPERCASE When searching in lowercase Then matches', () => {
    // Given
    const clientes: Cliente[] = [{ ...base, nombre: 'EMPRESA NACIONAL SAS' }]

    // When
    const result = filterClientes(clientes, 'empresa')

    // Then
    expect(result).toHaveLength(1)
  })

  it('Given nombre stored in UPPERCASE When searching in uppercase Then matches', () => {
    // Given
    const clientes: Cliente[] = [{ ...base, nombre: 'EMPRESA NACIONAL SAS' }]

    // When
    const result = filterClientes(clientes, 'NACIONAL')

    // Then
    expect(result).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// [P2] Immutability: original array not mutated by filter
// Quality/correctness: filterClientes must be a pure function
// ---------------------------------------------------------------------------
describe('filterClientes — [P2] pure function — does not mutate input array', () => {
  it('Given a clientes array When filterClientes is called with a query Then the original array is not mutated', () => {
    // Given
    const clientes: Cliente[] = [base, second]
    const originalLength = clientes.length
    const originalFirst = clientes[0]

    // When
    filterClientes(clientes, 'garcia')

    // Then — original array unchanged
    expect(clientes).toHaveLength(originalLength)
    expect(clientes[0]).toBe(originalFirst)
  })
})

// ---------------------------------------------------------------------------
// [P2] Performance: re-invocation does not degrade (no accumulated state)
// ---------------------------------------------------------------------------
describe('filterClientes — [P2] repeated calls are independently fast', () => {
  it('Given 500 clients When filterClientes is called 10 times in sequence Then each call completes under 50ms', () => {
    // Given
    const clientes: Cliente[] = Array.from({ length: 500 }, (_, i) => ({
      id: `uuid-${i}`,
      nombre: `Cliente ${i}`,
      nit: `900-${i}`,
      telefono: '3000000000',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00+00:00',
      updatedAt: '2026-01-01T00:00:00+00:00',
    }))

    // When / Then
    for (let call = 0; call < 10; call++) {
      const start = performance.now()
      filterClientes(clientes, `Cliente ${call}`)
      const elapsed = performance.now() - start
      expect(elapsed).toBeLessThan(50)
    }
  })
})
