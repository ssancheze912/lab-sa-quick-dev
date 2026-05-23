import { describe, it, expect } from 'vitest'
import type { Contacto } from '../domain/Contacto'
import { filterOrphanContactos } from '../application/filterOrphanContactos'

/**
 * ATDD — Story 4.5: Orphan Contacts Filter
 * Frontend Unit Tests — RED Phase
 *
 * Tests are intentionally failing until filterOrphanContactos is implemented.
 *
 * Coverage:
 *   UNIT-AC-04  P1  — filterOrphanContactos(contacts) returns only contacts where clienteId === null (AC1)
 *   UNIT-AC-05  P1  — filterOrphanContactos([]) returns empty array without error (AC1)
 */

const mockContactosWithMixed: Contacto[] = [
  {
    id: '1',
    nombre: 'Huerfano Uno',
    cargo: 'Gerente',
    telefono: '+57 1 111 1111',
    email: 'huerfano1@empresa.com',
    clienteId: null,
    createdAt: '2026-05-21T10:00:00Z',
    updatedAt: '2026-05-21T10:00:00Z',
  },
  {
    id: '2',
    nombre: 'Con Cliente Dos',
    cargo: 'Directora',
    telefono: '+57 1 222 2222',
    email: 'concliente2@empresa.com',
    clienteId: 'cliente-uuid-abc-123',
    createdAt: '2026-05-21T11:00:00Z',
    updatedAt: '2026-05-21T11:00:00Z',
  },
  {
    id: '3',
    nombre: 'Huerfano Tres',
    cargo: 'Analista',
    telefono: '+57 1 333 3333',
    email: 'huerfano3@empresa.com',
    clienteId: null,
    createdAt: '2026-05-21T12:00:00Z',
    updatedAt: '2026-05-21T12:00:00Z',
  },
  {
    id: '4',
    nombre: 'Con Cliente Cuatro',
    cargo: 'Coordinador',
    telefono: '+57 1 444 4444',
    email: 'concliente4@empresa.com',
    clienteId: 'cliente-uuid-def-456',
    createdAt: '2026-05-21T13:00:00Z',
    updatedAt: '2026-05-21T13:00:00Z',
  },
]

const mockContactosAllWithCliente: Contacto[] = [
  {
    id: '5',
    nombre: 'Con Cliente Cinco',
    cargo: 'Analista',
    telefono: '+57 1 555 5555',
    email: 'concliente5@empresa.com',
    clienteId: 'cliente-uuid-ghi-789',
    createdAt: '2026-05-21T14:00:00Z',
    updatedAt: '2026-05-21T14:00:00Z',
  },
]

describe('filterOrphanContactos', () => {
  // UNIT-AC-04: filterOrphanContactos(contacts) returns only contacts where clienteId === null
  it('UNIT-AC-04 — returns only contacts where clienteId === null', () => {
    const result = filterOrphanContactos(mockContactosWithMixed)
    expect(result).toHaveLength(2)
    expect(result.every((c) => c.clienteId === null)).toBe(true)
    expect(result.map((c) => c.id)).toContain('1')
    expect(result.map((c) => c.id)).toContain('3')
  })

  it('UNIT-AC-04b — does NOT include contacts with a non-null clienteId', () => {
    const result = filterOrphanContactos(mockContactosWithMixed)
    const ids = result.map((c) => c.id)
    expect(ids).not.toContain('2')
    expect(ids).not.toContain('4')
  })

  it('UNIT-AC-04c — returns empty array when all contacts have a clienteId', () => {
    const result = filterOrphanContactos(mockContactosAllWithCliente)
    expect(result).toHaveLength(0)
  })

  // UNIT-AC-05: filterOrphanContactos([]) returns empty array without error
  it('UNIT-AC-05 — returns empty array when input is empty — no error thrown', () => {
    expect(() => filterOrphanContactos([])).not.toThrow()
    const result = filterOrphanContactos([])
    expect(result).toEqual([])
    expect(Array.isArray(result)).toBe(true)
  })
})
