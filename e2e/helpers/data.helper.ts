import { randomInt } from 'node:crypto';

/**
 * Factory helpers to generate test data for E2E tests.
 * All text fields mirror the Spanish domain of Siesa Agents CRM.
 *
 * Playwright runs multiple projects (chromium, mobile-chrome) in parallel,
 * each spawning its own OS process. IDs must be unique not only within a
 * single worker but across all worker processes running concurrently
 * against the same shared backend/DB. `process.pid` isolates per-process,
 * while a crypto-random suffix (placed at the END of the id, since some
 * fields truncate with `slice(-N)`) guarantees the tail is never a
 * predictable/colliding value even if two processes start at the same ms.
 */
let counter = 0;

function uniqueId(): string {
  counter += 1;
  const random = randomInt(0, 1_000_000).toString().padStart(6, '0');
  return `${Date.now()}${process.pid}${counter}${random}`;
}

/**
 * Cryptographically random numeric string, safe to use standalone
 * (e.g. as a NIT or search token) with no risk of cross-process collision.
 */
export function uniqueDigits(length: number): string {
  let digits = '';
  for (let i = 0; i < length; i++) {
    digits += randomInt(0, 10).toString();
  }
  return digits;
}

export function buildCliente(overrides?: Partial<{
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
}>) {
  const id = uniqueId();
  return {
    nombre: `Cliente Test ${id}`,
    nit: `9${uniqueDigits(8)}`,
    telefono: `300${uniqueDigits(7)}`,
    ciudad: 'Bogotá',
    ...overrides,
  };
}

export function buildContacto(overrides?: Partial<{
  nombre: string;
  email: string;
  cargo: string;
  telefono: string;
  clienteId: string | null;
}>) {
  const id = uniqueId();
  return {
    nombre: `Contacto Test ${id}`,
    email: `contacto.test.${id}@ejemplo.co`,
    cargo: 'Analista',
    telefono: `310${uniqueDigits(7)}`,
    clienteId: null,
    ...overrides,
  };
}
