/**
 * MSW handlers for /api/v1/clientes used by component tests.
 * Story 2.1 — RED phase. Tests will fail until the client feature is implemented.
 */
import { http, HttpResponse, delay } from 'msw'

export interface ClienteMock {
  id: string
  nombre: string
  nit: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

const now = new Date().toISOString()

export const seedClientes: ClienteMock[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Acme Corporation',
    nit: '900123456',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Peña & Asociados',
    nit: '800987654',
    telefono: '3007654321',
    ciudad: 'Medellín',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Global Foods S.A.',
    nit: '901555444',
    telefono: '3009998877',
    ciudad: 'Cali',
    createdAt: now,
    updatedAt: now,
  },
]

/** Success handler returning the seeded array. */
export const clientesSuccessHandler = (body: ClienteMock[] = seedClientes) =>
  http.get('*/api/v1/clientes', async () => {
    await delay(10)
    return HttpResponse.json(body)
  })

/** Empty-array handler. */
export const clientesEmptyHandler = () =>
  http.get('*/api/v1/clientes', async () => {
    await delay(10)
    return HttpResponse.json([])
  })

/** 500 error handler. */
export const clientesErrorHandler = () =>
  http.get('*/api/v1/clientes', async () => {
    await delay(10)
    return new HttpResponse(null, { status: 500 })
  })

/**
 * Deterministic large dataset for the perf benchmark (AC #9).
 * Generates `count` clients — deterministic seeds so tests are repeatable.
 */
export function buildLargeClienteSet(count: number): ClienteMock[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
    nombre: `Cliente ${i} — ${['Acme', 'Globex', 'Initech', 'Umbrella', 'Peña'][i % 5]}`,
    nit: `9${String(100000000 + i).slice(-8)}`,
    telefono: `300${String(1000000 + i).slice(-7)}`,
    ciudad: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'][i % 4],
    createdAt: now,
    updatedAt: now,
  }))
}
