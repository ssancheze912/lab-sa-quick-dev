/**
 * Data Factory — Cliente
 * Used by ATDD tests for Story 2.1 (Client List & Search) and beyond.
 *
 * Pattern: faker-based random data with optional overrides so each test
 * receives isolated, non-colliding data.
 *
 * Usage:
 *   const c = createCliente()                    // all random
 *   const c = createCliente({ nombre: 'Acme' })  // override specific fields
 *   const cs = createClientes(10)                 // bulk generation
 */

// NOTE: @faker-js/faker is not installed; we use a lightweight inline
// random generator that is deterministic enough for test isolation.
// If @faker-js/faker is installed later, replace the helpers below.

let _seq = 0

function nextSeq(): number {
  return ++_seq
}

function randomId(): string {
  return `test-${Math.random().toString(36).slice(2, 10)}-${nextSeq()}`
}

function randomNombre(): string {
  const prefixes = ['Empresa', 'Compañía', 'Corporación', 'Grupo', 'Industrias']
  const suffixes = ['Alfa', 'Beta', 'Gamma', 'Delta', 'Sigma', 'Omega', 'Zeta']
  const p = prefixes[nextSeq() % prefixes.length]
  const s = suffixes[nextSeq() % suffixes.length]
  return `${p} ${s} ${nextSeq()}`
}

function randomNit(): string {
  return String(Math.floor(100_000_000 + Math.random() * 900_000_000))
}

function randomPhone(): string {
  return `3${String(Math.floor(100_000_000 + Math.random() * 900_000_000))}`
}

function randomCiudad(): string {
  const ciudades = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena']
  return ciudades[nextSeq() % ciudades.length]
}

function randomDate(offsetMs = 0): string {
  return new Date(Date.now() - offsetMs).toISOString()
}

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

export interface ClienteTestData {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

export function createCliente(overrides: Partial<ClienteTestData> = {}): ClienteTestData {
  const now = randomDate()
  return {
    id: randomId(),
    nombre: randomNombre(),
    nit: randomNit(),
    telefono: randomPhone(),
    ciudad: randomCiudad(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function createClientes(count: number, overrides: Partial<ClienteTestData> = {}): ClienteTestData[] {
  return Array.from({ length: count }, (_, i) =>
    createCliente({ createdAt: randomDate(i * 1000), ...overrides }),
  )
}
