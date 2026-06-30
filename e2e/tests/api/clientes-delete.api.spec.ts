/**
 * Story 2.5: Delete Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * Tests verify the DELETE /api/v1/clientes/{id} contract directly.
 *
 * Acceptance Criteria covered:
 *   AC2 — DELETE returns 204 No Content on success (FR27)
 *   AC2 — DELETE with non-existent id returns 404 Problem Details
 *   AC4 — After deletion, associated contacts have clienteId = null (FR25, DB ON DELETE SET NULL)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — DELETE /api/v1/clientes/{id} happy-path contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — DELETE /api/v1/clientes/{id} deletes client successfully', () => {
  let createdId: string | null = null;

  test.beforeEach(async ({ request }) => {
    // Create a client to delete in each test
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Delete Test ${Date.now()}`,
        nit: `D${Date.now().toString().slice(-8)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const body = await response.json();
    createdId = body.id ?? null;
  });

  test.afterEach(async ({ request }) => {
    if (createdId) {
      // Try cleanup in case test did not delete the client
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`).catch(() => null);
      createdId = null;
    }
  });

  test('should return 204 No Content when a valid existing client id is provided', async ({ request }) => {
    // GIVEN: An existing client id
    // WHEN: DELETE /api/v1/clientes/{id}
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`);

    // THEN: Response is 204 No Content (AC2 contract)
    expect(response.status()).toBe(204);

    // Mark as deleted so afterEach does not double-attempt
    createdId = null;
  });

  test('should return empty body on 204 response', async ({ request }) => {
    // GIVEN: An existing client
    // WHEN: DELETE /api/v1/clientes/{id}
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    expect(response.status()).toBe(204);

    // THEN: Body is empty (204 No Content — no body expected)
    const text = await response.text();
    expect(text).toBe('');

    createdId = null;
  });

  test('should no longer return the deleted client in GET /api/v1/clientes list (FR27)', async ({ request }) => {
    // GIVEN: An existing client
    const idToDelete = createdId!;

    // WHEN: DELETE is called
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${idToDelete}`);
    createdId = null;

    // THEN: Client does not appear in list (FR27 — immediate removal)
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const list = await listResponse.json() as Array<{ id: string }>;
    expect(list.find((c) => c.id === idToDelete)).toBeUndefined();
  });

  test('should return 404 for GET /api/v1/clientes/{id} after deletion', async ({ request }) => {
    // GIVEN: An existing client
    const idToDelete = createdId!;

    // WHEN: Client is deleted then fetched by id
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${idToDelete}`);
    createdId = null;

    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes/${idToDelete}`);

    // THEN: GET returns 404 (client no longer exists)
    expect(getResponse.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — DELETE /api/v1/clientes/{id} returns 404 for non-existent client
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — DELETE /api/v1/clientes/{id} returns 404 for non-existent client', () => {
  const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000';

  test('should return 404 when client id does not exist', async ({ request }) => {
    // GIVEN: A valid UUID that does not correspond to any client
    // WHEN: DELETE /api/v1/clientes/{nonexistent-id}
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/${NONEXISTENT_ID}`);

    // THEN: 404 Not Found (AC2 — NotFoundException)
    expect(response.status()).toBe(404);
  });

  test('should return Problem Details RFC 7807 format on 404', async ({ request }) => {
    // GIVEN: Non-existent id
    // WHEN: DELETE /api/v1/clientes/{nonexistent-id}
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/${NONEXISTENT_ID}`);
    expect(response.status()).toBe(404);

    // THEN: Body follows Problem Details RFC 7807
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/(json|problem\+json)/);
    const body = await response.json();
    expect(body.status).toBe(404);
  });

  test('should NOT expose stack trace in 404 response body (NFR6)', async ({ request }) => {
    // GIVEN: Non-existent id
    // WHEN: DELETE /api/v1/clientes/{nonexistent-id}
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/${NONEXISTENT_ID}`);
    const body = await response.json();

    // THEN: Body does not contain internal technical details (NFR6)
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toMatch(/stackTrace|exception|at System\.|at Microsoft\./i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Associated contacts become unassigned after client deletion (FR25)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Contacts become unassigned (clienteId = null) when client is deleted (FR25)', () => {
  let createdClienteId: string | null = null;
  let createdContactoId: string | null = null;

  test.beforeEach(async ({ request }) => {
    // Create a client
    const clienteResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Con Contactos ${Date.now()}`,
        nit: `C${Date.now().toString().slice(-8)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const cliente = await clienteResponse.json();
    createdClienteId = cliente.id ?? null;

    // Create a contact assigned to this client
    const contactoResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: `Contacto Test ${Date.now()}`,
        email: `contacto.delete.${Date.now()}@test.co`,
        cargo: 'Analista',
        telefono: '3101234567',
        clienteId: createdClienteId,
      },
    });
    const contacto = await contactoResponse.json();
    createdContactoId = contacto.id ?? null;
  });

  test.afterEach(async ({ request }) => {
    if (createdContactoId) {
      await request.delete(`${API_BASE_URL}/api/v1/contactos/${createdContactoId}`).catch(() => null);
      createdContactoId = null;
    }
    if (createdClienteId) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdClienteId}`).catch(() => null);
      createdClienteId = null;
    }
  });

  test('should set contacto.clienteId to null after client deletion (DB ON DELETE SET NULL)', async ({ request }) => {
    // GIVEN: Contact is assigned to a client
    const getContacto = await request.get(`${API_BASE_URL}/api/v1/contactos/${createdContactoId}`);
    const contactoBefore = await getContacto.json();
    expect(contactoBefore.clienteId).toBe(createdClienteId);

    // WHEN: Client is deleted
    const deleteResponse = await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdClienteId}`);
    expect(deleteResponse.status()).toBe(204);
    createdClienteId = null;

    // THEN: Contact still exists but clienteId is null (FR25 — ON DELETE SET NULL)
    const getAfter = await request.get(`${API_BASE_URL}/api/v1/contactos/${createdContactoId}`);
    expect(getAfter.status()).toBe(200);
    const contactoAfter = await getAfter.json();
    expect(contactoAfter.clienteId).toBeNull();
  });

  test('should keep contact data intact (nombre, email) after client deletion (AC4)', async ({ request }) => {
    // GIVEN: Contact has its own data
    const getContacto = await request.get(`${API_BASE_URL}/api/v1/contactos/${createdContactoId}`);
    const contactoBefore = await getContacto.json();
    const originalNombre = contactoBefore.nombre;
    const originalEmail = contactoBefore.email;

    // WHEN: Client is deleted
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdClienteId}`);
    createdClienteId = null;

    // THEN: Contact data remains unchanged (AC4 — contacts data intact)
    const getAfter = await request.get(`${API_BASE_URL}/api/v1/contactos/${createdContactoId}`);
    const contactoAfter = await getAfter.json();
    expect(contactoAfter.nombre).toBe(originalNombre);
    expect(contactoAfter.email).toBe(originalEmail);
  });

  test('should return client as deleted (404) while contact still exists (AC4)', async ({ request }) => {
    // GIVEN: Client and contact exist
    // WHEN: Client is deleted
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdClienteId}`);
    const idDeleted = createdClienteId;
    createdClienteId = null;

    // THEN: Client no longer exists (404)
    const clienteGet = await request.get(`${API_BASE_URL}/api/v1/clientes/${idDeleted}`);
    expect(clienteGet.status()).toBe(404);

    // AND: Contact still exists (200)
    const contactoGet = await request.get(`${API_BASE_URL}/api/v1/contactos/${createdContactoId}`);
    expect(contactoGet.status()).toBe(200);
  });
});
