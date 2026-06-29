/**
 * Data factory for Contacto test objects.
 * Story 3.1 — Contact List & Search (ATDD RED phase)
 *
 * Generates deterministic-looking but unique contacts for component and unit tests.
 * Does NOT use @faker-js/faker (not installed); uses sequential counters instead.
 */

export interface ContactoTestData {
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  clienteId: string | null;
  createdAt: string; // ISO 8601 with TZ
}

let _counter = 0;

function nextId(): string {
  _counter += 1;
  return String(_counter).padStart(4, '0');
}

/**
 * Create a single valid ContactoTestData.
 * Pass `overrides` to control specific fields.
 */
export function createContacto(overrides: Partial<ContactoTestData> = {}): ContactoTestData {
  const seq = nextId();
  const base: ContactoTestData = {
    id: `10000000-0000-0000-0000-${seq.padStart(12, '0')}`,
    nombre: `Contacto Test ${seq}`,
    cargo: `Cargo ${seq}`,
    telefono: `310${seq.padStart(7, '0')}`,
    email: `contacto.test.${seq}@siesa.com`,
    clienteId: null,
    createdAt: new Date(Date.UTC(2026, 0, parseInt(seq, 10) % 28 + 1)).toISOString(),
  };
  return { ...base, ...overrides };
}

/**
 * Create an array of `count` contacts.
 * Each contact gets a unique seq so names/emails don't collide.
 */
export function createContactos(count: number, overrides: Partial<ContactoTestData> = {}): ContactoTestData[] {
  return Array.from({ length: count }, () => createContacto(overrides));
}

/**
 * Reset the internal counter — call in beforeEach if deterministic IDs are needed.
 */
export function resetContactoCounter(): void {
  _counter = 0;
}
