/**
 * contactoFactory — Test data builder for Contacto objects.
 * Story 3.1 — reused by Stories 3.2–3.5 per architecture spec.
 *
 * Usage:
 *   import { buildContacto, buildContactoList, resetContactoCounter } from './contactoFactory';
 *   const c = buildContacto({ nombre: 'María López' });
 *   const list = buildContactoList(10);
 */

// NOTE: When @faker-js/faker is not installed, a lightweight deterministic
// fallback is used so the factory can be imported without runtime errors.
// Install faker with: pnpm add -D @faker-js/faker

let _counter = 0;

function uid(): string {
  _counter += 1;
  return `00000000-0000-0000-0000-${String(_counter).padStart(12, '0')}`;
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

const NOMBRES = [
  'María López',
  'Juan Rodríguez',
  'Ana Gómez',
  'Carlos Torres',
  'Laura Sánchez',
  'Pedro Ramírez',
  'Sofía Herrera',
  'Diego Morales',
  'Valentina Castro',
  'Andrés Vargas',
];

const CARGOS = [
  'Gerente Comercial',
  'Analista de Ventas',
  'Director de Marketing',
  'Coordinador de Proyectos',
  'Jefe de Compras',
  'Representante Comercial',
  'Ejecutivo de Cuenta',
  'Consultor Senior',
  'Asistente Comercial',
  'Supervisor de Ventas',
];

const DOMINIOS = [
  'empresa.co',
  'corporacion.com',
  'soluciones.co',
  'comercial.com.co',
  'negocios.co',
];

// Matches the Contacto TypeScript interface defined in:
//   frontend/src/modules/crm/contactos/domain/Contacto.ts
export interface Contacto {
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  clienteId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Build a single Contacto with optional field overrides.
 * Dates are offset to create unique ordering: each call is 1 second earlier.
 */
export function buildContacto(overrides: Partial<Contacto> = {}): Contacto {
  const idx = _counter;
  const now = new Date(Date.now() - idx * 1000);
  const nombre = NOMBRES[idx % NOMBRES.length];
  const cargo = CARGOS[idx % CARGOS.length];
  const dominio = DOMINIOS[idx % DOMINIOS.length];
  const emailBase = nombre.toLowerCase().replace(/\s+/g, '.').replace(/[áéíóú]/g, (c) =>
    ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }[c] ?? c)
  );

  return {
    id: uid(),
    nombre,
    cargo,
    telefono: randomPhone(),
    email: `${emailBase}.${idx + 1}@${dominio}`,
    clienteId: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

/**
 * Build an array of `count` Contactos.
 * Supports per-item overrides via the optional callback.
 */
export function buildContactoList(
  count: number,
  overridesFn?: (index: number) => Partial<Contacto>
): Contacto[] {
  return Array.from({ length: count }, (_, i) =>
    buildContacto(overridesFn ? overridesFn(i) : {})
  );
}

/**
 * Reset the internal counter — call in afterEach() for deterministic IDs.
 */
export function resetContactoCounter(): void {
  _counter = 0;
}
