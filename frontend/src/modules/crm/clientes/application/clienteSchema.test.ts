import { describe, it, expect } from 'vitest'
import { clienteSchema } from './clienteSchema'

describe('clienteSchema', () => {
  const validData = {
    nombre: 'Empresa Alpha',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
  }

  it('validates a valid payload successfully', () => {
    // Arrange & Act
    const result = clienteSchema.safeParse(validData)

    // Assert
    expect(result.success).toBe(true)
  })

  it('fails when nombre is empty', () => {
    // Arrange
    const data = { ...validData, nombre: '' }

    // Act
    const result = clienteSchema.safeParse(data)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      const nombreError = result.error.issues.find((i) => i.path[0] === 'nombre')
      expect(nombreError?.message).toBe('El nombre es requerido')
    }
  })

  it('fails when nit is empty', () => {
    // Arrange
    const data = { ...validData, nit: '' }

    // Act
    const result = clienteSchema.safeParse(data)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      const nitError = result.error.issues.find((i) => i.path[0] === 'nit')
      expect(nitError?.message).toBe('El NIT/RUC es requerido')
    }
  })

  it('fails when telefono is empty', () => {
    // Arrange
    const data = { ...validData, telefono: '' }

    // Act
    const result = clienteSchema.safeParse(data)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      const telefonoError = result.error.issues.find((i) => i.path[0] === 'telefono')
      expect(telefonoError?.message).toBe('El teléfono es requerido')
    }
  })

  it('fails when ciudad is empty', () => {
    // Arrange
    const data = { ...validData, ciudad: '' }

    // Act
    const result = clienteSchema.safeParse(data)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      const ciudadError = result.error.issues.find((i) => i.path[0] === 'ciudad')
      expect(ciudadError?.message).toBe('La ciudad es requerida')
    }
  })

  it('fails when nombre exceeds 200 characters', () => {
    // Arrange
    const data = { ...validData, nombre: 'A'.repeat(201) }

    // Act
    const result = clienteSchema.safeParse(data)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      const nombreError = result.error.issues.find((i) => i.path[0] === 'nombre')
      expect(nombreError?.message).toBe('Máximo 200 caracteres')
    }
  })

  it('fails when nit exceeds 50 characters', () => {
    // Arrange
    const data = { ...validData, nit: 'A'.repeat(51) }

    // Act
    const result = clienteSchema.safeParse(data)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      const nitError = result.error.issues.find((i) => i.path[0] === 'nit')
      expect(nitError?.message).toBe('Máximo 50 caracteres')
    }
  })

  it('fails when telefono exceeds 30 characters', () => {
    // Arrange
    const data = { ...validData, telefono: '1'.repeat(31) }

    // Act
    const result = clienteSchema.safeParse(data)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      const telefonoError = result.error.issues.find((i) => i.path[0] === 'telefono')
      expect(telefonoError?.message).toBe('Máximo 30 caracteres')
    }
  })

  it('fails when ciudad exceeds 100 characters', () => {
    // Arrange
    const data = { ...validData, ciudad: 'A'.repeat(101) }

    // Act
    const result = clienteSchema.safeParse(data)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      const ciudadError = result.error.issues.find((i) => i.path[0] === 'ciudad')
      expect(ciudadError?.message).toBe('Máximo 100 caracteres')
    }
  })

  it('accepts nombre at max length (200 characters)', () => {
    // Arrange
    const data = { ...validData, nombre: 'A'.repeat(200) }

    // Act
    const result = clienteSchema.safeParse(data)

    // Assert
    expect(result.success).toBe(true)
  })
})
