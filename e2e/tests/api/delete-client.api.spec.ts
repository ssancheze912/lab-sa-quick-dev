/**
 * API Tests — Story 2.5: DELETE /api/v1/clientes/{id} contract
 * RED PHASE — Tests are intentionally FAILING until backend implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — DELETE /api/v1/clientes/{id} returns 204 No Content on successful deletion
 *   AC4 — Deletion of a client with associated contacts leaves contacts with cliente_id = NULL (DB-level)
 *   AC6 — DELETE /api/v1/clientes/{id} returns Problem Details RFC 7807 on unexpected error (non-404)
 *   (Implicit) DELETE /api/v1/clientes/{id} returns 404 Not Found when client ID does not exist
 *   (Implicit) DELETE /api/v1/clientes/{id} returns 400 Bad Request when id is not a valid UUID
 *
 * Uses Playwright's APIRequestContext (no browser). Requires:
 *   - Backend running on http://localhost:5000
 *   - EF Core migration applied (clientes + contactos tables with ON DELETE SET NULL FK)
 *   - No authentication required (MVP has no auth layer)
 */

import { test, expect } from '@playwright/test';
import { createClientePayload } from '../../support/factories/cliente.factory';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/clientes`;
const CONTACTOS_ENDPOINT = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/clientes/{id} — 204 No Content (AC2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DELETE /api/v1/clientes/{id} — 204 No Content response contract', () => {
  test('should return HTTP 204 when deleting an existing client', async ({ request }) => {
    // GIVEN: A client is created first
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // WHEN: DELETE /api/v1/clientes/{id} is called
    const response = await request.delete(`${ENDPOINT}/${created.id}`);

    // THEN: HTTP 204 No Content
    expect(response.status()).toBe(204);
  });

  test('should return an empty body on 204 response', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    // WHEN: DELETE is called
    const response = await request.delete(`${ENDPOINT}/${created.id}`);

    // THEN: Body is empty (No Content)
    const bodyText = await response.text();
    expect(bodyText).toBe('');
  });

  test('should remove the client from the system — GET /api/v1/clientes/{id} returns 404 after DELETE', async ({ request }) => {
    // GIVEN: A client is created
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    // WHEN: DELETE is called followed by GET
    const deleteResponse = await request.delete(`${ENDPOINT}/${created.id}`);
    expect(deleteResponse.status()).toBe(204);
    const getResponse = await request.get(`${ENDPOINT}/${created.id}`);

    // THEN: GET returns 404 (client no longer exists)
    expect(getResponse.status()).toBe(404);
  });

  test('should remove the client from the list — GET /api/v1/clientes no longer contains deleted client', async ({ request }) => {
    // GIVEN: A client is created
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    // WHEN: DELETE is called followed by GET list
    const deleteResponse = await request.delete(`${ENDPOINT}/${created.id}`);
    expect(deleteResponse.status()).toBe(204);
    const listResponse = await request.get(ENDPOINT);
    const list = await listResponse.json();

    // THEN: Deleted client is NOT in the list
    const ids = list.map((c: { id: string }) => c.id);
    expect(ids).not.toContain(created.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/clientes/{id} — 404 Not Found: non-existent client
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DELETE /api/v1/clientes/{id} — 404 Not Found: non-existent client', () => {
  test('should return HTTP 404 when the client ID does not exist', async ({ request }) => {
    // GIVEN: A UUID that does not correspond to any client
    const nonExistentId = '00000000-0000-0000-0000-111111111111';

    // WHEN: DELETE is called with a non-existent ID
    const response = await request.delete(`${ENDPOINT}/${nonExistentId}`);

    // THEN: HTTP 404 Not Found
    expect(response.status()).toBe(404);
  });

  test('should return Problem Details RFC 7807 format on 404 for DELETE', async ({ request }) => {
    // GIVEN: A UUID that does not correspond to any client
    const nonExistentId = '00000000-0000-0000-0000-222222222222';

    // WHEN: DELETE is called
    const response = await request.delete(`${ENDPOINT}/${nonExistentId}`);
    const body = await response.json();

    // THEN: Problem Details with status 404 and title
    expect(body.status).toBe(404);
    expect(body.title).toBeDefined();
  });

  test('should return HTTP 400 when the id path parameter is not a valid UUID', async ({ request }) => {
    // GIVEN: A malformed (non-UUID) id
    const malformedId = 'not-a-valid-uuid';

    // WHEN: DELETE is called with a malformed id
    const response = await request.delete(`${ENDPOINT}/${malformedId}`);

    // THEN: HTTP 400 Bad Request (malformed route param)
    expect(response.status()).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ON DELETE SET NULL: contacts are unassigned when client is deleted
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DELETE /api/v1/clientes/{id} — AC4: contacts become unassigned (ON DELETE SET NULL)', () => {
  test('should set cliente_id to NULL on associated contacts when client is deleted', async ({ request }) => {
    // GIVEN: A client is created with at least one associated contact
    const createClienteResponse = await request.post(ENDPOINT, {
      data: createClientePayload({ nombre: 'Cliente Con Contactos Integración SA' }),
    });
    expect(createClienteResponse.status()).toBe(201);
    const cliente = await createClienteResponse.json();

    // Create a contact linked to this client
    const createContactoResponse = await request.post(CONTACTOS_ENDPOINT, {
      data: {
        nombre: 'Contacto Integración Uno',
        email: `contacto.${Date.now()}@test.com`,
        clienteId: cliente.id,
      },
    });
    expect(createContactoResponse.status()).toBe(201);
    const contacto = await createContactoResponse.json();

    try {
      // WHEN: The client is deleted
      const deleteResponse = await request.delete(`${ENDPOINT}/${cliente.id}`);
      expect(deleteResponse.status()).toBe(204);

      // THEN: The contact still exists in the system
      const getContactoResponse = await request.get(`${CONTACTOS_ENDPOINT}/${contacto.id}`);
      expect(getContactoResponse.status()).toBe(200);

      // AND: The contact's clienteId is now NULL (unassigned)
      const contactoData = await getContactoResponse.json();
      expect(contactoData.clienteId).toBeNull();
    } finally {
      // Cleanup: delete the contact if the test fails before deletion
      await request.delete(`${CONTACTOS_ENDPOINT}/${contacto.id}`);
    }
  });

  test('should preserve all contact data fields after client deletion (only clienteId becomes NULL)', async ({ request }) => {
    // GIVEN: A client and contact exist
    const createClienteResponse = await request.post(ENDPOINT, {
      data: createClientePayload({ nombre: 'Cliente Preserve Contacto SA' }),
    });
    const cliente = await createClienteResponse.json();

    const contactEmail = `preserve.${Date.now()}@test.com`;
    const createContactoResponse = await request.post(CONTACTOS_ENDPOINT, {
      data: {
        nombre: 'Contacto Datos Intactos',
        email: contactEmail,
        clienteId: cliente.id,
      },
    });
    expect(createContactoResponse.status()).toBe(201);
    const contacto = await createContactoResponse.json();

    try {
      // WHEN: The client is deleted
      const deleteResponse = await request.delete(`${ENDPOINT}/${cliente.id}`);
      expect(deleteResponse.status()).toBe(204);

      // THEN: Contact still exists with all original fields intact
      const getContactoResponse = await request.get(`${CONTACTOS_ENDPOINT}/${contacto.id}`);
      expect(getContactoResponse.status()).toBe(200);
      const contactoData = await getContactoResponse.json();

      expect(contactoData.nombre).toBe('Contacto Datos Intactos');
      expect(contactoData.email).toBe(contactEmail);
      expect(contactoData.id).toBe(contacto.id);
      // clienteId is NULL after deletion
      expect(contactoData.clienteId).toBeNull();
    } finally {
      await request.delete(`${CONTACTOS_ENDPOINT}/${contacto.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Error response: Problem Details RFC 7807 without stack traces
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DELETE /api/v1/clientes/{id} — AC6: error responses do not expose technical details', () => {
  test('should NOT expose stack trace in 404 response body when client ID does not exist', async ({ request }) => {
    // GIVEN: A UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-333333333333';

    // WHEN: DELETE returns 404
    const response = await request.delete(`${ENDPOINT}/${nonExistentId}`);
    const body = await response.json();
    const responseText = JSON.stringify(body);

    // THEN: No stack trace indicators in the response
    expect(responseText).not.toContain('StackTrace');
    expect(responseText).not.toContain('at System.');
    expect(responseText).not.toContain('Exception');
  });

  test('should return Problem Details format (status + title) on 404 — no raw exception message', async ({ request }) => {
    // GIVEN: A UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-444444444444';

    // WHEN: DELETE returns 404
    const response = await request.delete(`${ENDPOINT}/${nonExistentId}`);
    const body = await response.json();

    // THEN: Response follows Problem Details RFC 7807 structure
    expect(body.status).toBe(404);
    expect(body.title).toBeDefined();
    expect(typeof body.title).toBe('string');
    // detail should be user-friendly (if present)
    if (body.detail) {
      expect(typeof body.detail).toBe('string');
    }
  });

  test('should allow deleting the same client ID only once — second DELETE returns 404', async ({ request }) => {
    // GIVEN: A client is created and then deleted
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();
    const firstDelete = await request.delete(`${ENDPOINT}/${created.id}`);
    expect(firstDelete.status()).toBe(204);

    // WHEN: The same DELETE is called again
    const secondDelete = await request.delete(`${ENDPOINT}/${created.id}`);

    // THEN: 404 Not Found (idempotent delete behavior: second call reflects resource gone)
    expect(secondDelete.status()).toBe(404);
  });
});
