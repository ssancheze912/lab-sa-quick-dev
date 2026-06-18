/**
 * Data factory for ClienteDto — Story 2.1 ATDD
 * Generates deterministic-random test data for component, unit, and API tests.
 *
 * NOTE: @faker-js/faker is not yet installed; using lightweight inline generators
 * to keep this factory dependency-free until the package is added.
 */

let _seq = 1;

function nextSeq(): number {
  return _seq++;
}

export interface ClienteDto {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
}

/**
 * Creates a single ClienteDto with optional overrides.
 * All fields are unique-per-call to prevent data collisions.
 */
export function clienteFactory(overrides: Partial<ClienteDto> = {}): ClienteDto {
  const seq = nextSeq();
  const pad = (n: number, len: number) => String(n).padStart(len, '0');
  const uuid = `00000000-0000-0000-0000-${pad(seq, 12)}`;

  return {
    id: uuid,
    nombre: `Empresa Test ${seq}`,
    nit: `9${pad(seq, 8)}`,
    telefono: `300${pad(seq, 7)}`,
    ciudad: 'Bogotá',
    createdAt: new Date(Date.now() - seq * 60_000).toISOString(),
    ...overrides,
  };
}

/**
 * Creates an array of n ClienteDtos — used for performance tests (n=500).
 */
export function clienteListFactory(count: number): ClienteDto[] {
  return Array.from({ length: count }, () => clienteFactory());
}
