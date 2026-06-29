/**
 * MSW 2 route handlers for DELETE /api/v1/clientes/:id endpoint.
 * Story 2.5 — Delete Client (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 */

import { http, HttpResponse } from 'msw';

const BASE = '/api/v1/clientes';

/** Returns 204 No Content on successful deletion. */
export function handleDeleteClienteSuccess() {
  return http.delete(`${BASE}/:clienteId`, () =>
    new HttpResponse(null, { status: 204 })
  );
}

/** Returns 404 Not Found with Problem Details (no stackTrace) when client does not exist. */
export function handleDeleteClienteNotFound() {
  return http.delete(`${BASE}/:clienteId`, () =>
    HttpResponse.json(
      {
        status: 404,
        title: 'Not Found',
        detail: 'Cliente no encontrado',
      },
      { status: 404 }
    )
  );
}

/** Returns HTTP 500 to simulate unexpected backend failure. */
export function handleDeleteClienteServerError() {
  return http.delete(`${BASE}/:clienteId`, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
