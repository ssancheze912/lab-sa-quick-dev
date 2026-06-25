/**
 * Contacto Data Factory — Story 3.2: Contact Detail View
 *
 * Generates deterministic-by-default, override-friendly test data for
 * the `Contacto` domain entity used in E2E, API, and component tests.
 *
 * Principles:
 * - Use counter-based IDs to avoid collisions without external deps
 * - Support partial overrides for specific scenarios
 * - Provide bulk creation helper
 * - nullable clienteId follows domain contract
 */

let counter = Date.now();

function nextId(): string {
  return String(++counter);
}

export interface ContactoPayload {
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  clienteId: string | null;
}

export interface ContactoResponse extends ContactoPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Build a valid Contacto payload for POST /api/v1/contactos requests.
 * All fields are unique per call (counter-based).
 */
export function buildContactoPayload(
  overrides: Partial<ContactoPayload> = {},
): ContactoPayload {
  const id = nextId();
  return {
    nombre: `Contacto Test ${id}`,
    cargo: `Cargo ${id}`,
    telefono: `300${id.slice(-7).padStart(7, '0')}`,
    email: `contacto${id}@empresa.com`,
    clienteId: null,
    ...overrides,
  };
}

/**
 * Build a simulated API response for a Contacto.
 * Useful for MSW handlers and Playwright route intercepts.
 */
export function buildContactoResponse(
  overrides: Partial<ContactoResponse> = {},
): ContactoResponse {
  const payload = buildContactoPayload();
  const ts = new Date().toISOString();
  return {
    id: `550e8400-e29b-41d4-a716-${nextId().slice(-12).padStart(12, '0')}`,
    createdAt: ts,
    updatedAt: ts,
    ...payload,
    ...overrides,
  };
}

/**
 * Build an array of ContactoResponse stubs.
 */
export function buildContactoResponses(
  count: number,
  overrides: Partial<ContactoResponse> = {},
): ContactoResponse[] {
  return Array.from({ length: count }, () => buildContactoResponse(overrides));
}
