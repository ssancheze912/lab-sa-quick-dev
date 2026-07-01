import { describe, test, expect } from 'vitest'
import { contactoSchema } from './contactoSchema'

/**
 * Story 3.3 (AC #3, TC-E3-P2-01): unit tests for the Zod schema in isolation,
 * independent of `ContactoForm`/React Hook Form wiring. Mirrors
 * `clienteSchema.test.ts` (Story 2.3 precedent) exactly — four required
 * fields, no email-format regex (mirrors the backend validator's
 * "required only" scope, TC-E3-P3-01).
 *
 * RED PHASE: `contactoSchema.ts` does not exist yet (Story 3.3, Task 4).
 */
describe('contactoSchema', () => {
  const validPayload = {
    nombre: 'Camila Restrepo Duque',
    cargo: 'Gerente Comercial',
    telefono: '3011234567',
    email: 'camila.restrepo@ejemplo.co',
  }

  test('should return success: true for a fully valid payload', () => {
    // GIVEN a payload with all required fields populated
    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(validPayload)

    // THEN parsing succeeds
    expect(result.success).toBe(true)
  })

  test('should return success: false when nombre is an empty string', () => {
    // GIVEN a payload with an empty nombre
    const payload = { ...validPayload, nombre: '' }

    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(payload)

    // THEN parsing fails
    expect(result.success).toBe(false)
  })

  test('should return an issue on the nombre path when nombre is whitespace-only', () => {
    // GIVEN a payload with a whitespace-only nombre (Zod .trim() must catch this)
    const payload = { ...validPayload, nombre: '   ' }

    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(payload)

    // THEN the failure includes an issue for the nombre field
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('nombre'))).toBe(true)
    }
  })

  test('should return success: false when cargo is an empty string', () => {
    // GIVEN a payload with an empty cargo
    const payload = { ...validPayload, cargo: '' }

    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(payload)

    // THEN parsing fails
    expect(result.success).toBe(false)
  })

  test('should return success: false when telefono is an empty string', () => {
    // GIVEN a payload with an empty telefono
    const payload = { ...validPayload, telefono: '' }

    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(payload)

    // THEN parsing fails
    expect(result.success).toBe(false)
  })

  test('should return success: false when email is an empty string', () => {
    // GIVEN a payload with an empty email
    const payload = { ...validPayload, email: '' }

    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(payload)

    // THEN parsing fails
    expect(result.success).toBe(false)
  })

  test('should report an issue for every field when all are empty', () => {
    // GIVEN a payload where every required field is empty
    const payload = { nombre: '', cargo: '', telefono: '', email: '' }

    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(payload)

    // THEN each field has at least one issue
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0])
      expect(paths).toEqual(expect.arrayContaining(['nombre', 'cargo', 'telefono', 'email']))
    }
  })

  test('should report an issue for every field when all are whitespace-only', () => {
    // GIVEN a payload where every required field is whitespace-only
    const payload = { nombre: '   ', cargo: '   ', telefono: '   ', email: '   ' }

    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(payload)

    // THEN each field has at least one issue (Zod .trim() catches whitespace-only)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0])
      expect(paths).toEqual(expect.arrayContaining(['nombre', 'cargo', 'telefono', 'email']))
    }
  })

  test('should produce Spanish error messages', () => {
    // GIVEN a payload with an empty nombre
    const payload = { ...validPayload, nombre: '' }

    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(payload)

    // THEN the issue message is in Spanish (company standard: user-facing text in Spanish)
    expect(result.success).toBe(false)
    if (!result.success) {
      const nombreIssue = result.error.issues.find((issue) => issue.path.includes('nombre'))
      expect(nombreIssue?.message).toMatch(/obligatorio|requerido/i)
    }
  })

  test('should NOT reject an email value with no valid email format (no format rule on this field)', () => {
    // GIVEN a payload whose email is non-empty but not a valid email shape —
    // TC-E3-P3-01 explicitly documents this as out of scope for this story
    const payload = { ...validPayload, email: 'no-es-un-correo-valido' }

    // WHEN parsing it against the schema
    const result = contactoSchema.safeParse(payload)

    // THEN parsing succeeds — no email-format regex exists on this schema
    expect(result.success).toBe(true)
  })
})
