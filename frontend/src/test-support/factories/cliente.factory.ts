// ─────────────────────────────────────────────────────────────────────────────
// Data Factory — Cliente
// Story 2.1: Client List & Search — ATDD RED Phase
//
// Produces synthetic ClienteDto-shaped objects for component and unit tests.
// All fields use Math.random() / Date arithmetic (no external faker dependency
// required — faker is not yet installed in the project).
// ─────────────────────────────────────────────────────────────────────────────

export interface ClienteDto {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

let _seq = 0

function seq(): number {
  return ++_seq
}

function randomUUID(): string {
  // Use crypto.randomUUID when available, otherwise simulate
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const NOMBRES = [
  'Construcciones del Valle',
  'Inversiones Andinas',
  'Servicios Técnicos S.A.',
  'Distribuidora La Esperanza',
  'Comercializadora Norte',
  'Grupo Empresarial Bogotá',
  'Logística Pacífico',
  'Soluciones Digitales Ltda.',
]

const CIUDADES = ['Cali', 'Bogotá', 'Medellín', 'Barranquilla', 'Bucaramanga']

/**
 * Creates a single ClienteDto with optional field overrides.
 * Each call produces a unique record (incrementing sequence).
 */
export function createCliente(overrides: Partial<ClienteDto> = {}): ClienteDto {
  const n = seq()
  const now = new Date().toISOString()
  return {
    id: randomUUID(),
    nombre: NOMBRES[n % NOMBRES.length] + ` #${n}`,
    nit: `9${String(n).padStart(8, '0')}-${n % 9}`,
    telefono: `+57 ${300 + (n % 100)} ${100 + (n % 900)} ${1000 + (n % 9000)}`,
    ciudad: CIUDADES[n % CIUDADES.length],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/**
 * Creates an array of `count` ClienteDtos.
 */
export function createClientes(count: number, overrides: Partial<ClienteDto> = {}): ClienteDto[] {
  return Array.from({ length: count }, () => createCliente(overrides))
}
