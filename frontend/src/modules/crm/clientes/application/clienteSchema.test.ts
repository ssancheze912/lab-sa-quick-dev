import { describe, it, expect } from 'vitest'
import { clienteFormSchema } from './clienteSchema'

describe('clienteFormSchema', () => {
  it('accepts valid trimmed values and returns them trimmed', () => {
    const result = clienteFormSchema.safeParse({
      nombre: '  Acme  ',
      nit: '  900-1  ',
      telefono: '  +57 300  ',
      ciudad: '  Cali  ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        nombre: 'Acme',
        nit: '900-1',
        telefono: '+57 300',
        ciudad: 'Cali',
      })
    }
  })

  it.each([
    ['nombre', 'El nombre es requerido'],
    ['nit', 'El NIT/RUC es requerido'],
    ['telefono', 'El teléfono es requerido'],
    ['ciudad', 'La ciudad es requerida'],
  ] as const)('flags empty %s with %s', (field, message) => {
    const base = { nombre: 'A', nit: 'B', telefono: 'C', ciudad: 'D' }
    const result = clienteFormSchema.safeParse({ ...base, [field]: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldError = result.error.issues.find((i) => i.path[0] === field)
      expect(fieldError?.message).toBe(message)
    }
  })

  it.each([
    ['nombre', '   ', 'El nombre es requerido'],
    ['nit', '\t', 'El NIT/RUC es requerido'],
    ['telefono', ' ', 'El teléfono es requerido'],
    ['ciudad', '  ', 'La ciudad es requerida'],
  ] as const)('flags whitespace-only %s with %s', (field, ws, message) => {
    const base = { nombre: 'A', nit: 'B', telefono: 'C', ciudad: 'D' }
    const result = clienteFormSchema.safeParse({ ...base, [field]: ws })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldError = result.error.issues.find((i) => i.path[0] === field)
      expect(fieldError?.message).toBe(message)
    }
  })

  it('flags nombre longer than 200 chars', () => {
    const result = clienteFormSchema.safeParse({
      nombre: 'A'.repeat(201),
      nit: 'B',
      telefono: 'C',
      ciudad: 'D',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === 'nombre')
      expect(err?.message).toBe('El nombre no puede exceder 200 caracteres')
    }
  })

  it('flags nit longer than 50 chars', () => {
    const result = clienteFormSchema.safeParse({
      nombre: 'A',
      nit: 'B'.repeat(51),
      telefono: 'C',
      ciudad: 'D',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path[0] === 'nit')
      expect(err?.message).toBe('El NIT/RUC no puede exceder 50 caracteres')
    }
  })

  it('flags telefono longer than 50 chars', () => {
    const result = clienteFormSchema.safeParse({
      nombre: 'A',
      nit: 'B',
      telefono: 'C'.repeat(51),
      ciudad: 'D',
    })
    expect(result.success).toBe(false)
  })

  it('flags ciudad longer than 100 chars', () => {
    const result = clienteFormSchema.safeParse({
      nombre: 'A',
      nit: 'B',
      telefono: 'C',
      ciudad: 'D'.repeat(101),
    })
    expect(result.success).toBe(false)
  })
})
