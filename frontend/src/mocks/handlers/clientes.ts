import { http, HttpResponse } from 'msw'

/**
 * MSW handlers for Story 2.1 — Client List & Search.
 *
 * Shape mirrors ClienteDto from the backend (camelCase, ISO 8601 dates).
 */

export interface ClienteFixture {
  id: string
  nombre: string
  nitRuc: string
  telefono: string
  ciudad: string
  createdAt: string
  updatedAt: string
}

const ciudades = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Pereira']

export function buildClienteFixture(overrides?: Partial<ClienteFixture>): ClienteFixture {
  const seed = Math.floor(Math.random() * 1_000_000_000)
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    nombre: `Cliente ${seed}`,
    nitRuc: `9${String(seed).padStart(9, '0').slice(0, 9)}`,
    telefono: `300${String(seed).padStart(7, '0').slice(0, 7)}`,
    ciudad: ciudades[seed % ciudades.length] as string,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export function buildClienteFixtures(count: number): ClienteFixture[] {
  return Array.from({ length: count }, (_, i) =>
    buildClienteFixture({
      nombre: `Cliente Fixture ${String(i).padStart(3, '0')}`,
    })
  )
}

/**
 * Default 3-client handler set.
 */
export function clienteHandlers(fixtures: ClienteFixture[] = buildClienteFixtures(3)) {
  return [
    http.get('*/api/v1/clientes', () => HttpResponse.json(fixtures)),
  ]
}

/**
 * Empty list handler — drives the no-clients EmptyState.
 */
export function clienteHandlersEmpty() {
  return [http.get('*/api/v1/clientes', () => HttpResponse.json([]))]
}

/**
 * 500-record fixture set — drives the NFR1 perf assertion.
 */
export function clienteHandlers500() {
  return [http.get('*/api/v1/clientes', () => HttpResponse.json(buildClienteFixtures(500)))]
}

/**
 * Error handler — drives the ErrorPanel.
 */
export function clienteHandlersError() {
  return [
    http.get('*/api/v1/clientes', () =>
      HttpResponse.json(
        { type: 'about:blank', title: 'Server Error', status: 500 },
        { status: 500 }
      )
    ),
  ]
}
