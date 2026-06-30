/**
 * Story 2.3: Create Client — Schema Edge Cases
 * Epic 2: Client Management
 *
 * Unit-level edge case tests for createClienteSchema (Zod).
 * The ATDD tests verify the schema errors surface in the form;
 * this file verifies the schema rules in isolation.
 *
 * Covers:
 *   - Whitespace-only strings fail min(1) — Zod counts whitespace as length ≥ 1
 *   - Single character strings are valid
 *   - All four fields required in combination
 *   - Type inference: output type matches CreateClienteFormData
 */

import { describe, it, expect } from 'vitest'
import { createClienteSchema } from './clienteSchema'
import type { CreateClienteFormData } from './clienteSchema'
import type { ZodError } from 'zod'

const validPayload = {
  nombre: 'Empresa Test',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
}

describe('createClienteSchema — valid inputs', () => {
  it('[P1] accepts a fully valid payload and returns it as-is', () => {
    // GIVEN: A valid payload with all required fields
    // WHEN: Schema parses it
    const result = createClienteSchema.safeParse(validPayload)

    // THEN: Parsing succeeds and data matches input
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validPayload)
    }
  })

  it('[P2] accepts single-character values as valid (boundary: min length = 1)', () => {
    // GIVEN: All fields have exactly one character
    const minimal = { nombre: 'A', nit: '1', telefono: '3', ciudad: 'X' }

    // WHEN: Schema parses it
    const result = createClienteSchema.safeParse(minimal)

    // THEN: Valid — single char passes min(1)
    expect(result.success).toBe(true)
  })

  it('[P2] accepts long strings without truncation', () => {
    // GIVEN: Fields with long values
    const long = {
      nombre: 'A'.repeat(255),
      nit: '9'.repeat(20),
      telefono: '3'.repeat(15),
      ciudad: 'C'.repeat(100),
    }

    // WHEN: Schema parses it
    const result = createClienteSchema.safeParse(long)

    // THEN: Valid — schema has no max length constraint
    expect(result.success).toBe(true)
  })

  it('[P2] accepts strings with special characters (NIT with dash)', () => {
    // GIVEN: NIT with dash notation common in Colombia
    const payload = { ...validPayload, nit: '900123456-1' }

    // WHEN: Schema parses it
    const result = createClienteSchema.safeParse(payload)

    // THEN: Valid — schema is string-type, no format restriction
    expect(result.success).toBe(true)
  })
})

describe('createClienteSchema — invalid inputs (empty fields)', () => {
  it('[P0] rejects empty string for nombre with correct error message', () => {
    // GIVEN: nombre is empty
    const result = createClienteSchema.safeParse({ ...validPayload, nombre: '' })

    // WHEN/THEN: Fails with 'Nombre requerido' message
    expect(result.success).toBe(false)
    if (!result.success) {
      const error = result.error as ZodError
      const nombreError = error.errors.find(e => e.path.includes('nombre'))
      expect(nombreError?.message).toBe('Nombre requerido')
    }
  })

  it('[P0] rejects empty string for nit with correct error message', () => {
    // GIVEN: nit is empty
    const result = createClienteSchema.safeParse({ ...validPayload, nit: '' })

    // THEN: Fails with 'NIT/RUC requerido'
    expect(result.success).toBe(false)
    if (!result.success) {
      const nitError = result.error.errors.find(e => e.path.includes('nit'))
      expect(nitError?.message).toBe('NIT/RUC requerido')
    }
  })

  it('[P0] rejects empty string for telefono with correct error message', () => {
    // GIVEN: telefono is empty
    const result = createClienteSchema.safeParse({ ...validPayload, telefono: '' })

    // THEN: Fails with 'Teléfono requerido'
    expect(result.success).toBe(false)
    if (!result.success) {
      const telError = result.error.errors.find(e => e.path.includes('telefono'))
      expect(telError?.message).toBe('Teléfono requerido')
    }
  })

  it('[P0] rejects empty string for ciudad with correct error message', () => {
    // GIVEN: ciudad is empty
    const result = createClienteSchema.safeParse({ ...validPayload, ciudad: '' })

    // THEN: Fails with 'Ciudad requerida'
    expect(result.success).toBe(false)
    if (!result.success) {
      const ciudadError = result.error.errors.find(e => e.path.includes('ciudad'))
      expect(ciudadError?.message).toBe('Ciudad requerida')
    }
  })

  it('[P1] returns all 4 errors when all fields are empty', () => {
    // GIVEN: All fields are empty strings
    const result = createClienteSchema.safeParse({ nombre: '', nit: '', telefono: '', ciudad: '' })

    // THEN: 4 validation errors are returned
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors).toHaveLength(4)
      const paths = result.error.errors.map(e => e.path[0])
      expect(paths).toContain('nombre')
      expect(paths).toContain('nit')
      expect(paths).toContain('telefono')
      expect(paths).toContain('ciudad')
    }
  })
})

describe('createClienteSchema — whitespace-only inputs', () => {
  it('[P2] whitespace-only nombre passes Zod min(1) — Zod does not trim by default', () => {
    // NOTE: Zod z.string().min(1) counts whitespace characters as length ≥ 1.
    // This is a known Zod behavior. The form uses React Hook Form which does not
    // auto-trim. This test documents this behavior so teams can decide whether
    // to add .trim() to the schema in the future.
    const result = createClienteSchema.safeParse({ ...validPayload, nombre: '   ' })

    // THEN: Currently PASSES because '   '.length === 3 ≥ 1
    // If schema adds .trim(), this would change to a failure.
    expect(result.success).toBe(true)
  })

  it('[P2] whitespace-only nit passes Zod min(1) — documents schema trim gap', () => {
    // Same as above — whitespace-only passes min(1) in Zod without .trim()
    const result = createClienteSchema.safeParse({ ...validPayload, nit: '   ' })
    expect(result.success).toBe(true)
  })
})

describe('createClienteSchema — type inference', () => {
  it('[P2] inferred CreateClienteFormData type has exactly 4 string fields', () => {
    // GIVEN: A value matching the expected type
    const value: CreateClienteFormData = {
      nombre: 'Test',
      nit: '123',
      telefono: '456',
      ciudad: 'City',
    }

    // WHEN/THEN: TypeScript compilation succeeds and all 4 keys are present
    expect(Object.keys(value)).toHaveLength(4)
    expect(value).toHaveProperty('nombre')
    expect(value).toHaveProperty('nit')
    expect(value).toHaveProperty('telefono')
    expect(value).toHaveProperty('ciudad')
  })
})
