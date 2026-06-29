/**
 * MSW 2 route handlers for Story 4.4 — View Associated Client from Contact Detail.
 *
 * Combines GET /api/v1/contactos/:contactoId (with clienteId set or null)
 * and GET /api/v1/clientes/:clienteId (for client name resolution).
 *
 * Used by ContactoDetailView.clienteAsociado.test.tsx (component tests).
 */

import { http, HttpResponse, delay } from 'msw';
import type { ContactoTestData } from '../../factories/contacto.factory';
import type { ClienteTestData } from '../../factories/cliente.factory';

const CONTACTOS_BASE = '/api/v1/contactos';
const CLIENTES_BASE = '/api/v1/clientes';

// ---------------------------------------------------------------------------
// Contacto handler — with non-null clienteId
// ---------------------------------------------------------------------------

/** Returns a contacto that has a non-null clienteId. */
export function handleGetContactoWithClienteId(contacto: ContactoTestData) {
  return http.get(`${CONTACTOS_BASE}/:contactoId`, ({ params }) => {
    if (params.contactoId === contacto.id) {
      return HttpResponse.json(contacto);
    }
    return new HttpResponse(null, { status: 404 });
  });
}

/** Returns a contacto whose clienteId is null (orphan contact). */
export function handleGetContactoWithNullClienteId(contacto: ContactoTestData) {
  return http.get(`${CONTACTOS_BASE}/:contactoId`, ({ params }) => {
    if (params.contactoId === contacto.id) {
      return HttpResponse.json({ ...contacto, clienteId: null });
    }
    return new HttpResponse(null, { status: 404 });
  });
}

// ---------------------------------------------------------------------------
// Cliente handlers — for the secondary fetch when clienteId is non-null
// ---------------------------------------------------------------------------

/** Returns the associated client by ID (success). */
export function handleGetClienteAsociadoSuccess(cliente: ClienteTestData) {
  return http.get(`${CLIENTES_BASE}/:clienteId`, ({ params }) => {
    if (params.clienteId === cliente.id) {
      return HttpResponse.json(cliente);
    }
    return new HttpResponse(null, { status: 404 });
  });
}

/** Returns the associated client after a configurable delay (for loading-state tests). */
export function handleGetClienteAsociadoDelayed(cliente: ClienteTestData, delayMs = 200) {
  return http.get(`${CLIENTES_BASE}/:clienteId`, async ({ params }) => {
    await delay(delayMs);
    if (params.clienteId === cliente.id) {
      return HttpResponse.json(cliente);
    }
    return new HttpResponse(null, { status: 404 });
  });
}

/** Returns HTTP 500 for the client fetch — simulates backend failure on client lookup. */
export function handleGetClienteAsociadoError() {
  return http.get(`${CLIENTES_BASE}/:clienteId`, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
