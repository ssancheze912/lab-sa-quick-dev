/**
 * MSW (Mock Service Worker) handlers for the Clientes API — Story 2.1 ATDD
 *
 * Import these handlers into your MSW server setup.
 * Each handler can be imported individually and used via server.use() in tests
 * to override the default behavior for specific test scenarios.
 */

import { http, HttpResponse } from 'msw';
import { clienteFactory, clienteListFactory } from '../../factories/cliente.factory';

const API_BASE = '/api/v1';

// ---------------------------------------------------------------------------
// Default handler — returns 2 clients (happy path)
// ---------------------------------------------------------------------------
export const getClientesSuccess = http.get(`${API_BASE}/clientes`, () => {
  return HttpResponse.json([
    clienteFactory({ nombre: 'Acme Corp', nit: '900111222' }),
    clienteFactory({ nombre: 'Beta Ltda', nit: '900333444' }),
  ]);
});

// ---------------------------------------------------------------------------
// Empty handler — returns [] (EmptyState scenario)
// ---------------------------------------------------------------------------
export const getClientesEmpty = http.get(`${API_BASE}/clientes`, () => {
  return HttpResponse.json([]);
});

// ---------------------------------------------------------------------------
// Error handler — returns 500 (ErrorPanel scenario)
// ---------------------------------------------------------------------------
export const getClientesError = http.get(`${API_BASE}/clientes`, () => {
  return HttpResponse.json(
    { title: 'Internal Server Error', status: 500 },
    { status: 500 },
  );
});

// ---------------------------------------------------------------------------
// Large list handler — returns 500 items (NFR1 performance scenario)
// ---------------------------------------------------------------------------
export const getClientesList500 = http.get(`${API_BASE}/clientes`, () => {
  return HttpResponse.json(clienteListFactory(500));
});

// ---------------------------------------------------------------------------
// Default export: handlers array for MSW server setup
// ---------------------------------------------------------------------------
export const clientesHandlers = [getClientesSuccess];
