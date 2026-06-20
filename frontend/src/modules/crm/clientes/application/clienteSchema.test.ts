// ─────────────────────────────────────────────────────────────────────────────
// Story 2.3: Create Client — clienteSchema Unit Tests
// Test Level: Unit (Vitest)
//
// Acceptance Criteria covered:
//   AC3 — Zod schema validates required fields and produces correct error messages
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { clienteSchema } from './clienteSchema'

describe('clienteSchema', () => {
  describe('valid data passes validation', () => {
    it('accepts a fully populated object', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Empresa Test',
        nit: '900111222-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('nombre field', () => {
    it('fails when nombre is empty string', () => {
      const result = clienteSchema.safeParse({
        nombre: '',
        nit: '900111222-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const nombreError = result.error.issues.find((i) => i.path[0] === 'nombre')
        expect(nombreError).toBeDefined()
        expect(nombreError?.message).toBe('Este campo es requerido')
      }
    })
  })

  describe('nit field', () => {
    it('fails when nit is empty string', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Empresa Test',
        nit: '',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const nitError = result.error.issues.find((i) => i.path[0] === 'nit')
        expect(nitError).toBeDefined()
        expect(nitError?.message).toBe('El NIT no puede estar vacío')
      }
    })
  })

  describe('telefono field', () => {
    it('fails when telefono is empty string', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Empresa Test',
        nit: '900111222-1',
        telefono: '',
        ciudad: 'Bogotá',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const telefonoError = result.error.issues.find((i) => i.path[0] === 'telefono')
        expect(telefonoError).toBeDefined()
        expect(telefonoError?.message).toBe('Este campo es requerido')
      }
    })
  })

  describe('ciudad field', () => {
    it('fails when ciudad is empty string', () => {
      const result = clienteSchema.safeParse({
        nombre: 'Empresa Test',
        nit: '900111222-1',
        telefono: '3001234567',
        ciudad: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const ciudadError = result.error.issues.find((i) => i.path[0] === 'ciudad')
        expect(ciudadError).toBeDefined()
        expect(ciudadError?.message).toBe('Este campo es requerido')
      }
    })
  })

  describe('all fields empty', () => {
    it('produces errors for all 4 fields', () => {
      const result = clienteSchema.safeParse({
        nombre: '',
        nit: '',
        telefono: '',
        ciudad: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBe(4)
      }
    })
  })
})
