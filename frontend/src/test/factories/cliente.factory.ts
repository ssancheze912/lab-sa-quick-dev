import { faker } from '@faker-js/faker'
import type { Cliente } from '@/modules/crm/clientes/domain/entities/Cliente'

/**
 * Data factory for the `Cliente` domain entity (Story 2.1 — Client List & Search).
 *
 * Per data-factories.md: factories return complete valid objects with faker-based
 * defaults, support overrides for scenario-specific fields, and provide a bulk
 * helper (`createClientes`) for volume/performance tests (TC-E2-P1-02, NFR1).
 */
export function createCliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: faker.string.uuid(),
    nombre: faker.company.name(),
    nit: faker.string.numeric(10),
    telefono: faker.string.numeric(10),
    ciudad: faker.location.city(),
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  }
}

export function createClientes(count: number, overrides: Partial<Cliente> = {}): Cliente[] {
  return Array.from({ length: count }, () => createCliente(overrides))
}
