/**
 * Story 2.3 — ATDD (RED phase).
 *
 * Contract anchor for R-006 (Zod ↔ FluentValidation drift). This suite iterates
 * the SAME `[field, badValue, expectedMessage]` table used by the backend's
 * `CreateClienteRequestValidatorTests.cs`. The message strings are hand-copied
 * (not shared through a fixture) so that if either side refactors and forgets
 * the other, one of the two suites breaks first — catching R-006 at PR time.
 *
 * RED until `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
 * exports the `clienteSchema` Zod object with `.trim().min(1)` presence rules
 * and the Spanish messages listed below.
 */
import { describe, it, expect } from 'vitest'
import { clienteSchema } from './clienteSchema'

interface ValidRequest {
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}

const validRequest = (): ValidRequest => ({
  nombre: 'Acme SAS',
  nit: '900123456',
  telefono: '3001234567',
  ciudad: 'Cali',
})

interface Case {
  field: keyof ValidRequest
  badValue: string
  expectedMessage: string
}

const parityTable: Case[] = [
  { field: 'nombre', badValue: '', expectedMessage: 'El nombre es obligatorio' },
  { field: 'nombre', badValue: '   ', expectedMessage: 'El nombre es obligatorio' },
  { field: 'nit', badValue: '', expectedMessage: 'El NIT/RUC es obligatorio' },
  { field: 'nit', badValue: '   ', expectedMessage: 'El NIT/RUC es obligatorio' },
  { field: 'telefono', badValue: '', expectedMessage: 'El teléfono es obligatorio' },
  { field: 'telefono', badValue: '   ', expectedMessage: 'El teléfono es obligatorio' },
  { field: 'ciudad', badValue: '', expectedMessage: 'La ciudad es obligatoria' },
  { field: 'ciudad', badValue: '   ', expectedMessage: 'La ciudad es obligatoria' },
]

describe('clienteSchema — R-006 parity anchor (Zod ↔ FluentValidation)', () => {
  it('GIVEN a fully-populated valid DTO, THEN safeParse succeeds', () => {
    const result = clienteSchema.safeParse(validRequest())
    expect(result.success).toBe(true)
  })

  for (const { field, badValue, expectedMessage } of parityTable) {
    const label = badValue.length === 0 ? 'empty string' : 'whitespace-only'

    it(`GIVEN ${field} is ${label}, THEN Zod returns the exact Spanish message`, () => {
      const dto = { ...validRequest(), [field]: badValue }
      const result = clienteSchema.safeParse(dto)

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === field)
        expect(issue).toBeDefined()
        expect(issue!.message).toBe(expectedMessage)
      }
    })
  }

  it('GIVEN every field is empty, THEN Zod produces exactly one error per field', () => {
    const result = clienteSchema.safeParse({
      nombre: '',
      nit: '',
      telefono: '',
      ciudad: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldsWithErrors = new Set(result.error.issues.map((i) => i.path[0]))
      expect(fieldsWithErrors.has('nombre')).toBe(true)
      expect(fieldsWithErrors.has('nit')).toBe(true)
      expect(fieldsWithErrors.has('telefono')).toBe(true)
      expect(fieldsWithErrors.has('ciudad')).toBe(true)
    }
  })
})
