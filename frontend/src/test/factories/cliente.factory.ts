import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

/**
 * Data factory for `Cliente` test fixtures (component tests, Story 2.1+).
 *
 * Deviates from the `data-factories.md` knowledge fragment's default recommendation of
 * `@faker-js/faker`: the package is NOT an installed dependency of `frontend/package.json`
 * (verified during this ATDD pass), and adding a new dependency is out of scope for a test
 * authoring workflow. Instead this factory mirrors the existing project convention already
 * used by `e2e/helpers/data.helper.ts` (`buildCliente`): a monotonically increasing counter
 * seeded from `Date.now()` guarantees unique, collision-free values (Nombre/NIT) across
 * factory calls within a single test run — the property that matters for parallel-safe test
 * data, per the factory principle, even without faker's randomness.
 */
let counter = Date.now()

function uniqueSuffix(): string {
  counter += 1
  return `${counter}`
}

export function createCliente(overrides: Partial<Cliente> = {}): Cliente {
  const suffix = uniqueSuffix()
  return {
    id: `cliente-${suffix}`,
    nombre: `Cliente Test ${suffix}`,
    nit: `9${suffix.slice(-8).padStart(8, '0')}`,
    telefono: `300${suffix.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

export function createClientes(count: number, overrides: Partial<Cliente> = {}): Cliente[] {
  return Array.from({ length: count }, () => createCliente(overrides))
}
