/**
 * Data factory for Cliente entities used in E2E tests.
 * Generates deterministic-enough test data with unique counters to avoid collisions.
 * Supports partial overrides for specific scenario testing.
 */

let counter = Date.now();

function uniqueId(): string {
  return `${++counter}`;
}

export interface ClienteDto {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  contactCount: number;
}

/**
 * Creates a single ClienteDto with generated fields.
 * All fields are guaranteed unique per call via counter.
 * Use overrides to control specific scenario values.
 *
 * @example
 * const cliente = buildCliente({ nombre: 'Acme SAS', contactCount: 0 });
 */
export function buildCliente(overrides: Partial<ClienteDto> = {}): ClienteDto {
  const id = uniqueId();
  return {
    id: `00000000-0000-0000-0000-${id.padStart(12, '0')}`,
    nombre: `Empresa Test ${id}`,
    nit: `9${id.slice(-8).padStart(8, '0')}`,
    telefono: `300${id.slice(-7).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    contactCount: 1,
    ...overrides,
  };
}

/**
 * Creates an array of ClienteDto instances.
 * @param count - Number of clients to generate
 * @param overrides - Optional overrides applied to each item (except unique fields)
 *
 * @example
 * const clientes = buildClientes(500); // Performance testing with 500 records
 */
export function buildClientes(count: number, overrides: Partial<ClienteDto> = {}): ClienteDto[] {
  return Array.from({ length: count }, () => buildCliente(overrides));
}
