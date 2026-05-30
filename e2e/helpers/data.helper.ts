import { v4 as uuidv4 } from 'uuid'

export interface ClienteFactory {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}

export interface ContactoFactory {
  id: string
  nombre: string
  cargo: string
  telefono: string
  email: string
  clienteId: string | null
}

export function buildCliente(overrides: Partial<ClienteFactory> = {}): ClienteFactory {
  return {
    id: uuidv4(),
    nombre: 'Cliente Test',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    ...overrides,
  }
}

export function buildContacto(overrides: Partial<ContactoFactory> = {}): ContactoFactory {
  return {
    id: uuidv4(),
    nombre: 'Contacto Test',
    cargo: 'Gerente',
    telefono: '3009876543',
    email: 'contacto@test.com',
    clienteId: null,
    ...overrides,
  }
}
