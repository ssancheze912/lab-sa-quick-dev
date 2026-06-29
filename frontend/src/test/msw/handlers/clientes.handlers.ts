/**
 * MSW 2 route handlers for /api/v1/clientes endpoint.
 * Story 2.1 — Client List & Search (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 * The exported constants below cover all MSW variants required by Story 2.1.
 */

import { http, HttpResponse, delay } from 'msw';
import { createClientes, type ClienteTestData } from '../../factories/cliente.factory';

const BASE = '/api/v1/clientes';

// ---------------------------------------------------------------------------
// Handler factories — call with arguments to configure the handler per test
// ---------------------------------------------------------------------------

/** Returns a fixed list of clients (default 3). */
export function handleGetClientesSuccess(clients: ClienteTestData[]) {
  return http.get(BASE, () => HttpResponse.json(clients));
}

/** Returns an empty array (no clients in system). */
export function handleGetClientesEmpty() {
  return http.get(BASE, () => HttpResponse.json([]));
}

/** Returns HTTP 500 to simulate backend failure. */
export function handleGetClientesError() {
  return http.get(BASE, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}

/** Returns 500 clients for performance tests. */
export function handleGetClientes500() {
  return http.get(BASE, () => HttpResponse.json(createClientes(500)));
}

/** Returns clients after a configurable delay (ms) — for loading-state tests. */
export function handleGetClientesDelayed(clients: ClienteTestData[], delayMs = 200) {
  return http.get(BASE, async () => {
    await delay(delayMs);
    return HttpResponse.json(clients);
  });
}
