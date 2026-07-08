/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Data factory for `Cliente` — used by Vitest tests. Deterministic-ish random
 * values (Math.random-based) so tests avoid collisions across a suite without
 * pulling in an extra `faker` dependency.
 *
 * Import via:
 *
 *   import { buildCliente, buildClientes } from '@/test/factories/cliente.factory'
 */
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

let counter = Date.now()

function nextId(): number {
  counter += 1
  return counter
}

export function buildCliente(overrides: Partial<Cliente> = {}): Cliente {
  const id = nextId()
  const now = new Date().toISOString()
  return {
    id: `00000000-0000-0000-0000-${String(id).padStart(12, '0')}`,
    nombre: `Empresa ${id}`,
    nit: `${9_000_000_00 + (id % 1_000_000_00)}`,
    telefono: `300${String(id).padStart(7, '0').slice(-7)}`,
    ciudad: 'Bogotá',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function buildClientes(count: number, overridesFn?: (i: number) => Partial<Cliente>): Cliente[] {
  return Array.from({ length: count }, (_, i) => buildCliente(overridesFn?.(i)))
}
