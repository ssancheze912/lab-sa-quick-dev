/**
 * Data factory for Cliente test objects.
 * Story 2.1 — Client List & Search (ATDD RED phase)
 *
 * Generates deterministic-looking but unique clients for component and unit tests.
 * Does NOT use @faker-js/faker (not installed); uses crypto.randomUUID instead.
 */

export interface ClienteTestData {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string; // ISO 8601 with TZ
}

let _counter = 0;

function nextId(): string {
  _counter += 1;
  return String(_counter).padStart(4, '0');
}

/**
 * Create a single valid ClienteTestData.
 * Pass `overrides` to control specific fields.
 */
export function createCliente(overrides: Partial<ClienteTestData> = {}): ClienteTestData {
  const seq = nextId();
  const base: ClienteTestData = {
    id: `00000000-0000-0000-0000-${seq.padStart(12, '0')}`,
    nombre: `Empresa Test ${seq}`,
    nit: `900${seq.padStart(6, '0')}-${seq.slice(-1)}`,
    telefono: `300${seq.padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date(Date.UTC(2026, 0, parseInt(seq, 10) % 28 + 1)).toISOString(),
  };
  return { ...base, ...overrides };
}

/**
 * Create an array of `count` clients.
 * Each client gets a unique seq so names/NITs don't collide.
 */
export function createClientes(count: number, overrides: Partial<ClienteTestData> = {}): ClienteTestData[] {
  return Array.from({ length: count }, () => createCliente(overrides));
}

/**
 * Reset the internal counter — call in beforeEach if deterministic IDs are needed.
 */
export function resetClienteCounter(): void {
  _counter = 0;
}
