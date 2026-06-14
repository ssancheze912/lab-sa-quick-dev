/**
 * Story 2.3: Create Client — Zod Schema Unit Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - clienteSchema does not exist yet (frontend/src/modules/crm/clientes/application/clienteSchema.ts)
 *
 * Acceptance Criteria covered:
 *   AC#2 — Valid values are accepted by schema
 *   AC#3 — Empty required fields produce Spanish inline error messages (FR8, NFR5)
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P3-04: Zod schema rejects empty NIT field
 */

import { describe, it, expect } from 'vitest'

// RED: This import will fail until implementation exists.
// Expected failure: "Cannot find module '../clienteSchema'"
import { clienteSchema } from '../clienteSchema'

describe('clienteSchema — Zod validation (Story 2.3)', () => {

  // ─── Happy path ─────────────────────────────────────────────────────────────

  it('parse_WithAllValidFields_Succeeds', () => {
    // GIVEN: all 4 required fields with valid values
    const input = {
      nombre: 'Empresa ABC',
      nit: '900123456-7',
      telefono: '601 234 5678',
      ciudad: 'Bogotá',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parse succeeds with no errors
    expect(result.success).toBe(true)
  })

  it('parse_WithAllValidFields_ReturnsTypedObject', () => {
    // GIVEN: valid input
    const input = {
      nombre: 'Siesa Tech',
      nit: '800555111-0',
      telefono: '6014445566',
      ciudad: 'Medellín',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parsed output matches input exactly
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.nombre).toBe(input.nombre)
      expect(result.data.nit).toBe(input.nit)
      expect(result.data.telefono).toBe(input.telefono)
      expect(result.data.ciudad).toBe(input.ciudad)
    }
  })

  // ─── Empty nombre ─────────────────────────────────────────────────────────

  it('parse_WithEmptyNombre_FailsWithSpanishMessage', () => {
    // GIVEN: nombre is empty string
    const input = {
      nombre: '',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parse fails
    expect(result.success).toBe(false)

    // AND: error message is in Spanish and references nombre
    if (!result.success) {
      const errors = result.error.errors
      const nombreError = errors.find((e) => e.path[0] === 'nombre')
      expect(nombreError).toBeDefined()
      expect(nombreError!.message).toBe('El nombre es requerido')
    }
  })

  it('parse_WithNullNombre_Fails', () => {
    // GIVEN: nombre is null (missing)
    const input = {
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    }

    // WHEN: schema parses the input (nombre absent)
    const result = clienteSchema.safeParse(input)

    // THEN: parse fails with an error on the nombre field
    expect(result.success).toBe(false)
  })

  // ─── Empty nit ────────────────────────────────────────────────────────────

  it('parse_WithEmptyNit_FailsWithSpanishMessage', () => {
    // GIVEN: nit is empty string
    const input = {
      nombre: 'Empresa Test',
      nit: '',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parse fails
    expect(result.success).toBe(false)

    // AND: error message is in Spanish and references nit
    if (!result.success) {
      const errors = result.error.errors
      const nitError = errors.find((e) => e.path[0] === 'nit')
      expect(nitError).toBeDefined()
      expect(nitError!.message).toBe('El NIT/RUC es requerido')
    }
  })

  it('parse_WithNullNit_Fails', () => {
    // GIVEN: nit is absent
    const input = {
      nombre: 'Empresa Test',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parse fails
    expect(result.success).toBe(false)
  })

  // ─── Empty telefono ───────────────────────────────────────────────────────

  it('parse_WithEmptyTelefono_FailsWithSpanishMessage', () => {
    // GIVEN: telefono is empty string
    const input = {
      nombre: 'Empresa Test',
      nit: '900123456-7',
      telefono: '',
      ciudad: 'Bogotá',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parse fails
    expect(result.success).toBe(false)

    // AND: error message is in Spanish and references telefono
    if (!result.success) {
      const errors = result.error.errors
      const telefonoError = errors.find((e) => e.path[0] === 'telefono')
      expect(telefonoError).toBeDefined()
      expect(telefonoError!.message).toBe('El teléfono es requerido')
    }
  })

  it('parse_WithNullTelefono_Fails', () => {
    // GIVEN: telefono is absent
    const input = {
      nombre: 'Empresa Test',
      nit: '900123456-7',
      ciudad: 'Bogotá',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parse fails
    expect(result.success).toBe(false)
  })

  // ─── Empty ciudad ─────────────────────────────────────────────────────────

  it('parse_WithEmptyCiudad_FailsWithSpanishMessage', () => {
    // GIVEN: ciudad is empty string
    const input = {
      nombre: 'Empresa Test',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: '',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parse fails
    expect(result.success).toBe(false)

    // AND: error message is in Spanish and references ciudad
    if (!result.success) {
      const errors = result.error.errors
      const ciudadError = errors.find((e) => e.path[0] === 'ciudad')
      expect(ciudadError).toBeDefined()
      expect(ciudadError!.message).toBe('La ciudad es requerida')
    }
  })

  it('parse_WithNullCiudad_Fails', () => {
    // GIVEN: ciudad is absent
    const input = {
      nombre: 'Empresa Test',
      nit: '900123456-7',
      telefono: '3001234567',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parse fails
    expect(result.success).toBe(false)
  })

  // ─── Multiple empty fields at once ───────────────────────────────────────

  it('parse_WithAllFieldsEmpty_FailsWithFourErrors', () => {
    // GIVEN: all 4 fields are empty
    const input = {
      nombre: '',
      nit: '',
      telefono: '',
      ciudad: '',
    }

    // WHEN: schema parses the input
    const result = clienteSchema.safeParse(input)

    // THEN: parse fails with at least 4 errors (one per field)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThanOrEqual(4)
    }
  })
})
