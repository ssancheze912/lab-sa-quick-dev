/**
 * MSW 2 route handlers for GET /api/v1/contactos?sinCliente=true
 * Story 4.5 — Orphan Contacts Filter (ATDD RED phase)
 *
 * These handlers cover the sinCliente filter scenarios.
 * They extend the existing contactos.handlers.ts without modifying it.
 */

import { http, HttpResponse, delay } from 'msw';
import { createContacto, createContactos, type ContactoTestData } from '../../factories/contacto.factory';

const BASE = '/api/v1/contactos';

// ---------------------------------------------------------------------------
// Handler factories for sinCliente filter
// ---------------------------------------------------------------------------

/**
 * Returns only contacts with clienteId === null (orphans).
 * Intercepts GET /api/v1/contactos?sinCliente=true.
 */
export function handleGetContactosSinCliente(contactos: ContactoTestData[]) {
  return http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('sinCliente') === 'true') {
      return HttpResponse.json(contactos);
    }
    return HttpResponse.json(contactos);
  });
}

/**
 * Returns mixed contacts: some with clienteId, some null.
 * When sinCliente=true, returns only orphans.
 */
export function handleGetContactosMixed(
  orphans: ContactoTestData[],
  withCliente: ContactoTestData[]
) {
  return http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('sinCliente') === 'true') {
      return HttpResponse.json(orphans);
    }
    return HttpResponse.json([...orphans, ...withCliente]);
  });
}

/**
 * Returns empty array for sinCliente=true (all contacts have clients).
 */
export function handleGetContactosSinClienteEmpty() {
  return http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('sinCliente') === 'true') {
      return HttpResponse.json([]);
    }
    return HttpResponse.json(createContactos(3, { clienteId: 'some-client-id' }));
  });
}

/**
 * Returns HTTP 500 for any /api/v1/contactos request — for error state tests.
 */
export function handleGetContactosSinClienteError() {
  return http.get(BASE, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}

/**
 * Returns orphan contacts after a configurable delay — for loading state tests.
 */
export function handleGetContactosSinClienteDelayed(
  contactos: ContactoTestData[],
  delayMs = 200
) {
  return http.get(BASE, async () => {
    await delay(delayMs);
    return HttpResponse.json(contactos);
  });
}

// ---------------------------------------------------------------------------
// Factory helpers for orphan contacts
// ---------------------------------------------------------------------------

/** Create a contact with clienteId = null (orphan). */
export function createOrphanContacto(overrides: Partial<ContactoTestData> = {}): ContactoTestData {
  return createContacto({ clienteId: null, ...overrides });
}

/** Create N orphan contacts. */
export function createOrphanContactos(count: number): ContactoTestData[] {
  return createContactos(count, { clienteId: null });
}

/** Create a contact with a non-null clienteId (assigned). */
export function createAssignedContacto(
  clienteId = 'cliente-00000000-0000-0000-0000-000000000001',
  overrides: Partial<ContactoTestData> = {}
): ContactoTestData {
  return createContacto({ clienteId, ...overrides });
}
