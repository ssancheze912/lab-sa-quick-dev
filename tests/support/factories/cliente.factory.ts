/**
 * Data Factory — Cliente entity
 * Story 2.1: Client List & Search
 *
 * Generates deterministic-random Cliente objects for use in component and API tests.
 * No external faker dependency — uses inline pseudo-random helpers to keep the
 * factory self-contained in this project's test environment.
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

// ─── Inline random helpers (no faker dep required) ──────────────────────────

let _seed = 1;

function _rand(max: number): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return Math.abs(_seed) % max;
}

function _uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const v = c === 'x' ? _rand(16) : (_rand(4) & 0x3) | 0x8;
    return v.toString(16);
  });
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

// ─── Factory functions ────────────────────────────────────────────────────────

/**
 * Creates a single Cliente with optional field overrides.
 *
 * @example
 * const cliente = createCliente({ nombre: 'Empresa XYZ' });
 */
export function createCliente(overrides: Partial<Cliente> = {}): Cliente {
  const index = _rand(NOMBRES.length);
  const now = new Date().toISOString();

  return {
    id: _uuid(),
    nombre: NOMBRES[index],
    nit: `${900000000 + _rand(99999999)}-${_rand(9)}`,
    telefono: `+57 ${300 + _rand(99)} ${_rand(9000000) + 1000000}`,
    ciudad: CIUDADES[_rand(CIUDADES.length)],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates an array of `count` Cliente objects.
 *
 * @example
 * const clientes = createClientes(500); // 500 records for perf test
 */
export function createClientes(count: number, overrides: Partial<Cliente> = {}): Cliente[] {
  return Array.from({ length: count }, (_, i) =>
    createCliente({ ...overrides, id: `test-id-${i + 1}` }),
  );
}

/**
 * Creates a predictable Cliente with a known nombre and nit for search tests.
 *
 * @example
 * const known = createKnownCliente('Empresa Especial', '900123456-7');
 */
export function createKnownCliente(nombre: string, nit: string): Cliente {
  return createCliente({ nombre, nit });
}
