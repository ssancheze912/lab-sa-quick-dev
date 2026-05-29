/**
 * Data Factory — Cliente entity (Frontend test factory)
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Generates random Cliente objects for Vitest component and unit tests.
 * Mirrors the factory at tests/support/factories/cliente.factory.ts
 * but lives inside the frontend test tree for import resolution.
 *
 * Factory principles:
 *   - No hardcoded values — all fields generated with variety
 *   - Supports overrides for specific test scenarios
 *   - Generates complete valid objects matching the Cliente contract
 *   - createClientes(n) for bulk generation (e.g. 500-record perf test)
 */

export interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Inline random helpers ────────────────────────────────────────────────────

let _counter = 1;

function _nextId(): number {
  return _counter++;
}

function _uuid(seed?: number): string {
  const s = seed ?? _nextId();
  return `test-${s.toString().padStart(4, '0')}-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(
    /[xy]/g,
    (c) => {
      const v = c === 'x' ? (s ^ (Math.random() * 16)) & 15 : ((s ^ (Math.random() * 16)) & 3) | 8;
      return v.toString(16);
    },
  );
}

const NOMBRES = [
  'Empresa Alpha SAS',
  'Distribuidora Beta Ltda',
  'Comercializadora Gamma SA',
  'Importadora Delta Corp',
  'Constructora Epsilon SAS',
  'Consultora Zeta Ltda',
  'Servicios Eta SA',
  'Logística Theta SAS',
  'Manufactura Iota Corp',
  'Tecnología Kappa SA',
];

const CIUDADES = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Bucaramanga',
  'Cartagena',
  'Pereira',
  'Manizales',
];

// ─── Factory functions ─────────────────────────────────────────────────────────

/**
 * Creates a single Cliente with optional field overrides.
 *
 * @example
 * const cliente = createCliente({ nombre: 'Empresa XYZ', nit: '900123456-1' });
 */
export function createCliente(overrides: Partial<Cliente> = {}): Cliente {
  const n = _nextId();
  const nombre = NOMBRES[n % NOMBRES.length];
  const ciudad = CIUDADES[n % CIUDADES.length];
  const now = new Date().toISOString();

  return {
    id: _uuid(n),
    nombre,
    nit: `${900000000 + (n * 1234567) % 99999999}-${n % 9}`,
    telefono: `+57 ${300 + (n % 99)} ${1000000 + (n * 7) % 9000000}`,
    ciudad,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates an array of `count` Cliente objects with unique IDs.
 *
 * @example
 * const clientes = createClientes(500); // 500 records for performance test
 */
export function createClientes(count: number, overrides: Partial<Cliente> = {}): Cliente[] {
  return Array.from({ length: count }, (_, i) =>
    createCliente({ ...overrides, id: `test-id-${i + 1}` }),
  );
}

/**
 * Creates a Cliente with known, predictable nombre and nit for search tests.
 *
 * @example
 * const known = createKnownCliente('Empresa Especial', '900123456-7');
 */
export function createKnownCliente(nombre: string, nit: string): Cliente {
  return createCliente({ nombre, nit });
}
