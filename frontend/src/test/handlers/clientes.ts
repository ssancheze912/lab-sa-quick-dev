/**
 * MSW Handlers — /api/v1/clientes
 * Used by component tests in Story 2.1 (Client List & Search)
 *
 * Import these handlers into your test's server setup:
 *   import { clienteHandlers } from '@/test/handlers/clientes'
 */
import { http, HttpResponse } from 'msw'
import { createCliente, createClientes } from '../factories/cliente.factory'

// ---------------------------------------------------------------------------
// Shared mock data (deterministic subset for predictable assertions)
// ---------------------------------------------------------------------------

export const mockClientes = [
  createCliente({ id: 'id-001', nombre: 'Empresa Alfa', nit: '123456789' }),
  createCliente({ id: 'id-002', nombre: 'Compañía Beta', nit: '987654321' }),
  createCliente({ id: 'id-003', nombre: 'Corporación Gamma', nit: '456789123' }),
]

// ---------------------------------------------------------------------------
// Default happy-path handler — returns 3 clients
// ---------------------------------------------------------------------------

export const clienteListSuccessHandler = http.get('/api/v1/clientes', () =>
  HttpResponse.json(mockClientes, { status: 200 }),
)

// ---------------------------------------------------------------------------
// Empty-list handler — backend returns [] with HTTP 200
// ---------------------------------------------------------------------------

export const clienteListEmptyHandler = http.get('/api/v1/clientes', () =>
  HttpResponse.json([], { status: 200 }),
)

// ---------------------------------------------------------------------------
// Network-error handler — simulates backend unavailable
// ---------------------------------------------------------------------------

export const clienteListNetworkErrorHandler = http.get('/api/v1/clientes', () =>
  HttpResponse.error(),
)

// ---------------------------------------------------------------------------
// Bulk 500-record handler — for NFR1 performance test (T2.1-006)
// ---------------------------------------------------------------------------

export const clienteList500Handler = http.get('/api/v1/clientes', () =>
  HttpResponse.json(createClientes(500), { status: 200 }),
)

// ---------------------------------------------------------------------------
// Default export — happy-path handlers for use in server setup
// ---------------------------------------------------------------------------

export const clienteHandlers = [clienteListSuccessHandler]
