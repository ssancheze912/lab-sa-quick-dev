import { faker } from '@faker-js/faker'
import type { Contacto } from '@/modules/crm/contactos/domain/entities/Contacto'

/**
 * Data factory for the `Contacto` domain entity (Story 3.1 — Contact List &
 * Search). Mirrors `cliente.factory.ts`'s structure exactly.
 *
 * Per data-factories.md: factories return complete valid objects with
 * faker-based defaults, support overrides for scenario-specific fields, and
 * provide a bulk helper (`createContactos`) for volume/performance tests
 * (TC-E3-P1-02, NFR1/NFR10 — 1,000-record ceiling, double Epic 2's benchmark).
 */
export function createContacto(overrides: Partial<Contacto> = {}): Contacto {
  return {
    id: faker.string.uuid(),
    nombre: faker.person.fullName(),
    cargo: faker.person.jobTitle(),
    telefono: faker.string.numeric(10),
    email: faker.internet.email(),
    clienteId: null,
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
    ...overrides,
  }
}

export function createContactos(count: number, overrides: Partial<Contacto> = {}): Contacto[] {
  return Array.from({ length: count }, () => createContacto(overrides))
}
