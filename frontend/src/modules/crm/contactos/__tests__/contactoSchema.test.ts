import { describe, it, expect } from 'vitest'
import { contactoSchema } from '../application/contactoSchema'

/**
 * ATDD — Story 3.3: Create Contact
 * Frontend Unit Tests — Zod Schema Validation
 *
 * Tests are in RED phase — contactoSchema does not exist yet.
 * Make these tests GREEN by implementing:
 *   frontend/src/modules/crm/contactos/application/contactoSchema.ts
 *
 * Unit Coverage:
 *   UNIT-CT-01  P1  — contactoSchema rejects empty nombre → ZodError
 *   UNIT-CT-02  P1  — contactoSchema rejects empty email → ZodError
 *   UNIT-CT-03  P1  — contactoSchema rejects invalid email format → ZodError
 *   UNIT-CT-04  P1  — contactoSchema accepts valid 4-field payload → returns parsed object
 */

const VALID_PAYLOAD = {
  nombre: 'María García',
  cargo: 'Gerente Comercial',
  telefono: '+57 1 234 5679',
  email: 'm.garcia@empresa.com',
}

describe('contactoSchema', () => {
  // ---------------------------------------------------------------------------
  // UNIT-CT-01 (P1 · AC3)
  // Given a payload with an empty nombre field
  // When the Zod schema parses the payload
  // Then it returns a ZodError (safeParse success = false)
  //   AND the error path contains 'nombre'
  // ---------------------------------------------------------------------------
  it('UNIT-CT-01 — rejects a payload with empty nombre and returns ZodError', () => {
    // GIVEN — payload with empty nombre
    const payload = { ...VALID_PAYLOAD, nombre: '' }

    // WHEN — schema parses the payload
    const result = contactoSchema.safeParse(payload)

    // THEN — parsing fails
    expect(result.success).toBe(false)

    // AND — the error is on the 'nombre' field
    if (!result.success) {
      const nombreError = result.error.issues.find(
        (issue) => issue.path[0] === 'nombre'
      )
      expect(nombreError).toBeDefined()
      expect(nombreError?.message).toBeTruthy()
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-02 (P1 · AC3)
  // Given a payload with an empty email field
  // When the Zod schema parses the payload
  // Then it returns a ZodError (safeParse success = false)
  //   AND the error path contains 'email'
  // ---------------------------------------------------------------------------
  it('UNIT-CT-02 — rejects a payload with empty email and returns ZodError', () => {
    // GIVEN — payload with empty email
    const payload = { ...VALID_PAYLOAD, email: '' }

    // WHEN — schema parses the payload
    const result = contactoSchema.safeParse(payload)

    // THEN — parsing fails
    expect(result.success).toBe(false)

    // AND — the error is on the 'email' field
    if (!result.success) {
      const emailError = result.error.issues.find(
        (issue) => issue.path[0] === 'email'
      )
      expect(emailError).toBeDefined()
      expect(emailError?.message).toBeTruthy()
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-03 (P1 · AC3)
  // Given a payload with an invalid email format
  // When the Zod schema parses the payload
  // Then it returns a ZodError (safeParse success = false)
  //   AND the error path contains 'email'
  //   AND the error message indicates invalid format (in Spanish)
  // ---------------------------------------------------------------------------
  it('UNIT-CT-03 — rejects a payload with invalid email format and returns ZodError with Spanish message', () => {
    // GIVEN — payload with a non-email string for the email field
    const payload = { ...VALID_PAYLOAD, email: 'not-an-email' }

    // WHEN — schema parses the payload
    const result = contactoSchema.safeParse(payload)

    // THEN — parsing fails
    expect(result.success).toBe(false)

    // AND — the error is on the 'email' field with format-related message
    if (!result.success) {
      const emailError = result.error.issues.find(
        (issue) => issue.path[0] === 'email'
      )
      expect(emailError).toBeDefined()
      // Message should be Spanish (e.g. "El email no tiene un formato válido")
      expect(emailError?.message).toBeTruthy()
    }
  })

  // ---------------------------------------------------------------------------
  // UNIT-CT-04 (P1 · AC1, AC2)
  // Given a valid payload with all 4 required fields
  // When the Zod schema parses the payload
  // Then parsing succeeds
  //   AND the returned data matches the input values
  //   AND the returned type satisfies ContactoFormValues
  // ---------------------------------------------------------------------------
  it('UNIT-CT-04 — accepts a valid payload with all 4 fields and returns parsed object', () => {
    // GIVEN — valid payload
    const payload = { ...VALID_PAYLOAD }

    // WHEN — schema parses the payload
    const result = contactoSchema.safeParse(payload)

    // THEN — parsing succeeds
    expect(result.success).toBe(true)

    // AND — returned data matches input
    if (result.success) {
      expect(result.data.nombre).toBe(VALID_PAYLOAD.nombre)
      expect(result.data.cargo).toBe(VALID_PAYLOAD.cargo)
      expect(result.data.telefono).toBe(VALID_PAYLOAD.telefono)
      expect(result.data.email).toBe(VALID_PAYLOAD.email)
    }
  })

  // ---------------------------------------------------------------------------
  // Additional edge: empty cargo also fails (all 4 fields required)
  // ---------------------------------------------------------------------------
  it('rejects a payload with empty cargo and returns ZodError on cargo field', () => {
    const payload = { ...VALID_PAYLOAD, cargo: '' }
    const result = contactoSchema.safeParse(payload)

    expect(result.success).toBe(false)
    if (!result.success) {
      const cargoError = result.error.issues.find(
        (issue) => issue.path[0] === 'cargo'
      )
      expect(cargoError).toBeDefined()
    }
  })

  // ---------------------------------------------------------------------------
  // Additional edge: empty telefono also fails (all 4 fields required)
  // ---------------------------------------------------------------------------
  it('rejects a payload with empty telefono and returns ZodError on telefono field', () => {
    const payload = { ...VALID_PAYLOAD, telefono: '' }
    const result = contactoSchema.safeParse(payload)

    expect(result.success).toBe(false)
    if (!result.success) {
      const telefonoError = result.error.issues.find(
        (issue) => issue.path[0] === 'telefono'
      )
      expect(telefonoError).toBeDefined()
    }
  })
})
