/**
 * MSW handlers for clientes API endpoints.
 * Used by component tests for Story 2.1.
 */

import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:5000';

export interface ClienteDto {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Fixture factories ───────────────────────────────────────────────────────

export function buildClienteDto(overrides?: Partial<ClienteDto>): ClienteDto {
  const id = crypto.randomUUID();
  return {
    id,
    nombre: `Empresa Test ${id.slice(0, 6)}`,
    nit: `9001${id.replace(/-/g, '').slice(0, 8)}`,
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export const FIVE_CLIENTES: ClienteDto[] = [
  buildClienteDto({ id: '11111111-0000-0000-0000-000000000001', nombre: 'Empresa Alpha SA', nit: '900100001-1' }),
  buildClienteDto({ id: '11111111-0000-0000-0000-000000000002', nombre: 'Beta Ltda', nit: '900200002-2' }),
  buildClienteDto({ id: '11111111-0000-0000-0000-000000000003', nombre: 'Gamma Corp', nit: '900300003-3' }),
  buildClienteDto({ id: '11111111-0000-0000-0000-000000000004', nombre: 'Delta SAS', nit: '900400004-4' }),
  buildClienteDto({ id: '11111111-0000-0000-0000-000000000005', nombre: 'Epsilon Inc', nit: '900500005-5' }),
];

// ─── Handler builders ────────────────────────────────────────────────────────

/** Returns 200 with a provided array of clientes */
export function handleGetClientesSuccess(clientes: ClienteDto[]) {
  return http.get(`${API_BASE}/api/v1/clientes`, () => {
    return HttpResponse.json(clientes);
  });
}

/** Returns 200 with an empty array (no clients in system) */
export function handleGetClientesEmpty() {
  return http.get(`${API_BASE}/api/v1/clientes`, () => {
    return HttpResponse.json([]);
  });
}

/** Returns a network-level error (backend unavailable) */
export function handleGetClientesNetworkError() {
  return http.get(`${API_BASE}/api/v1/clientes`, () => {
    return HttpResponse.error();
  });
}
