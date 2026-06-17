/**
 * Story 2.3: Create Client — Schema Edge Case Tests (Automate Expansion)
 * Epic 2: Client Management
 *
 * Coverage expansion beyond ATDD for clienteSchema boundary conditions.
 * Tests NOT covered by clienteSchema.story2-3.test.ts or clienteSchema.test.ts.
 *
 * Edge cases added:
 *   [P2] Boundary: exactly max-length values must PASS validation
 *   [P2] Boundary: exceeding max-length by 1 must FAIL validation
 *   [P2] Correct max-length error messages in Spanish
 *   [P3] Unknown extra fields are stripped (Zod passthrough vs strip behavior)
 *   [P3] Non-string types for fields (number, null, undefined) fail validation
 *
 * Tooling: Vitest 2+
 */

import { describe, it, expect } from 'vitest'
import { clienteSchema } from './clienteSchema'

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Boundary: exactly max-length values must pass validation
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Boundary conditions — values at the exact maximum length must pass', () => {
  it('should pass validation when "nombre" has exactly 200 characters', () => {
    // GIVEN: nombre is exactly 200 characters (max boundary)
    const result = clienteSchema.safeParse({
      nombre: 'A'.repeat(200),
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'Bogotá',
    })

    // THEN: Validation succeeds (200 is the allowed maximum)
    expect(result.success).toBe(true)
  })

  it('should pass validation when "nitRuc" has exactly 50 characters', () => {
    // GIVEN: nitRuc is exactly 50 characters (max boundary)
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Boundary S.A.',
      nitRuc: 'N'.repeat(50),
      telefono: '3000000001',
      ciudad: 'Bogotá',
    })

    // THEN: Validation succeeds
    expect(result.success).toBe(true)
  })

  it('should pass validation when "telefono" has exactly 50 characters', () => {
    // GIVEN: telefono is exactly 50 characters (max boundary)
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Boundary S.A.',
      nitRuc: '900000001-1',
      telefono: '3'.repeat(50),
      ciudad: 'Bogotá',
    })

    // THEN: Validation succeeds
    expect(result.success).toBe(true)
  })

  it('should pass validation when "ciudad" has exactly 100 characters', () => {
    // GIVEN: ciudad is exactly 100 characters (max boundary)
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Boundary S.A.',
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'C'.repeat(100),
    })

    // THEN: Validation succeeds
    expect(result.success).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Boundary: exceeding max-length by exactly 1 character must fail
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Boundary conditions — values exceeding maximum length by 1 must fail', () => {
  it('should fail validation with correct Spanish error when "nombre" has 201 characters', () => {
    // GIVEN: nombre is 201 characters (one over the max)
    const result = clienteSchema.safeParse({
      nombre: 'A'.repeat(201),
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'Bogotá',
    })

    // THEN: Validation fails with Spanish max-length error message
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.nombre).toBeDefined()
      expect(fieldErrors.nombre![0]).toMatch(/200/i)
    }
  })

  it('should fail validation with correct Spanish error when "nitRuc" has 51 characters', () => {
    // GIVEN: nitRuc is 51 characters (one over the max)
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: 'N'.repeat(51),
      telefono: '3000000001',
      ciudad: 'Bogotá',
    })

    // THEN: Validation fails with Spanish max-length error message
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.nitRuc).toBeDefined()
      expect(fieldErrors.nitRuc![0]).toMatch(/50/i)
    }
  })

  it('should fail validation with correct Spanish error when "telefono" has 51 characters', () => {
    // GIVEN: telefono is 51 characters (one over the max)
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: '900000001-1',
      telefono: '3'.repeat(51),
      ciudad: 'Bogotá',
    })

    // THEN: Validation fails with Spanish max-length error message
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.telefono).toBeDefined()
      expect(fieldErrors.telefono![0]).toMatch(/50/i)
    }
  })

  it('should fail validation with correct Spanish error when "ciudad" has 101 characters', () => {
    // GIVEN: ciudad is 101 characters (one over the max)
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'C'.repeat(101),
    })

    // THEN: Validation fails with Spanish max-length error message
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.ciudad).toBeDefined()
      expect(fieldErrors.ciudad![0]).toMatch(/100/i)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P3] Non-string types fail validation gracefully
// ─────────────────────────────────────────────────────────────────────────────

describe('[P3] Non-string type inputs fail validation gracefully (no thrown errors)', () => {
  it('should fail validation when "nombre" is a number instead of a string', () => {
    // GIVEN: nombre is a number (invalid type)
    const result = clienteSchema.safeParse({
      nombre: 12345,
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'Bogotá',
    })

    // THEN: Validation fails (Zod should handle type coercion and fail safely)
    expect(result.success).toBe(false)
  })

  it('should fail validation when "nitRuc" is null', () => {
    // GIVEN: nitRuc is null
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: null,
      telefono: '3000000001',
      ciudad: 'Bogotá',
    })

    // THEN: Validation fails
    expect(result.success).toBe(false)
  })

  it('should fail validation when any field is undefined', () => {
    // GIVEN: telefono is explicitly undefined
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Test S.A.',
      nitRuc: '900000001-1',
      telefono: undefined,
      ciudad: 'Bogotá',
    })

    // THEN: Validation fails
    expect(result.success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P3] Extra fields — Zod strip behavior (schema uses default strip mode)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P3] Extra fields are silently stripped (Zod default strip behavior)', () => {
  it('should pass validation and strip unknown extra fields from the parsed output', () => {
    // GIVEN: Input has all valid fields plus an unknown extra field
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Strip S.A.',
      nitRuc: '900000001-1',
      telefono: '3000000001',
      ciudad: 'Bogotá',
      extraField: 'should be stripped',
    })

    // THEN: Validation passes and extraField is NOT in the output
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).extraField).toBeUndefined()
    }
  })
})
