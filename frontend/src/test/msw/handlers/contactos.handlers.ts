/**
 * MSW 2 route handlers for /api/v1/contactos endpoint.
 * Story 3.1 — Contact List & Search (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 * The exported factories below cover all MSW variants required by Story 3.1.
 */

import { http, HttpResponse, delay } from 'msw';
import { createContactos, type ContactoTestData } from '../../factories/contacto.factory';

const BASE = '/api/v1/contactos';

// ---------------------------------------------------------------------------
// Handler factories — call with arguments to configure the handler per test
// ---------------------------------------------------------------------------

/** Returns a fixed list of contacts. */
export function handleGetContactosSuccess(contactos: ContactoTestData[]) {
  return http.get(BASE, () => HttpResponse.json(contactos));
}

/** Returns an empty array (no contacts in system). */
export function handleGetContactosEmpty() {
  return http.get(BASE, () => HttpResponse.json([]));
}

/** Returns HTTP 500 to simulate backend failure. */
export function handleGetContactosError() {
  return http.get(BASE, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}

/** Returns 1000 contacts for performance tests. */
export function handleGetContactos1000() {
  return http.get(BASE, () => HttpResponse.json(createContactos(1000)));
}

/** Returns contacts after a configurable delay (ms) — for loading-state tests. */
export function handleGetContactosDelayed(contactos: ContactoTestData[], delayMs = 200) {
  return http.get(BASE, async () => {
    await delay(delayMs);
    return HttpResponse.json(contactos);
  });
}
