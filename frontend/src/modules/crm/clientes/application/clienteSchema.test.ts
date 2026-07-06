/**
 * Story 2.3 (Epic 2: Client Management) — Code Review fix.
 *
 * testarch-automate's backend integration suite documented a real gap: neither
 * `CreateClienteRequestValidator` (FluentValidation) nor this Zod schema enforced a max
 * length matching `ClienteConfiguration`'s DB column limits (200/50/30/100), so an
 * over-length value only failed once it hit the database constraint. This file locks in
 * the client-side half of that fix with a small, dedicated unit test (kept out of
 * `ClienteForm.test.tsx`, already flagged by test review as over the 300-line guideline).
 */

import { describe, test, expect } from 'vitest'
import { clienteSchema } from './clienteSchema'

function validPayload(overrides: Partial<Record<'nombre' | 'nit' | 'telefono' | 'ciudad', string>> = {}) {
  return {
    nombre: 'Acme Corp',
    nit: '900123456',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    ...overrides,
  }
}

describe('clienteSchema — max length boundaries', () => {
  test('[P1] accepts each field exactly at its DB column limit', () => {
    const result = clienteSchema.safeParse(
      validPayload({
        nombre: 'A'.repeat(200),
        nit: '9'.repeat(50),
        telefono: '3'.repeat(30),
        ciudad: 'B'.repeat(100),
      }),
    )

    expect(result.success).toBe(true)
  })

  test('[P1] rejects nombre one character past its 200-character limit', () => {
    const result = clienteSchema.safeParse(validPayload({ nombre: 'A'.repeat(201) }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'nombre')).toBe(true)
    }
  })

  test('[P1] rejects nit one character past its 50-character limit', () => {
    const result = clienteSchema.safeParse(validPayload({ nit: '9'.repeat(51) }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'nit')).toBe(true)
    }
  })

  test('[P1] rejects telefono one character past its 30-character limit', () => {
    const result = clienteSchema.safeParse(validPayload({ telefono: '3'.repeat(31) }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'telefono')).toBe(true)
    }
  })

  test('[P1] rejects ciudad one character past its 100-character limit', () => {
    const result = clienteSchema.safeParse(validPayload({ ciudad: 'B'.repeat(101) }))

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'ciudad')).toBe(true)
    }
  })
})
