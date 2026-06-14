/**
 * Story 2.1: Client List & Search
 * Domain Tests — Cliente interface (AC: #1)
 *
 * These tests verify that the Cliente TypeScript interface exposes
 * exactly the fields required by the story. They will be in RED phase
 * until the domain file is created at:
 *   frontend/src/modules/crm/clientes/domain/Cliente.ts
 *
 * Given: the domain module exists
 * When: a value is assigned to the Cliente interface
 * Then: all required fields are present with correct types
 */

import { describe, it, expect } from 'vitest'

// RED: This import will fail until the domain file is created.
// Expected failure: Cannot find module '../Cliente'
import type { Cliente } from '../Cliente'

describe('Cliente domain interface', () => {
  it('should accept an object with all required fields', () => {
    // GIVEN: a complete client record
    const cliente: Cliente = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      nombre: 'Empresa ABC',
      nit: '900123456-7',
      telefono: '601 234 5678',
      ciudad: 'Bogotá',
      createdAt: '2026-03-12T10:30:00Z',
      updatedAt: '2026-03-12T10:30:00Z',
    }

    // WHEN: accessing each field
    // THEN: all fields are accessible and have expected types
    expect(typeof cliente.id).toBe('string')
    expect(typeof cliente.nombre).toBe('string')
    expect(typeof cliente.nit).toBe('string')
    expect(typeof cliente.telefono).toBe('string')
    expect(typeof cliente.ciudad).toBe('string')
    expect(typeof cliente.createdAt).toBe('string')
    expect(typeof cliente.updatedAt).toBe('string')
  })

  it('should have id as a string (UUID format)', () => {
    // GIVEN: a valid UUID string
    const cliente: Cliente = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      nombre: 'Test',
      nit: '900-1',
      telefono: '601',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }

    // THEN: id field exists and is a string
    expect(cliente.id).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6')
  })

  it('should require all 7 fields defined in the story', () => {
    // GIVEN: object with all required fields
    const requiredFields: (keyof Cliente)[] = [
      'id',
      'nombre',
      'nit',
      'telefono',
      'ciudad',
      'createdAt',
      'updatedAt',
    ]

    const cliente: Cliente = {
      id: '1',
      nombre: 'A',
      nit: 'B',
      telefono: 'C',
      ciudad: 'D',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }

    // THEN: all required fields are present in the object
    requiredFields.forEach((field) => {
      expect(cliente).toHaveProperty(field)
    })
  })
})
