/**
 * Story 2.3: Create Client — Unit Tests for clienteSchema (Zod)
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Unit Level — Vitest)
 * These tests FAIL until the implementation is complete.
 *
 * Test IDs covered:
 *   TC-E2-P3-02 — clienteSchema validates all 4 required fields with Spanish error messages
 *
 * NOTE: Story 2.3 creates clienteSchema.ts. Story 2.4 (Edit) will reuse it.
 * This file tests the schema as exported by clienteSchema.ts (the create-flow schema).
 *
 * Tooling: Vitest 2+
 */

import { describe, it, expect } from 'vitest'
import { clienteSchema } from './clienteSchema'

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P3-02 — Zod clienteSchema validates all 4 required fields
// AC3: All 4 fields required; Spanish error messages (MANDATORY)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P3-02 — clienteSchema (Story 2.3) validates all 4 required fields', () => {
  it('should pass validation when all 4 required fields are provided with valid values', () => {
    // GIVEN: A fully valid object with all 4 required fields
    // WHEN: clienteSchema is parsed
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Válida S.A.S.',
      nitRuc: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })

    // THEN: Validation succeeds
    expect(result.success).toBe(true)
  })

  it('should fail validation when "nombre" is an empty string', () => {
    // GIVEN: An object with nombre = "" (required field empty)
    // WHEN: clienteSchema is parsed
    const result = clienteSchema.safeParse({
      nombre: '',
      nitRuc: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })

    // THEN: Validation fails on the "nombre" field
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.nombre).toBeDefined()
      expect(fieldErrors.nombre!.length).toBeGreaterThan(0)
    }
  })

  it('should fail validation when "nitRuc" is an empty string', () => {
    // GIVEN: An object with nitRuc = ""
    // WHEN: clienteSchema is parsed
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Válida S.A.',
      nitRuc: '',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })

    // THEN: Validation fails on the "nitRuc" field
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.nitRuc).toBeDefined()
      expect(fieldErrors.nitRuc!.length).toBeGreaterThan(0)
    }
  })

  it('should fail validation when "telefono" is an empty string', () => {
    // GIVEN: An object with telefono = ""
    // WHEN: clienteSchema is parsed
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Válida S.A.',
      nitRuc: '900123456-1',
      telefono: '',
      ciudad: 'Bogotá',
    })

    // THEN: Validation fails on the "telefono" field
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.telefono).toBeDefined()
      expect(fieldErrors.telefono!.length).toBeGreaterThan(0)
    }
  })

  it('should fail validation when "ciudad" is an empty string', () => {
    // GIVEN: An object with ciudad = ""
    // WHEN: clienteSchema is parsed
    const result = clienteSchema.safeParse({
      nombre: 'Empresa Válida S.A.',
      nitRuc: '900123456-1',
      telefono: '3001234567',
      ciudad: '',
    })

    // THEN: Validation fails on the "ciudad" field
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.ciudad).toBeDefined()
      expect(fieldErrors.ciudad!.length).toBeGreaterThan(0)
    }
  })

  it('should produce Spanish error messages for all empty required fields (MANDATORY per story)', () => {
    // GIVEN: All fields are empty strings
    // WHEN: clienteSchema is parsed
    const result = clienteSchema.safeParse({
      nombre: '',
      nitRuc: '',
      telefono: '',
      ciudad: '',
    })

    // THEN: Error messages are in Spanish (MANDATORY — contractual for component tests)
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      // Spanish error messages as defined in the mandatory schema:
      //   nombre: 'El nombre es requerido'
      //   nitRuc: 'El NIT/RUC es requerido'
      //   telefono: 'El teléfono es requerido'
      //   ciudad: 'La ciudad es requerida'
      expect(fieldErrors.nombre?.[0]).toMatch(/nombre.*requerido|requerido/i)
      expect(fieldErrors.nitRuc?.[0]).toMatch(/nit|requerido/i)
      expect(fieldErrors.telefono?.[0]).toMatch(/tel.*requerido|requerido/i)
      expect(fieldErrors.ciudad?.[0]).toMatch(/ciudad.*requerida|requerida/i)
    }
  })

  it('should infer the correct TypeScript type from clienteSchema (ClienteFormValues)', () => {
    // GIVEN: A valid object matching the schema
    // WHEN: clienteSchema.parse is used (throws on failure)
    const parsed = clienteSchema.parse({
      nombre: 'Empresa Type Safe S.A.',
      nitRuc: '900999999-9',
      telefono: '3009999999',
      ciudad: 'Cartagena',
    })

    // THEN: The parsed result has all 4 string fields (TypeScript type assertion at runtime)
    expect(typeof parsed.nombre).toBe('string')
    expect(typeof parsed.nitRuc).toBe('string')
    expect(typeof parsed.telefono).toBe('string')
    expect(typeof parsed.ciudad).toBe('string')
  })
})
