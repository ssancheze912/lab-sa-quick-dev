/**
 * Factory helpers to generate test data for E2E tests.
 * All text fields mirror the Spanish domain of Siesa Agents CRM.
 */

let counter = Date.now();

function uniqueId(): string {
  return `${++counter}`;
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
    nit: `9${id.slice(-8).padStart(8, '0')}`,
    telefono: `300${id.slice(-7).padStart(7, '0')}`,
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
    telefono: `310${id.slice(-7).padStart(7, '0')}`,
    clienteId: null,
    ...overrides,
  };
}

/**
 * Build a bulk array of Cliente DTOs (server-shape) for the NFR1 performance
 * scenario (500-record client-side filter). Used by `page.route` interception
 * in E2E tests and by component tests via MSW handlers.
 */
export function buildClienteBulk(count: number) {
  const list: Array<{
    id: string;
    nombre: string;
    nit: string;
    telefono: string | null;
    ciudad: string | null;
    createdAt: string;
    updatedAt: string;
  }> = [];
  const baseTimestamp = Date.now();
  for (let i = 0; i < count; i++) {
    const id = uniqueId();
    const created = new Date(baseTimestamp - i * 1000).toISOString();
    list.push({
      id: `00000000-0000-0000-0000-${id.padStart(12, '0').slice(-12)}`,
      nombre: `Cliente Bulk ${i}`,
      nit: `9${id.slice(-8).padStart(8, '0')}`,
      telefono: `300${id.slice(-7).padStart(7, '0')}`,
      ciudad: 'Bogotá',
      createdAt: created,
      updatedAt: created,
    });
  }
  return list;
}
