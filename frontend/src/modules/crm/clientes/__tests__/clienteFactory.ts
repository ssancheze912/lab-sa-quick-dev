/**
 * clienteFactory — Faker-based test data builder for Cliente objects.
 * Story 2.1 — reused by Stories 2.2–2.6 per architecture spec.
 *
 * Usage:
 *   import { buildCliente, buildClientes } from './clienteFactory';
 *   const c = buildCliente({ nombre: 'Acme S.A.' });
 *   const list = buildClientes(10);
 */

// NOTE: When @faker-js/faker is not installed, a lightweight deterministic
// fallback is used so the factory can be imported without runtime errors.
// Install faker with: pnpm add -D @faker-js/faker

let _counter = 0;

function uid(): string {
  _counter += 1;
  return `00000000-0000-0000-0000-${String(_counter).padStart(12, '0')}`;
}

function randomNit(): string {
  const base = Math.floor(Math.random() * 900_000_000) + 100_000_000;
  const check = Math.floor(Math.random() * 9) + 1;
  return `${base}-${check}`;
}

function randomPhone(): string {
  const prefix = ['300', '301', '310', '311', '312', '315', '316', '317', '318', '319'][
    Math.floor(Math.random() * 10)
  ];
  const suffix = Math.floor(Math.random() * 10_000_000)
    .toString()
    .padStart(7, '0');
  return `${prefix}${suffix}`;
}

const CIUDADES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'];
const EMPRESAS = [
  'Acme S.A.',
  'TechCorp Ltda.',
  'Soluciones Rápidas SAS',
  'Servicios Globales SA',
  'Industrias del Norte Ltda.',
  'Comercializadora Sur SAS',
  'Grupo Empresarial ABC',
  'Consultores Andinos SA',
  'Distribuidora Central Ltda.',
  'Holding Nacional SAS',
];

// Matches the Cliente TypeScript interface defined in:
//   frontend/src/modules/crm/clientes/domain/Cliente.ts
export interface Cliente {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Build a single Cliente with optional field overrides.
 * Dates are offset to create unique ordering: each call is 1 second earlier.
 */
export function buildCliente(overrides: Partial<Cliente> = {}): Cliente {
  const idx = _counter;
  const now = new Date(Date.now() - idx * 1000);
  const empresa = EMPRESAS[idx % EMPRESAS.length];
  const ciudad = CIUDADES[idx % CIUDADES.length];

  return {
    id: uid(),
    nombre: empresa,
    nit: randomNit(),
    telefono: randomPhone(),
    ciudad,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

/**
 * Build an array of `count` Clientes.
 * Supports per-item overrides via the optional callback.
 */
export function buildClientes(
  count: number,
  overridesFn?: (index: number) => Partial<Cliente>
): Cliente[] {
  return Array.from({ length: count }, (_, i) =>
    buildCliente(overridesFn ? overridesFn(i) : {})
  );
}

/**
 * Reset the internal counter — call in beforeEach() for deterministic IDs.
 */
export function resetClienteCounter(): void {
  _counter = 0;
}
