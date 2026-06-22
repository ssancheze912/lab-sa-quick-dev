import { describe, it, expect } from 'vitest'
import type { Contacto } from '../domain/Contacto'
import { filterContactos } from '../application/filterContactos'

const mockContactos: Contacto[] = [
  {
    id: '1',
    nombre: 'Juan Pérez',
    cargo: 'Gerente',
    telefono: '+57 1 234 5678',
    email: 'juan.perez@empresa.com',
    clienteId: null,
    createdAt: '2026-05-21T10:00:00Z',
    updatedAt: '2026-05-21T10:00:00Z',
  },
  {
    id: '2',
    nombre: 'María García',
    cargo: 'Directora',
    telefono: '+57 1 234 5679',
    email: 'test@domain.com',
    clienteId: null,
    createdAt: '2026-05-21T11:00:00Z',
    updatedAt: '2026-05-21T11:00:00Z',
  },
  {
    id: '3',
    nombre: 'Carlos López',
    cargo: 'Analista',
    telefono: '+57 1 234 5680',
    email: 'carlos.lopez@empresa.com',
    clienteId: null,
    createdAt: '2026-05-21T12:00:00Z',
    updatedAt: '2026-05-21T12:00:00Z',
  },
]

describe('filterContactos', () => {
  // UNIT-CT-05: filterContactos(contacts, 'Juan') returns only contacts whose nombre contains 'Juan' (case-insensitive)
  it('UNIT-CT-05 — filters contacts by nombre (case-insensitive)', () => {
    const result = filterContactos(mockContactos, 'Juan')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Juan Pérez')
  })

  it('UNIT-CT-05b — filters contacts by nombre case-insensitively (lowercase query)', () => {
    const result = filterContactos(mockContactos, 'juan')
    expect(result).toHaveLength(1)
    expect(result[0].nombre).toBe('Juan Pérez')
  })

  // UNIT-CT-06: filterContactos(contacts, 'test@') returns only contacts whose email contains 'test@' (case-insensitive)
  it('UNIT-CT-06 — filters contacts by email (case-insensitive)', () => {
    const result = filterContactos(mockContactos, 'test@')
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('test@domain.com')
  })

  it('UNIT-CT-06b — filters contacts by email case-insensitively (uppercase query)', () => {
    const result = filterContactos(mockContactos, 'TEST@')
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('test@domain.com')
  })

  it('returns full array when query is empty', () => {
    const result = filterContactos(mockContactos, '')
    expect(result).toHaveLength(3)
  })

  it('returns full array when query is whitespace-only', () => {
    const result = filterContactos(mockContactos, '   ')
    expect(result).toHaveLength(3)
  })

  it('returns empty array when no contacts match', () => {
    const result = filterContactos(mockContactos, 'nonexistent@xyz.com')
    expect(result).toHaveLength(0)
  })
})
