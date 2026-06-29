/**
 * MSW 2 route handlers for DELETE /api/v1/contactos/:id endpoint.
 * Story 3.5 — Delete Contact (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 */

import { http, HttpResponse } from 'msw';

const BASE = '/api/v1/contactos';

/** Returns 204 No Content on successful deletion. */
export function handleDeleteContactoSuccess() {
  return http.delete(`${BASE}/:contactoId`, () =>
    new HttpResponse(null, { status: 204 })
  );
}

/** Returns 404 Not Found with Problem Details (no stackTrace) when contact does not exist. */
export function handleDeleteContactoNotFound() {
  return http.delete(`${BASE}/:contactoId`, () =>
    HttpResponse.json(
      {
        status: 404,
        title: 'Not Found',
        detail: 'Contacto no encontrado',
      },
      { status: 404 }
    )
  );
}

/** Returns HTTP 500 to simulate unexpected backend failure. */
export function handleDeleteContactoServerError() {
  return http.delete(`${BASE}/:contactoId`, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
