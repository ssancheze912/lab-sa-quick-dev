/**
 * Data factory for Cliente test objects.
 * Used in E2E tests and API integration tests for Story 2.1 (and all Epic 2 stories).
 *
 * Pattern: overrides-first with unique generated defaults.
 * No faker dependency required — uses counter-based uniqueness for E2E stability.
 */

let counter = Date.now();

function uniqueId(): string {
  return `${++counter}`;
}

/**
 * Shape of a Cliente as returned by GET /api/v1/clientes
 * Matches ClienteDto from AC6:
 *   { id, nombre, nit, telefono, ciudad, createdAt, updatedAt }
 */
export interface ClienteFixture {
  id: string;
  nombre: string;
  nit: string;
  telefono: string | null;
  ciudad: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input shape for POST /api/v1/clientes (create payload)
 */
export interface CreateClienteInput {
  nombre: string;
  nit: string;
  telefono?: string | null;
  ciudad?: string | null;
}

/**
 * Creates a single Cliente fixture object for use in MSW route handlers
 * and direct response mocking. This does NOT call the API.
 *
 * @param overrides - Partial overrides for specific fields
 * @returns Complete ClienteFixture object
 *
 * @example
 *   const cliente = buildClienteFixture({ nombre: 'Empresa Alpha' });
 *   await page.route('** /api/v1/clientes', route => route.fulfill({
 *     status: 200,
 *     body: JSON.stringify([cliente]),
 *   }));
 */
export function buildClienteFixture(overrides: Partial<ClienteFixture> = {}): ClienteFixture {
  const id = uniqueId();
  return {
    id: `00000000-0000-0000-0000-${id.padStart(12, '0')}`,
    nombre: `Cliente Test ${id}`,
    nit: `9${id.slice(-8).padStart(8, '0')}`,
    telefono: `300${id.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates an array of Cliente fixtures.
 *
 * @param count - Number of clients to generate
 * @param overrides - Partial overrides applied to each client
 * @returns Array of ClienteFixture objects
 *
 * @example
 *   const clientes = buildClienteFixtures(5);
 *   // Returns 5 unique clients with distinct ids, nombres, and NITs
 */
export function buildClienteFixtures(count: number, overrides: Partial<ClienteFixture> = {}): ClienteFixture[] {
  return Array.from({ length: count }, () => buildClienteFixture(overrides));
}

/**
 * Creates a valid POST /api/v1/clientes request payload.
 * Use this when creating clients via the API in test setup/teardown.
 *
 * @param overrides - Partial overrides for specific fields
 * @returns CreateClienteInput object
 *
 * @example
 *   const input = buildCreateClienteInput({ nombre: 'Empresa Específica' });
 *   const response = await apiHelper.createCliente(input);
 */
export function buildCreateClienteInput(overrides: Partial<CreateClienteInput> = {}): CreateClienteInput {
  const id = uniqueId();
  return {
    nombre: `Cliente Test ${id}`,
    nit: `9${id.slice(-8).padStart(8, '0')}`,
    telefono: `300${id.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    ...overrides,
  };
}

/**
 * Creates a bulk fixture set of 500 clients for NFR1 (performance) testing.
 * Each client has a unique nombre and NIT.
 *
 * @returns Array of 500 ClienteFixture objects
 *
 * @example
 *   const bulkClientes = buildBulkClienteFixtures();
 *   // Use with MSW or route interception for performance tests
 */
export function buildBulkClienteFixtures(): ClienteFixture[] {
  return Array.from({ length: 500 }, (_, i) => ({
    id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
    nombre: `Empresa Bulk ${String(i + 1).padStart(3, '0')} SAS`,
    nit: `${String(900000000 + i)}`,
    telefono: `300${String(i).padStart(7, '0')}`,
    ciudad: i % 2 === 0 ? 'Bogotá' : 'Medellín',
    createdAt: new Date(Date.now() - i * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 1000).toISOString(),
  }));
}
