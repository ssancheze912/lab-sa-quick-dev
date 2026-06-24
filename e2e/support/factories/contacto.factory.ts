/**
 * Data factory for Contacto test entities.
 * Story 3.1 — Contact List & Search (ATDD RED phase)
 *
 * Uses a monotonic counter to produce unique, deterministic values per test run.
 * Mirrors the pattern from cliente.factory.ts for consistency.
 */

let seq = Date.now() + Math.floor(Math.random() * 1_000_000) * 10_000;

function next(): string {
  return String(++seq);
}

export interface ContactoPayload {
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
}

export interface ContactoDto extends ContactoPayload {
  id: string;
  clienteId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Build a single valid Contacto payload (no id — used for POST bodies).
 */
export function createContactoPayload(overrides: Partial<ContactoPayload> = {}): ContactoPayload {
  const id = next();
  return {
    nombre: `Contacto Test ${id}`,
    cargo: 'Gerente Comercial',
    telefono: `310${id.slice(-7).padStart(7, '0')}`,
    email: `contacto${id}@test.com`,
    ...overrides,
  };
}

/**
 * Build a full ContactoDto (with id + timestamps) for use as mock API response data.
 */
export function createContactoDto(overrides: Partial<ContactoDto> = {}): ContactoDto {
  const payload = createContactoPayload(overrides);
  const id = next();
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? `00000000-0000-0000-0003-${id.padStart(12, '0')}`,
    clienteId: null,
    createdAt: now,
    updatedAt: now,
    ...payload,
    ...overrides,
  };
}

/**
 * Build an array of ContactoDto objects for list scenarios.
 */
export function createContactoDtos(count: number, overrides: Partial<ContactoDto> = {}): ContactoDto[] {
  return Array.from({ length: count }, () => createContactoDto(overrides));
}
