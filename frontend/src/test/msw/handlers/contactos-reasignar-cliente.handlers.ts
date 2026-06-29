/**
 * MSW 2 route handlers for Story 4.6 — Reassign Contact to Different Client
 *
 * Covers:
 *   PUT /api/v1/contactos/:id/cliente  (reassign — contact already has a non-null clienteId)
 *   GET /api/v1/clientes               (list of clients for dialog selector)
 *   GET /api/v1/contactos/:id          (contact detail — updated after reassignment)
 *
 * These handlers are imported into individual tests as needed.
 */

import { http, HttpResponse, delay } from 'msw';
import type { ContactoTestData } from '../../factories/contacto.factory';
import type { ClienteTestData } from '../../factories/cliente.factory';

const CONTACTOS_BASE = '/api/v1/contactos';
const CLIENTES_BASE = '/api/v1/clientes';

// ---------------------------------------------------------------------------
// PUT /api/v1/contactos/:id/cliente — Reassign handlers
// ---------------------------------------------------------------------------

/**
 * Returns 200 OK with a ContactoDto where clienteId has been changed to the
 * value provided in the request body.
 */
export function handleReasignarClienteSuccess(contacto: ContactoTestData) {
  return http.put(`${CONTACTOS_BASE}/:contactoId/cliente`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, string | null>;
    return HttpResponse.json(
      {
        id: params.contactoId as string,
        nombre: contacto.nombre,
        cargo: contacto.cargo,
        telefono: contacto.telefono,
        email: contacto.email,
        clienteId: body.clienteId ?? null,
        createdAt: contacto.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  });
}

/**
 * Captures the request body and exposes the received clienteId so tests can
 * assert the correct value was sent.
 */
export function handleReasignarClienteCapture(
  contacto: ContactoTestData,
  captureRef: { clienteId: string | null }
) {
  return http.put(`${CONTACTOS_BASE}/:contactoId/cliente`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, string | null>;
    captureRef.clienteId = body.clienteId ?? null;
    return HttpResponse.json(
      {
        id: params.contactoId as string,
        nombre: contacto.nombre,
        cargo: contacto.cargo,
        telefono: contacto.telefono,
        email: contacto.email,
        clienteId: body.clienteId ?? null,
        createdAt: contacto.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  });
}

/** Returns 500 to simulate unexpected backend failure for reassign. */
export function handleReasignarClienteServerError() {
  return http.put(`${CONTACTOS_BASE}/:contactoId/cliente`, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}

/**
 * Returns 200 OK after a configurable delay (ms) — for isPending tests.
 */
export function handleReasignarClienteDelayed(
  contacto: ContactoTestData,
  delayMs = 300
) {
  return http.put(`${CONTACTOS_BASE}/:contactoId/cliente`, async ({ params, request }) => {
    await delay(delayMs);
    const body = (await request.json()) as Record<string, string | null>;
    return HttpResponse.json(
      {
        id: params.contactoId as string,
        nombre: contacto.nombre,
        cargo: contacto.cargo,
        telefono: contacto.telefono,
        email: contacto.email,
        clienteId: body.clienteId ?? null,
        createdAt: contacto.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  });
}

// ---------------------------------------------------------------------------
// GET /api/v1/contactos/:id — Contact detail with updated clienteId
// ---------------------------------------------------------------------------

/**
 * Returns a contacto with an arbitrary clienteId — used to set up a contact
 * that already has an existing association (needed for reassignment scenario).
 */
export function handleGetContactoWithExistingCliente(
  contacto: ContactoTestData,
  currentClienteId: string
) {
  return http.get(`${CONTACTOS_BASE}/:contactoId`, ({ params }) => {
    if (params.contactoId === contacto.id) {
      return HttpResponse.json({ ...contacto, clienteId: currentClienteId });
    }
    return new HttpResponse(null, { status: 404 });
  });
}

// ---------------------------------------------------------------------------
// GET /api/v1/clientes — Client list for dialog selector
// ---------------------------------------------------------------------------

/** Returns a list of clients for the reassign dialog selector. */
export function handleGetClientesForSelector(clientes: ClienteTestData[]) {
  return http.get(CLIENTES_BASE, () => HttpResponse.json(clientes));
}

/** Returns an empty client list. */
export function handleGetClientesForSelectorEmpty() {
  return http.get(CLIENTES_BASE, () => HttpResponse.json([]));
}
