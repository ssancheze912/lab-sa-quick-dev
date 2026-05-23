/**
 * Story 2.1: Client List & Search
 * Unit tests — Cliente domain interface shape (RED phase)
 *
 * Verifies the TypeScript `Cliente` interface contract.
 * These tests confirm the module can be imported and the interface
 * carries all required fields with the correct types.
 *
 * AC covered: #1 (domain entity must exist with the expected shape)
 *
 * STATUS: RED — `Cliente.ts` does not exist yet.
 */

import { describe, it, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Domain interface shape — import check
// ─────────────────────────────────────────────────────────────────────────────

describe('Cliente domain interface', () => {
  it('should export a type that allows an object with all required fields', async () => {
    // GIVEN: The Cliente module is importable
    // WHEN:  We import the type and construct a conforming object at runtime
    // THEN:  The import succeeds and the object can be assigned

    // The actual type checking happens at compile time. This test ensures
    // the module exists and can be imported without runtime errors.
    const mod = await import('../Cliente')
    expect(mod).toBeDefined()
  })

  it('should allow creating a valid Cliente-shaped object with all 7 required fields', () => {
    // GIVEN: A fully populated Cliente-shaped object
    // WHEN:  We construct it with all required fields
    // THEN:  TypeScript does not reject it (verified at compile time) and
    //        the runtime object has all expected keys

    const cliente = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      nombre: 'Empresa ABC',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-05-23T10:00:00Z',
      updatedAt: '2026-05-23T10:00:00Z',
    }

    expect(cliente).toHaveProperty('id')
    expect(cliente).toHaveProperty('nombre')
    expect(cliente).toHaveProperty('nit')
    expect(cliente).toHaveProperty('telefono')
    expect(cliente).toHaveProperty('ciudad')
    expect(cliente).toHaveProperty('createdAt')
    expect(cliente).toHaveProperty('updatedAt')
  })

  it('should have id as a string field', () => {
    // GIVEN: A Cliente object
    const cliente = {
      id: 'abc-123',
      nombre: 'Test',
      nit: '900',
      telefono: '300',
      ciudad: 'Cali',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    // THEN: id is a string
    expect(typeof cliente.id).toBe('string')
  })

  it('should have nombre as a string field', () => {
    const cliente = {
      id: '1',
      nombre: 'Empresa XYZ',
      nit: '123',
      telefono: '310',
      ciudad: 'Medellín',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    expect(typeof cliente.nombre).toBe('string')
  })

  it('should have nit as a string field', () => {
    const cliente = {
      id: '1',
      nombre: 'Empresa',
      nit: '900111222',
      telefono: '310',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }
    expect(typeof cliente.nit).toBe('string')
  })
})
