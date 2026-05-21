import { describe, it, expect } from 'vitest'
import { clienteSchema } from '../clienteSchema'

/**
 * Unit tests for clienteSchema (Zod) — Story 2.3 edge case expansion.
 * BMad-Integrated: covers boundary conditions and error paths not in ATDD tests.
 *
 * Test IDs: UNIT-C-FE-SCHEMA-01 … UNIT-C-FE-SCHEMA-14
 */

describe('clienteSchema — validation boundaries', () => {
  const validPayload = {
    nombre: 'Empresa Válida SAS',
    nit: '900100001-0',
    telefono: '3001234567',
    ciudad: 'Bogotá',
  }

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-01: Valid complete payload passes
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-01 — valid complete payload passes validation', () => {
    const result = clienteSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-02: Empty string nombre fails with Spanish message
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-02 — empty nombre fails with required message', () => {
    const result = clienteSchema.safeParse({ ...validPayload, nombre: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nombreErrors = result.error.issues.filter((i) => i.path[0] === 'nombre')
      expect(nombreErrors.length).toBeGreaterThan(0)
      expect(nombreErrors[0].message).toMatch(/nombre.*requerido|requerido/i)
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-03: Empty string nit fails with Spanish message
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-03 — empty nit fails with required message', () => {
    const result = clienteSchema.safeParse({ ...validPayload, nit: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nitErrors = result.error.issues.filter((i) => i.path[0] === 'nit')
      expect(nitErrors.length).toBeGreaterThan(0)
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-04: Empty string telefono fails
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-04 — empty telefono fails validation', () => {
    const result = clienteSchema.safeParse({ ...validPayload, telefono: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.issues.filter((i) => i.path[0] === 'telefono')
      expect(errors.length).toBeGreaterThan(0)
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-05: Empty string ciudad fails
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-05 — empty ciudad fails validation', () => {
    const result = clienteSchema.safeParse({ ...validPayload, ciudad: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.issues.filter((i) => i.path[0] === 'ciudad')
      expect(errors.length).toBeGreaterThan(0)
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-06: Nombre at max length (200 chars) passes
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-06 — nombre at exactly 200 chars passes', () => {
    const result = clienteSchema.safeParse({ ...validPayload, nombre: 'A'.repeat(200) })
    expect(result.success).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-07: Nombre exceeding max length (201 chars) fails
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-07 — nombre exceeding 200 chars fails', () => {
    const result = clienteSchema.safeParse({ ...validPayload, nombre: 'A'.repeat(201) })
    expect(result.success).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-08: Nit at max length (50 chars) passes
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-08 — nit at exactly 50 chars passes', () => {
    const result = clienteSchema.safeParse({ ...validPayload, nit: '9'.repeat(50) })
    expect(result.success).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-09: Nit exceeding max length (51 chars) fails
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-09 — nit exceeding 50 chars fails', () => {
    const result = clienteSchema.safeParse({ ...validPayload, nit: '9'.repeat(51) })
    expect(result.success).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-10: Telefono at max length (50 chars) passes
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-10 — telefono at exactly 50 chars passes', () => {
    const result = clienteSchema.safeParse({ ...validPayload, telefono: '3'.repeat(50) })
    expect(result.success).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-11: Ciudad at max length (100 chars) passes
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-11 — ciudad at exactly 100 chars passes', () => {
    const result = clienteSchema.safeParse({ ...validPayload, ciudad: 'B'.repeat(100) })
    expect(result.success).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-12: Ciudad exceeding max length (101 chars) fails
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-12 — ciudad exceeding 100 chars fails', () => {
    const result = clienteSchema.safeParse({ ...validPayload, ciudad: 'B'.repeat(101) })
    expect(result.success).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-13: All fields empty produces 4 validation errors
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-13 — all empty fields produce errors for each field', () => {
    const result = clienteSchema.safeParse({ nombre: '', nit: '', telefono: '', ciudad: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('nombre')
      expect(paths).toContain('nit')
      expect(paths).toContain('telefono')
      expect(paths).toContain('ciudad')
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-SCHEMA-14: Missing field (undefined) fails same as empty string
  // Boundary: Zod treats missing fields as undefined which fails min(1).
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-SCHEMA-14 — missing nombre field fails validation', () => {
    const result = clienteSchema.safeParse({
      nit: '900100001-0',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('nombre')
    }
  })
})
