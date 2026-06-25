/**
 * Cliente Data Factory — Story 2.1: Client List & Search
 *
 * Generates deterministic-by-default, override-friendly test data for
 * the `Cliente` domain entity used in E2E, API, and component tests.
 *
 * Principles:
 * - Use counter-based IDs to avoid collisions without external deps
 * - Support partial overrides for specific scenarios
 * - Provide bulk creation helper
 */

let counter = Date.now();

function nextId(): string {
  return String(++counter);
}

export interface ClientePayload {
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
}

export interface ClienteResponse extends ClientePayload {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Build a valid Cliente payload for POST /api/v1/clientes requests.
 * All fields are unique per call (counter-based).
 */
export function buildClientePayload(
  overrides: Partial<ClientePayload> = {},
): ClientePayload {
  const id = nextId();
  return {
    nombre: `Cliente Test ${id}`,
    nit: `9${id.slice(-8).padStart(8, '0')}`,
    telefono: `300${id.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    ...overrides,
  };
}

/**
 * Build a simulated API response for a Cliente.
 * Useful for MSW handlers and Playwright route intercepts.
 */
export function buildClienteResponse(
  overrides: Partial<ClienteResponse> = {},
): ClienteResponse {
  const payload = buildClientePayload();
  const ts = new Date().toISOString();
  return {
    id: `${nextId()}-0000-0000-0000-000000000000`.slice(0, 36),
    createdAt: ts,
    updatedAt: ts,
    ...payload,
    ...overrides,
  };
}

/**
 * Build an array of ClienteResponse stubs.
 */
export function buildClienteResponses(
  count: number,
  overrides: Partial<ClienteResponse> = {},
): ClienteResponse[] {
  return Array.from({ length: count }, () => buildClienteResponse(overrides));
}
