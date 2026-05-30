// MSW 2+ handlers for clientes API
// Used by component tests for Story 2.1: Client List & Search and Story 2.2: Client Detail View
// AC covered (Story 2.1): AC#1, AC#2, AC#3, AC#4, AC#5
// AC covered (Story 2.2): AC#1, AC#2, AC#3, AC#4, AC#5

import { http, HttpResponse } from 'msw'

export interface MockCliente {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

export const mockClientes: MockCliente[] = [
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000001',
    nombre: 'Ana García',
    nit: '900-111-001',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00+00:00',
    updatedAt: '2026-01-01T00:00:00+00:00',
  },
  {
    id: 'a1b2c3d4-0000-0000-0000-000000000002',
    nombre: 'Pedro Pérez',
    nit: '800-222-002',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00+00:00',
    updatedAt: '2026-01-02T00:00:00+00:00',
  },
]

// ─── Story 2.1: List handlers ──────────────────────────────────────────────

export const clientesHandlers = [
  http.get('/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes)
  }),
]

export const clientesEmptyHandlers = [
  http.get('/api/v1/clientes', () => {
    return HttpResponse.json([])
  }),
]

export const clientesErrorHandlers = [
  http.get('/api/v1/clientes', () => {
    return HttpResponse.error()
  }),
]

// ─── Story 2.2: Single-client GET handlers ─────────────────────────────────

/**
 * Handler for GET /api/v1/clientes/:id
 * Returns the matching client from mockClientes or 404 Problem Details if not found.
 * Used by ClienteDetailView component tests and useCliente hook tests.
 */
export const clienteByIdHandlers = [
  http.get('/api/v1/clientes/:id', ({ params }) => {
    const { id } = params as { id: string }
    const found = mockClientes.find((c) => c.id === id)
    if (!found) {
      return HttpResponse.json(
        {
          status: 404,
          title: 'Cliente no encontrado',
          detail: `No existe un cliente con ID ${id}.`,
        },
        {
          status: 404,
          headers: { 'Content-Type': 'application/problem+json' },
        }
      )
    }
    return HttpResponse.json(found)
  }),
]

/**
 * Network error handler for GET /api/v1/clientes/:id
 * Simulates a non-404 network failure to test AC#4 retry panel.
 */
export const clienteByIdErrorHandlers = [
  http.get('/api/v1/clientes/:id', () => {
    return HttpResponse.error()
  }),
]

/**
 * 404 handler for GET /api/v1/clientes/:id with a specific ID.
 * Useful when tests need to guarantee a 404 for a known UUID.
 */
export const clienteNotFoundHandlers = [
  http.get('/api/v1/clientes/:id', ({ params }) => {
    return HttpResponse.json(
      {
        status: 404,
        title: 'Cliente no encontrado',
        detail: `No existe un cliente con ID ${(params as { id: string }).id}.`,
      },
      {
        status: 404,
        headers: { 'Content-Type': 'application/problem+json' },
      }
    )
  }),
]
