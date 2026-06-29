/**
 * MSW 2 route handlers for GET /api/v1/clientes/:clienteId endpoint.
 * Story 2.2 — Client Detail View (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 * Covers AC #3, #4, #6.
 */

import { http, HttpResponse, delay } from 'msw';
import type { ClienteTestData } from '../../factories/cliente.factory';

const BASE = '/api/v1/clientes';

// ---------------------------------------------------------------------------
// Handler factories for single-client GET by ID
// ---------------------------------------------------------------------------

/** Returns a single client by ID when found. */
export function handleGetClienteByIdSuccess(client: ClienteTestData) {
  return http.get(`${BASE}/:clienteId`, ({ params }) => {
    if (params.clienteId === client.id) {
      return HttpResponse.json(client);
    }
    return new HttpResponse(null, { status: 404 });
  });
}

/** Returns 404 Problem Details for any clienteId. */
export function handleGetClienteByIdNotFound(clienteId?: string) {
  return http.get(`${BASE}/:clienteId`, ({ params }) => {
    if (clienteId && params.clienteId !== clienteId) {
      // Allow other IDs to fall through if a specific ID is provided
      return undefined;
    }
    return HttpResponse.json(
      {
        status: 404,
        title: 'Not Found',
        detail: `Cliente con ID ${params.clienteId} no encontrado.`,
      },
      { status: 404 }
    );
  });
}

/** Returns the client after a configurable delay (ms) — for loading-state tests. */
export function handleGetClienteByIdDelayed(client: ClienteTestData, delayMs = 200) {
  return http.get(`${BASE}/:clienteId`, async ({ params }) => {
    await delay(delayMs);
    if (params.clienteId === client.id) {
      return HttpResponse.json(client);
    }
    return new HttpResponse(null, { status: 404 });
  });
}

/** Returns HTTP 500 to simulate backend failure. */
export function handleGetClienteByIdError() {
  return http.get(`${BASE}/:clienteId`, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
