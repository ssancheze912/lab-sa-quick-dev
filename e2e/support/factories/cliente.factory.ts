/**
 * Data factory for Cliente test entities.
 * Story 2.1 — Client List & Search (ATDD RED phase)
 *
 * Uses a monotonic counter instead of @faker-js/faker to keep the dependency
 * light while still producing unique, deterministic values per test run.
 */

let seq = Date.now();

function next(): string {
  return String(++seq);
}

export interface ClientePayload {
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
}

export interface ClienteDto extends ClientePayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Build a single valid Cliente payload (no id — used for POST bodies).
 * All overrides are shallow-merged.
 */
export function createClientePayload(overrides: Partial<ClientePayload> = {}): ClientePayload {
  const id = next();
  return {
    nombre: `Empresa Test ${id}`,
    nit: `9${id.slice(-8).padStart(8, '0')}`,
    telefono: `300${id.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    ...overrides,
  };
}

/**
 * Build a full ClienteDto (with id + timestamps) for use as mock API response data.
 */
export function createClienteDto(overrides: Partial<ClienteDto> = {}): ClienteDto {
  const payload = createClientePayload(overrides);
  const id = next();
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? `00000000-0000-0000-0000-${id.padStart(12, '0')}`,
    createdAt: now,
    updatedAt: now,
    ...payload,
    ...overrides,
  };
}

/**
 * Build an array of ClienteDto objects for list scenarios.
 */
export function createClienteDtos(count: number, overrides: Partial<ClienteDto> = {}): ClienteDto[] {
  return Array.from({ length: count }, () => createClienteDto(overrides));
}
