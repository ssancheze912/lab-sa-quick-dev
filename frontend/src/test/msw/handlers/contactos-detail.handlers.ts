/**
 * MSW 2 route handlers for GET /api/v1/contactos/:contactoId endpoint.
 * Story 3.2 — Contact Detail View (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 * Covers AC #2, #3, #4, #5 (loading states, not-found, error, fetch-by-id).
 */

import { http, HttpResponse, delay } from 'msw';
import type { ContactoTestData } from '../../factories/contacto.factory';

const BASE = '/api/v1/contactos';

// ---------------------------------------------------------------------------
// Handler factories for single-contacto GET by ID
// ---------------------------------------------------------------------------

/** Returns a single contacto by ID when found. */
export function handleGetContactoByIdSuccess(contacto: ContactoTestData) {
  return http.get(`${BASE}/:contactoId`, ({ params }) => {
    if (params.contactoId === contacto.id) {
      return HttpResponse.json(contacto);
    }
    return new HttpResponse(null, { status: 404 });
  });
}

/** Returns 404 Problem Details for any contactoId (or a specific one). */
export function handleGetContactoByIdNotFound(contactoId?: string) {
  return http.get(`${BASE}/:contactoId`, ({ params }) => {
    if (contactoId && params.contactoId !== contactoId) {
      return undefined;
    }
    return HttpResponse.json(
      {
        status: 404,
        title: 'Contacto no encontrado',
        detail: `No existe un contacto con id '${params.contactoId}'.`,
      },
      { status: 404 }
    );
  });
}

/** Returns the contacto after a configurable delay (ms) — for loading-state tests. */
export function handleGetContactoByIdDelayed(contacto: ContactoTestData, delayMs = 200) {
  return http.get(`${BASE}/:contactoId`, async ({ params }) => {
    await delay(delayMs);
    if (params.contactoId === contacto.id) {
      return HttpResponse.json(contacto);
    }
    return new HttpResponse(null, { status: 404 });
  });
}

/** Returns HTTP 500 to simulate backend failure. */
export function handleGetContactoByIdError() {
  return http.get(`${BASE}/:contactoId`, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
