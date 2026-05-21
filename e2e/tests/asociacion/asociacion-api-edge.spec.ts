import { test, expect } from '@playwright/test';

/**
 * Edge Case Tests — Story 4.1: API Integration — GET /api/v1/contactos?clienteId=
 *
 * Expands ATDD baseline (asociacion-api.spec.ts) with boundary and error-path coverage:
 *   - API-EDGE-01 [P1] Invalid UUID format in clienteId returns 400 (not 500)
 *   - API-EDGE-02 [P1] Valid UUID that does not match any client returns 200 with empty array (not 404)
 *   - API-EDGE-03 [P2] Response for a client with contacts is ordered by createdAt DESC
 *   - API-EDGE-04 [P2] Multiple concurrent requests for different clients return independent arrays
 *   - API-EDGE-05 [P2] clienteId param with extra whitespace / wrong case is rejected with 400 or handled gracefully
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 4.1 — API Edge Cases: GET /api/v1/contactos?clienteId=', () => {
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdContactoIds) {
      await request.delete(`${API_BASE_URL}/api/v1/contactos/${id}`).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdContactoIds.length = 0;
    createdClienteIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-EDGE-01 [P1]
  // Given a clienteId query param with an invalid UUID format (e.g., "not-a-uuid")
  // When GET /api/v1/contactos?clienteId=not-a-uuid is called
  // Then the response status is 400 (Bad Request) — NOT 500
  // AND the response body is Problem Details (no stack trace exposed — NFR6)
  // ---------------------------------------------------------------------------
  test('[P1] API-EDGE-01 — clienteId con formato UUID inválido retorna 400 sin stack trace', async ({ request }) => {
    // GIVEN — an invalid UUID format
    const invalidUUID = 'not-a-valid-uuid';

    // WHEN — GET with malformed clienteId
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${invalidUUID}`);

    // THEN — status is 400 (bad request), NOT 500 (server error)
    expect(response.status()).toBe(400);

    // AND — response body is Problem Details format (no stack trace)
    const body = await response.json();
    expect(typeof body).toBe('object');
    // NFR6: stack trace must not be exposed
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
    expect(body.innerException).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // API-EDGE-02 [P1]
  // Given a valid UUID v4 clienteId that does not correspond to any existing client
  // When GET /api/v1/contactos?clienteId={nonExistentUUID} is called
  // Then the response status is 200 OK (not 404 — query for contacts, client may not exist)
  // AND the body is an empty JSON array []
  // ---------------------------------------------------------------------------
  test('[P1] API-EDGE-02 — clienteId UUID válido pero inexistente retorna 200 con array vacío', async ({ request }) => {
    // GIVEN — a syntactically valid UUID that does not exist in the database
    const nonExistentClienteId = '00000000-0000-4000-8000-000000000099';

    // WHEN — GET /api/v1/contactos?clienteId={nonExistentId}
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${nonExistentClienteId}`);

    // THEN — 200 OK (not 404 — absence of contacts is not an error)
    expect(response.status()).toBe(200);

    // AND — empty array (no contacts for this "client")
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // API-EDGE-03 [P2]
  // Given a client with 3 contacts created at different times
  // When GET /api/v1/contactos?clienteId={id} is called
  // Then contacts are ordered by createdAt DESC (most recent first)
  // ---------------------------------------------------------------------------
  test('[P2] API-EDGE-03 — los contactos retornados están ordenados por createdAt DESC', async ({ request }) => {
    // GIVEN — Create a client
    const clienteResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Edge-03 ${Date.now()}`,
        nit: `77${Date.now().toString().slice(-9)}`,
        ciudad: 'Cali',
      },
    });
    expect(clienteResponse.status()).toBe(201);
    const cliente = await clienteResponse.json();
    createdClienteIds.push(cliente.id);

    // AND — Create 3 contacts sequentially
    const contactIds: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const resp = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
        data: {
          nombre: `Contacto Edge03-${i} ${Date.now()}`,
          email: `edge03.${i}.${Date.now()}@ejemplo.co`,
          clienteId: cliente.id,
        },
      });
      expect(resp.status()).toBe(201);
      const c = await resp.json();
      contactIds.push(c.id);
      createdContactoIds.push(c.id);
    }

    // WHEN — GET contacts for this client
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${cliente.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(3);

    // THEN — verify ordering: each createdAt must be >= the next (DESC order)
    for (let i = 0; i < body.length - 1; i++) {
      const current = new Date(body[i].createdAt).getTime();
      const next = new Date(body[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  // ---------------------------------------------------------------------------
  // API-EDGE-04 [P2]
  // Given two clients each with distinct contacts
  // When both GET /api/v1/contactos?clienteId={idA} and ?clienteId={idB} are called concurrently
  // Then each response contains ONLY the contacts for its respective client (no cross-contamination)
  // ---------------------------------------------------------------------------
  test('[P2] API-EDGE-04 — peticiones concurrentes para distintos clientes retornan arrays independientes', async ({ request }) => {
    // GIVEN — Create two clients
    const [clienteAResp, clienteBResp] = await Promise.all([
      request.post(`${API_BASE_URL}/api/v1/clientes`, {
        data: {
          nombre: `Cliente A Edge04 ${Date.now()}`,
          nit: `76${Date.now().toString().slice(-9)}`,
          ciudad: 'Bogotá',
        },
      }),
      request.post(`${API_BASE_URL}/api/v1/clientes`, {
        data: {
          nombre: `Cliente B Edge04 ${Date.now()}`,
          nit: `75${Date.now().toString().slice(-9)}`,
          ciudad: 'Bogotá',
        },
      }),
    ]);
    expect(clienteAResp.status()).toBe(201);
    expect(clienteBResp.status()).toBe(201);
    const clienteA = await clienteAResp.json();
    const clienteB = await clienteBResp.json();
    createdClienteIds.push(clienteA.id, clienteB.id);

    // AND — Create 2 contacts for A and 1 for B concurrently
    const [c1Resp, c2Resp, c3Resp] = await Promise.all([
      request.post(`${API_BASE_URL}/api/v1/contactos`, {
        data: {
          nombre: `Contacto A1 Edge04 ${Date.now()}`,
          email: `a1.edge04.${Date.now()}@ejemplo.co`,
          clienteId: clienteA.id,
        },
      }),
      request.post(`${API_BASE_URL}/api/v1/contactos`, {
        data: {
          nombre: `Contacto A2 Edge04 ${Date.now()}`,
          email: `a2.edge04.${Date.now()}@ejemplo.co`,
          clienteId: clienteA.id,
        },
      }),
      request.post(`${API_BASE_URL}/api/v1/contactos`, {
        data: {
          nombre: `Contacto B1 Edge04 ${Date.now()}`,
          email: `b1.edge04.${Date.now()}@ejemplo.co`,
          clienteId: clienteB.id,
        },
      }),
    ]);
    expect(c1Resp.status()).toBe(201);
    expect(c2Resp.status()).toBe(201);
    expect(c3Resp.status()).toBe(201);
    const c1 = await c1Resp.json();
    const c2 = await c2Resp.json();
    const c3 = await c3Resp.json();
    createdContactoIds.push(c1.id, c2.id, c3.id);

    // WHEN — Concurrent requests for both clients
    const [responseA, responseB] = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${clienteA.id}`),
      request.get(`${API_BASE_URL}/api/v1/contactos?clienteId=${clienteB.id}`),
    ]);

    expect(responseA.status()).toBe(200);
    expect(responseB.status()).toBe(200);

    const bodyA = await responseA.json();
    const bodyB = await responseB.json();

    // THEN — A has 2 contacts, B has 1 contact
    expect(bodyA).toHaveLength(2);
    expect(bodyB).toHaveLength(1);

    // AND — No cross-contamination
    const idsA = bodyA.map((c: { id: string }) => c.id);
    const idsB = bodyB.map((c: { id: string }) => c.id);
    expect(idsA).not.toContain(c3.id);  // B's contact not in A
    expect(idsB).not.toContain(c1.id);  // A's contacts not in B
    expect(idsB).not.toContain(c2.id);

    // AND — all contacts in A have clienteId === clienteA.id
    for (const c of bodyA) {
      expect(c.clienteId).toBe(clienteA.id);
    }
    // AND — all contacts in B have clienteId === clienteB.id
    for (const c of bodyB) {
      expect(c.clienteId).toBe(clienteB.id);
    }
  });

  // ---------------------------------------------------------------------------
  // API-EDGE-05 [P2]
  // Given the backend receives GET /api/v1/contactos without any clienteId param
  // When the request is issued (no query param at all)
  // Then the response returns the global contacts list (existing behavior unchanged)
  // AND the existing global contacts endpoint is NOT broken by the new clienteId param
  // ---------------------------------------------------------------------------
  test('[P2] API-EDGE-05 — GET /api/v1/contactos sin clienteId retorna la lista global (backward compatibility)', async ({ request }) => {
    // GIVEN — Create a client and a contact
    const clienteResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Edge05 ${Date.now()}`,
        nit: `74${Date.now().toString().slice(-9)}`,
        ciudad: 'Cali',
      },
    });
    expect(clienteResponse.status()).toBe(201);
    const cliente = await clienteResponse.json();
    createdClienteIds.push(cliente.id);

    const contactoResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
      data: {
        nombre: `Contacto Edge05 ${Date.now()}`,
        email: `edge05.${Date.now()}@ejemplo.co`,
        clienteId: cliente.id,
      },
    });
    expect(contactoResponse.status()).toBe(201);
    const contacto = await contactoResponse.json();
    createdContactoIds.push(contacto.id);

    // WHEN — GET /api/v1/contactos with NO query params (global list endpoint)
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN — 200 OK, returns array (global list, not filtered)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    // AND — the recently created contact is present in the global list
    const ids = body.map((c: { id: string }) => c.id);
    expect(ids).toContain(contacto.id);
  });
});
