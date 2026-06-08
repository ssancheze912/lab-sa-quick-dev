/**
 * MSW handlers + seed factories for `GET /api/v1/clientes`.
 * Used by Vitest component tests (Story 2.1, Task 17).
 *
 * VITE_API_URL is undefined in the test environment, so axios defaults to
 * relative URLs. We match on `*\/api/v1/clientes` to be agnostic of host.
 */

import { http, HttpResponse, delay } from 'msw'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

const ENDPOINT = '*/api/v1/clientes'

/**
 * Generates a deterministic array of clients for tests.
 * Indexes drive nombre + nit so we can target specific items in assertions.
 */
export function seedClientes(n: number): Cliente[] {
  const now = new Date('2026-06-01T00:00:00Z').getTime()
  return Array.from({ length: n }, (_, i) => {
    const idx = String(i).padStart(4, '0')
    const isoCreated = new Date(now - i * 1000).toISOString().replace('Z', '+00:00')
    return {
      id: `00000000-0000-0000-0000-${idx.padStart(12, '0')}`,
      nombre: `Cliente Demo ${idx}`,
      nit: `9000000${idx}-${i % 10}`,
      telefono: `30012345${idx}`,
      ciudad: 'Bogotá',
      createdAt: isoCreated,
      updatedAt: isoCreated,
    } satisfies Cliente
  })
}

export const clientesHandlers = {
  ok(payload: Cliente[]) {
    return http.get(ENDPOINT, () => HttpResponse.json(payload))
  },
  empty() {
    return http.get(ENDPOINT, () => HttpResponse.json([] as Cliente[]))
  },
  failing(status = 500) {
    return http.get(ENDPOINT, () =>
      HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
          title: 'Internal Server Error',
          status,
        },
        { status, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    )
  },
  delayed(ms: number, payload: Cliente[]) {
    return http.get(ENDPOINT, async () => {
      await delay(ms)
      return HttpResponse.json(payload)
    })
  },
}
