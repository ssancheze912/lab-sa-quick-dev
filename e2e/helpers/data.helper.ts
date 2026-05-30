let counter = Date.now()

function uniqueId(): string {
  return `${++counter}`
}

export interface ClienteFactory {
  nombre: string
  nit: string
  telefono: string
  ciudad: string
}

export interface ContactoFactory {
  nombre: string
  cargo: string
  telefono: string
  email: string
  clienteId: string | null
}

export function buildCliente(overrides: Partial<ClienteFactory> = {}): ClienteFactory {
  const id = uniqueId()
  return {
    nombre: `Cliente Test ${id}`,
    nit: `9${id.slice(-8).padStart(8, '0')}`,
    telefono: `300${id.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    ...overrides,
  }
}

export function buildContacto(overrides: Partial<ContactoFactory> = {}): ContactoFactory {
  const id = uniqueId()
  return {
    nombre: `Contacto Test ${id}`,
    email: `contacto.test.${id}@ejemplo.co`,
    cargo: 'Analista',
    telefono: `310${id.slice(-7).padStart(7, '0')}`,
    clienteId: null,
    ...overrides,
  }
}
