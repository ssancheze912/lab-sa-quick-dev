/**
 * Story 2.1: Client List & Search
 * Data Factory — Cliente
 *
 * Generates random, valid Cliente objects for use in tests.
 * Uses faker-compatible random values without the faker library
 * (project does not have @faker-js/faker installed).
 * Override any field by passing a partial object.
 */

export interface Cliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

let _counter = 1

function randomId(): string {
  const n = _counter++
  return `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`
}

function randomNombre(seed: number): string {
  const names = [
    'Empresa ABC',
    'Garcia & Asociados',
    'Tecnología del Futuro',
    'Comercializadora XYZ',
    'Distribuidora Norte',
    'Servicios Integrados',
    'Consultores del Valle',
    'Inversiones del Pacífico',
  ]
  return names[seed % names.length]
}

function randomNit(seed: number): string {
  return `9${String(seed).padStart(8, '0')}-${seed % 9}`
}

function randomCiudad(seed: number): string {
  const ciudades = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena']
  return ciudades[seed % ciudades.length]
}

/**
 * Creates a single Cliente with optional field overrides.
 */
export function createCliente(overrides: Partial<Cliente> = {}): Cliente {
  const seed = _counter
  const id = randomId()
  const ts = new Date(2026, 0, seed % 28 + 1).toISOString()
  return {
    id,
    nombre: randomNombre(seed),
    nit: randomNit(seed),
    telefono: `60${seed % 9} 234 5678`,
    ciudad: randomCiudad(seed),
    createdAt: ts,
    updatedAt: ts,
    ...overrides,
  }
}

/**
 * Creates an array of Clientes with optional per-item overrides.
 */
export function createClientes(count: number, overrides: Partial<Cliente> = {}): Cliente[] {
  return Array.from({ length: count }, () => createCliente(overrides))
}

/**
 * Resets the internal counter (call in beforeEach if determinism matters).
 */
export function resetClienteFactory(): void {
  _counter = 1
}
