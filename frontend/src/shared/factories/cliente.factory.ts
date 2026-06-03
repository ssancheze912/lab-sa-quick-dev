/**
 * Data Factory — Cliente
 *
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Generates random, deterministic test data for Cliente entities.
 * Uses faker for all dynamic values — never hardcoded strings.
 * Supports overrides for scenario-specific test data.
 */

// NOTE: faker will need to be installed: pnpm --filter frontend add -D @faker-js/faker
// If not yet installed, the factory will fail at import time (expected RED behaviour).
import { faker } from '@faker-js/faker'

export interface ClienteTestData {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

/**
 * Creates a single Cliente test object with faker-generated values.
 * Pass overrides to pin specific fields for scenario-driven tests.
 */
export function createCliente(overrides: Partial<ClienteTestData> = {}): ClienteTestData {
  const createdAt = faker.date.recent({ days: 30 }).toISOString()
  return {
    id: faker.string.uuid(),
    nombre: faker.company.name(),
    nit: `${faker.number.int({ min: 800000000, max: 999999999 })}-${faker.number.int({ min: 0, max: 9 })}`,
    telefono: `${faker.number.int({ min: 300, max: 320 })}${faker.number.int({ min: 1000000, max: 9999999 })}`,
    ciudad: faker.helpers.arrayElement(['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Pereira']),
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

/**
 * Creates an array of Cliente test objects.
 * Useful for populating list views and testing pagination/sort.
 */
export function createClientes(count: number, overrides: Partial<ClienteTestData> = {}): ClienteTestData[] {
  return Array.from({ length: count }, () => createCliente(overrides))
}

/**
 * Creates three Clientes with distinct createdAt dates for sort testing.
 * Returns [oldest, middle, newest] — callers decide assertion order.
 */
export function createClientesForSortTest(): [ClienteTestData, ClienteTestData, ClienteTestData] {
  const oldest = createCliente({ createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' })
  const middle = createCliente({ createdAt: '2026-02-15T00:00:00.000Z', updatedAt: '2026-02-15T00:00:00.000Z' })
  const newest = createCliente({ createdAt: '2026-03-30T00:00:00.000Z', updatedAt: '2026-03-30T00:00:00.000Z' })
  return [oldest, middle, newest]
}
