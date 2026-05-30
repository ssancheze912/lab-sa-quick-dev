// MSW 2+ handlers for clientes API
// Used by component tests for Story 2.1: Client List & Search
// AC covered: AC#1, AC#2, AC#3, AC#4, AC#5

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
