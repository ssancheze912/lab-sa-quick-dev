/**
 * Story 2.1: Client List & Search
 * E2E Data Factory — Cliente
 *
 * Generates deterministic but unique test data for E2E tests.
 * Does NOT use @faker-js/faker (not installed in e2e layer).
 * Uses an incrementing counter to guarantee uniqueness.
 *
 * Usage:
 *   import { createCliente, createClientes } from '../support/factories/cliente.factory'
 *   const cliente = createCliente()
 *   const clientes = createClientes(10)
 *   const specific = createCliente({ nombre: 'Empresa Especial' })
 */

interface ClienteResponse {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

let _seq = Date.now()

function nextSeq(): number {
  return ++_seq
}

/**
 * Build a single ClienteResponse matching the GET /api/v1/clientes shape.
 */
export function createCliente(
  overrides?: Partial<ClienteResponse>
): ClienteResponse {
  const seq = nextSeq()
  const seqStr = String(seq).slice(-8).padStart(8, '0')

  return {
    id: `00000000-0000-7000-0000-${seqStr.padStart(12, '0')}`,
    nombre: `Empresa Test ${seq}`,
    nit: `9${seqStr}`,
    telefono: `300${seqStr.slice(0, 7)}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Build an array of ClienteResponse objects.
 */
export function createClientes(
  count: number,
  overrides?: Partial<ClienteResponse>
): ClienteResponse[] {
  return Array.from({ length: count }, () => createCliente(overrides))
}
