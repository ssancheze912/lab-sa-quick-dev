/**
 * Data factory for Cliente test objects.
 * Generates deterministic but unique client data for unit and component tests.
 * Used by: ClienteListView.test.tsx, useClientes.test.ts, component tests.
 */

export interface ClienteTestData {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
}

let counter = 0;

function nextId(): number {
  return ++counter;
}

/**
 * Creates a single Cliente test object with sensible defaults.
 * Pass overrides to customize specific fields for edge-case scenarios.
 */
export function createCliente(overrides: Partial<ClienteTestData> = {}): ClienteTestData {
  const n = nextId();
  return {
    id: `a1b2c3d4-0000-0000-0000-${String(n).padStart(12, '0')}`,
    nombre: `Empresa Test ${n}`,
    nit: `9${String(n).padStart(8, '0')}-${n % 9}`,
    telefono: `300${String(n).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: `2026-01-${String((n % 28) + 1).padStart(2, '0')}T00:00:00Z`,
    ...overrides,
  };
}

/**
 * Creates an array of Cliente test objects.
 * Each receives a unique id and number suffix.
 */
export function createClientes(
  count: number,
  overrides: Partial<ClienteTestData> = {}
): ClienteTestData[] {
  return Array.from({ length: count }, () => createCliente(overrides));
}

/**
 * Pre-built fixture sets for common test scenarios.
 */
export const clienteFixtures = {
  /** Three clients whose nombre starts with "Acero" — used for search filter tests */
  aceroGroup: (): ClienteTestData[] => [
    createCliente({ nombre: 'Acero Andino', nit: '900100200-1' }),
    createCliente({ nombre: 'Acero del Norte', nit: '800200300-2' }),
    createCliente({ nombre: 'Acero del Sur', nit: '700300400-3' }),
  ],

  /** Mixed list: three Acero + two non-matching — used for search-count assertions */
  aceroGroupWithOthers: (): ClienteTestData[] => [
    createCliente({ nombre: 'Acero Andino', nit: '900100200-1' }),
    createCliente({ nombre: 'Acero del Norte', nit: '800200300-2' }),
    createCliente({ nombre: 'Acero del Sur', nit: '700300400-3' }),
    createCliente({ nombre: 'Beta Comercial', nit: '600400500-4' }),
    createCliente({ nombre: 'Gamma Ingeniería', nit: '500500600-5' }),
  ],

  /** Single client with a known NIT — used for NIT search tests */
  nitExacto: (): ClienteTestData =>
    createCliente({ nombre: 'Empresa Nit Exacto', nit: '900123456-1' }),
};
