import { describe, test, expect } from 'vitest'
import { clienteSchema } from './clienteSchema'

/**
 * Story 2.3 (AC #3, TC-E2-P2-01): unit tests for the Zod schema in isolation,
 * independent of `ClienteForm`/React Hook Form wiring. Pinpoints validation
 * logic bugs quickly per test-design's P2 unit-level strategy.
 *
 * RED PHASE: `clienteSchema.ts` does not exist yet (Story 2.3, Task 4).
 */
describe('clienteSchema', () => {
  const validPayload = {
    nombre: 'Comercializadora Andina SAS',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
  }

  test('should return success: true for a fully valid payload', () => {
    // GIVEN a payload with all required fields populated
    // WHEN parsing it against the schema
    const result = clienteSchema.safeParse(validPayload)

    // THEN parsing succeeds
    expect(result.success).toBe(true)
  })

  test('should return success: false when nombre is an empty string', () => {
    // GIVEN a payload with an empty nombre
    const payload = { ...validPayload, nombre: '' }

    // WHEN parsing it against the schema
    const result = clienteSchema.safeParse(payload)

    // THEN parsing fails
    expect(result.success).toBe(false)
  })

  test('should return an issue on the nombre path when nombre is whitespace-only', () => {
    // GIVEN a payload with a whitespace-only nombre (Zod .trim() must catch this)
    const payload = { ...validPayload, nombre: '   ' }

    // WHEN parsing it against the schema
    const result = clienteSchema.safeParse(payload)

    // THEN the failure includes an issue for the nombre field
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('nombre'))).toBe(true)
    }
  })

  test('should return success: false when nit is an empty string', () => {
    // GIVEN a payload with an empty nit
    const payload = { ...validPayload, nit: '' }

    // WHEN parsing it against the schema
    const result = clienteSchema.safeParse(payload)

    // THEN parsing fails
    expect(result.success).toBe(false)
  })

  test('should return success: false when telefono is an empty string', () => {
    // GIVEN a payload with an empty telefono
    const payload = { ...validPayload, telefono: '' }

    // WHEN parsing it against the schema
    const result = clienteSchema.safeParse(payload)

    // THEN parsing fails
    expect(result.success).toBe(false)
  })

  test('should return success: false when ciudad is an empty string', () => {
    // GIVEN a payload with an empty ciudad
    const payload = { ...validPayload, ciudad: '' }

    // WHEN parsing it against the schema
    const result = clienteSchema.safeParse(payload)

    // THEN parsing fails
    expect(result.success).toBe(false)
  })

  test('should report an issue for every field when all are empty', () => {
    // GIVEN a payload where every required field is empty
    const payload = { nombre: '', nit: '', telefono: '', ciudad: '' }

    // WHEN parsing it against the schema
    const result = clienteSchema.safeParse(payload)

    // THEN each field has at least one issue
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0])
      expect(paths).toEqual(expect.arrayContaining(['nombre', 'nit', 'telefono', 'ciudad']))
    }
  })

  test('should produce Spanish error messages', () => {
    // GIVEN a payload with an empty nombre
    const payload = { ...validPayload, nombre: '' }

    // WHEN parsing it against the schema
    const result = clienteSchema.safeParse(payload)

    // THEN the issue message is in Spanish (company standard: user-facing text in Spanish)
    expect(result.success).toBe(false)
    if (!result.success) {
      const nombreIssue = result.error.issues.find((issue) => issue.path.includes('nombre'))
      expect(nombreIssue?.message).toMatch(/obligatorio|requerido/i)
    }
  })
})
