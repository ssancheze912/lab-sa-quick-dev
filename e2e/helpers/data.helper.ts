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
