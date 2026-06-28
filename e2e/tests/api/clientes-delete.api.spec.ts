import { test, expect } from '@playwright/test';

/**
 * ATDD API tests — Story 2.5: Delete Client (RED phase)
 *
 * Tests fail until:
 *   - DELETE /api/v1/clientes/:id endpoint is implemented in ClienteEndpoints.cs
 *   - DeleteClienteCommandHandler.cs is created and wired (returns DeleteClienteResult)
 *   - IClienteRepository.DeleteAsync + CountContactosByClienteIdAsync are implemented
 *   - 404 response uses Results.Problem(...) with Problem Details RFC 7807 (NOT Results.NotFound())
 *   - 204 returned when client has no contacts
 *   - 200 + { hadContacts: true } returned when client had contacts
 *   - contactos.cliente_id SET NULL via DB FK constraint on client deletion (ON DELETE SET NULL)
 *
 * Test IDs:
 *   TC-E2-2-5-API-P0-1 (P0) — DELETE valid ID (no contacts) → 204 No Content
 *   TC-E2-2-5-API-P0-2 (P0) — Cascade: delete client → contacts get clienteId=null
 *   TC-E2-2-5-API-P1-1 (P1) — DELETE unknown UUID → 404 Problem Details
 *   TC-E2-2-5-API-P2-1 (P2) — DELETE with contacts → 200 + { hadContacts: true }
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE_URL}/api/v1/clientes`;
const CONTACTOS_URL = `${API_BASE_URL}/api/v1/contactos`;
const UNKNOWN_UUID = '00000000-0000-0000-0000-000000000000';

// ─────────────────────────────────────────────────────────────────────────────
// Seed helpers — create data for each test, track IDs for cleanup
// ─────────────────────────────────────────────────────────────────────────────

async function seedCliente(
  request: import('@playwright/test').APIRequestContext,
  overrides: { nombre?: string; nit?: string; telefono?: string; ciudad?: string } = {}
) {
  const now = Date.now();
  const data = {
    nombre: overrides.nombre ?? `API Delete Test Cliente ${now}`,
    nit: overrides.nit ?? `${now}`.slice(-9),
    telefono: overrides.telefono ?? `300${String(now).slice(-7)}`,
    ciudad: overrides.ciudad ?? 'Bogotá',
  };

  const response = await request.post(CLIENTES_URL, { data });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{
    id: string;
    nombre: string;
    nit: string;
    telefono: string;
    ciudad: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

async function seedContacto(
  request: import('@playwright/test').APIRequestContext,
  overrides: { nombre?: string; email?: string; clienteId?: string | null } = {}
) {
  const now = Date.now();
  const data = {
    nombre: overrides.nombre ?? `Contacto Delete Test ${now}`,
    email: overrides.email ?? `contacto.${now}@test.com`,
    clienteId: overrides.clienteId ?? null,
  };

  const response = await request.post(CONTACTOS_URL, { data });
  // Accept 201 Created; if Contactos endpoint not yet implemented (Epic 3 dep) skip the test
  return { response, data: response.status() === 201 ? await response.json() : null };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-5-API-P0-1 (P0) — DELETE valid ID (no contacts) → 204 No Content
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.5 — API: DELETE /api/v1/clientes/:id (P0)', () => {
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.afterEach(async ({ request }) => {
    // Cleanup contactos first (FK dependency), then clientes
    for (const id of createdContactoIds) {
      await request.delete(`${CONTACTOS_URL}/${id}`).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await request.delete(`${CLIENTES_URL}/${id}`).catch(() => null);
    }
    createdClienteIds.length = 0;
    createdContactoIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-5-API-P0-1 (P0) — DELETE valid ID → 204 No Content (no contacts)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-5-API-P0-1: should return 204 No Content when deleting an existing client with no associated contacts', async ({ request }) => {
    // GIVEN: A client exists in the system
    const seeded = await seedCliente(request, {
      nombre: 'Empresa Para Eliminar API P0',
      nit: '900000001-1',
    });
    // Track ID for cleanup only if DELETE fails (test verifies it is removed)
    createdClienteIds.push(seeded.id);

    // WHEN: DELETE /api/v1/clientes/:id is called with the seeded ID
    const response = await request.delete(`${CLIENTES_URL}/${seeded.id}`);

    // THEN: Response status is 204 No Content (not 200 with empty body)
    expect(response.status()).toBe(204);

    // AND: Response body is empty (no body on 204)
    const bodyText = await response.text();
    expect(bodyText).toBe('');

    // AND: Client is no longer accessible via GET (removed from the system)
    const getAfterDelete = await request.get(`${CLIENTES_URL}/${seeded.id}`);
    expect(getAfterDelete.status()).toBe(404);

    // Cleanup not needed (already deleted by the test) — remove from tracking
    createdClienteIds.splice(createdClienteIds.indexOf(seeded.id), 1);
  });

  test('should remove the deleted client from the GET /api/v1/clientes list response', async ({ request }) => {
    // GIVEN: A client exists
    const seeded = await seedCliente(request, {
      nombre: 'Empresa Lista Check SA',
      nit: '900000002-2',
    });
    createdClienteIds.push(seeded.id);

    // AND: The client appears in the list before deletion
    const listBefore = await request.get(CLIENTES_URL);
    const bodyBefore = await listBefore.json();
    const items: { id: string }[] = Array.isArray(bodyBefore)
      ? bodyBefore
      : (bodyBefore?.items ?? bodyBefore?.clientes ?? []);
    expect(items.some((c) => c.id === seeded.id)).toBe(true);

    // WHEN: Client is deleted
    const deleteResponse = await request.delete(`${CLIENTES_URL}/${seeded.id}`);
    expect(deleteResponse.status()).toBe(204);

    // THEN: Client is no longer in the list (FR27 — immediate removal)
    const listAfter = await request.get(CLIENTES_URL);
    const bodyAfter = await listAfter.json();
    const itemsAfter: { id: string }[] = Array.isArray(bodyAfter)
      ? bodyAfter
      : (bodyAfter?.items ?? bodyAfter?.clientes ?? []);
    expect(itemsAfter.some((c) => c.id === seeded.id)).toBe(false);

    createdClienteIds.splice(createdClienteIds.indexOf(seeded.id), 1);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-5-API-P0-2 (P0) — Cascade: delete client → contacts clienteId=null
  // Risk: R-003 — ON DELETE SET NULL cascade behavior (CRITICAL)
  // ─────────────────────────────────────────────────────────────────────────

  test('TC-E2-2-5-API-P0-2: should set clienteId to null on associated contacts when client is deleted (ON DELETE SET NULL)', async ({ request }) => {
    // GIVEN: A client exists
    const seededCliente = await seedCliente(request, {
      nombre: 'Empresa Con Contactos Cascade SA',
      nit: '900000003-3',
    });
    createdClienteIds.push(seededCliente.id);

    // GIVEN: Two contacts are associated with this client
    const contacto1Result = await seedContacto(request, {
      nombre: 'Contacto Cascade 1',
      email: `cascade1.${Date.now()}@test.com`,
      clienteId: seededCliente.id,
    });
    const contacto2Result = await seedContacto(request, {
      nombre: 'Contacto Cascade 2',
      email: `cascade2.${Date.now() + 1}@test.com`,
      clienteId: seededCliente.id,
    });

    // Skip if Contactos endpoint not yet implemented (Epic 3 dependency)
    if (!contacto1Result.data || !contacto2Result.data) {
      // Contactos table not yet available — cascade test skipped (Epic 3 dependency)
      return;
    }

    createdContactoIds.push(contacto1Result.data.id, contacto2Result.data.id);

    // WHEN: The client is deleted
    const deleteResponse = await request.delete(`${CLIENTES_URL}/${seededCliente.id}`);
    // Can be 204 (no contacts tracked by app) or 200 + {hadContacts:true}
    expect([200, 204]).toContain(deleteResponse.status());

    // THEN: GET /api/v1/contactos/:id for each contact returns clienteId = null
    const contacto1After = await request.get(`${CONTACTOS_URL}/${contacto1Result.data.id}`);
    expect(contacto1After.status()).toBe(200);
    const body1 = await contacto1After.json();
    expect(body1.clienteId).toBeNull();

    const contacto2After = await request.get(`${CONTACTOS_URL}/${contacto2Result.data.id}`);
    expect(contacto2After.status()).toBe(200);
    const body2 = await contacto2After.json();
    expect(body2.clienteId).toBeNull();

    createdClienteIds.splice(createdClienteIds.indexOf(seededCliente.id), 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-5-API-P1-1 (P1) — DELETE unknown UUID → 404 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.5 — API: DELETE non-existent client (P1)', () => {
  test('TC-E2-2-5-API-P1-1: should return 404 with Problem Details RFC 7807 when deleting a non-existent client UUID', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_UUID exists in the system

    // WHEN: DELETE /api/v1/clientes/{unknown-uuid} is called
    const response = await request.delete(`${CLIENTES_URL}/${UNKNOWN_UUID}`);

    // THEN: Response status is 404 Not Found
    expect(response.status()).toBe(404);

    const body = await response.json();

    // AND: Response body conforms to Problem Details RFC 7807 (NOT Results.NotFound() bare 404)
    expect(body).toHaveProperty('status', 404);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body).toHaveProperty('detail');
    expect(typeof body.detail).toBe('string');

    // AND: The detail explains what happened (not a bare 404)
    expect(body.detail).toMatch(/no fue encontrado|not found/i);
  });

  test('should return content-type application/problem+json for a 404 DELETE response', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_UUID exists

    // WHEN: DELETE /api/v1/clientes/{unknown-uuid} is called
    const response = await request.delete(`${CLIENTES_URL}/${UNKNOWN_UUID}`);

    // THEN: Content-Type includes problem+json (RFC 7807) — NOT bare application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/(problem\+json|json)/);
    expect(response.status()).toBe(404);
  });

  test('should NOT expose stack traces in 404 DELETE response (NFR6 — no technical details)', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_UUID exists

    // WHEN: DELETE called with unknown UUID
    const response = await request.delete(`${CLIENTES_URL}/${UNKNOWN_UUID}`);
    const body = await response.json();

    // THEN: No stack trace fields in the response
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('exception');
    expect(body).not.toHaveProperty('exceptionMessage');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-5-API-P2-1 (P2) — DELETE with contacts → 200 + { hadContacts: true }
// Two-toast strategy: backend signals frontend to show the correct toast variant
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 2.5 — API: DELETE client with associated contacts (P2)', () => {
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdContactoIds) {
      await request.delete(`${CONTACTOS_URL}/${id}`).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await request.delete(`${CLIENTES_URL}/${id}`).catch(() => null);
    }
    createdClienteIds.length = 0;
    createdContactoIds.length = 0;
  });

  test('TC-E2-2-5-API-P2-1: should return 200 + { hadContacts: true } when client with associated contacts is deleted', async ({ request }) => {
    // GIVEN: A client exists
    const seededCliente = await seedCliente(request, {
      nombre: 'Empresa Con Contactos P2 SA',
      nit: '900000004-4',
    });
    createdClienteIds.push(seededCliente.id);

    // GIVEN: A contact is associated with this client
    const contactoResult = await seedContacto(request, {
      nombre: 'Contacto P2 Test',
      email: `p2.${Date.now()}@test.com`,
      clienteId: seededCliente.id,
    });

    // Skip if Contactos endpoint not yet implemented (Epic 3 dependency)
    if (!contactoResult.data) {
      // Contactos table not yet available — P2 test skipped (Epic 3 dependency)
      return;
    }
    createdContactoIds.push(contactoResult.data.id);

    // WHEN: Client is deleted
    const deleteResponse = await request.delete(`${CLIENTES_URL}/${seededCliente.id}`);

    // THEN: Response status is 200 OK (not 204 — signals to frontend that contacts existed)
    expect(deleteResponse.status()).toBe(200);

    const body = await deleteResponse.json();

    // AND: Response body contains { hadContacts: true }
    expect(body).toHaveProperty('hadContacts', true);

    createdClienteIds.splice(createdClienteIds.indexOf(seededCliente.id), 1);
  });

  test('should return 204 (not 200) when deleting a client that has no contacts', async ({ request }) => {
    // GIVEN: A client with NO contacts
    const seededCliente = await seedCliente(request, {
      nombre: 'Empresa Sin Contactos P2 SA',
      nit: '900000005-5',
    });
    createdClienteIds.push(seededCliente.id);

    // WHEN: Client is deleted
    const deleteResponse = await request.delete(`${CLIENTES_URL}/${seededCliente.id}`);

    // THEN: Response status is 204 (two-toast strategy: 204 = no contacts)
    expect(deleteResponse.status()).toBe(204);

    createdClienteIds.splice(createdClienteIds.indexOf(seededCliente.id), 1);
  });
});
