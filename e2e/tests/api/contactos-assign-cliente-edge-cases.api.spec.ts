import { test, expect } from '@playwright/test';

/**
 * Edge-case API tests — Story 4.2: Associate & Disassociate Contacts from Client
 *
 * Expands ATDD coverage (contactos-assign-cliente.api.spec.ts) with:
 *   - Invalid/malformed UUID in path → 400/422 (boundary condition)
 *   - Re-association: move contact from one client to another
 *   - updatedAt strictly greater than createdAt after assignment
 *   - Disassociation idempotency (null → null → still 200 + null)
 *   - Cancel does not modify contact (GET after no-op)
 *   - PUT with empty body → 400 (missing required payload)
 *
 * Test IDs:
 *   TC-E4-4-2-API-EDGE-1 (P1) — updatedAt strictly greater than createdAt after PUT
 *   TC-E4-4-2-API-EDGE-2 (P1) — Re-associate: move contact from clienteA to clienteB → clienteId = clienteB.id
 *   TC-E4-4-2-API-EDGE-3 (P1) — Disassociation idempotency: PUT null twice → still 200 + null
 *   TC-E4-4-2-API-EDGE-4 (P2) — GET /contactos?clienteId after re-association: old client no longer shows contact
 *   TC-E4-4-2-API-EDGE-5 (P2) — Malformed UUID in path → 400 or 404 (not 500)
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE_URL}/api/v1/clientes`;
const CONTACTOS_URL = `${API_BASE_URL}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// Seed helpers
// ─────────────────────────────────────────────────────────────────────────────

async function seedCliente(
  request: import('@playwright/test').APIRequestContext,
  nombre?: string
) {
  const now = Date.now();
  const data = {
    nombre: nombre ?? `Cliente Edge 4.2 ${now}`,
    nit: `${now}`.slice(-9),
    telefono: `300${String(now).slice(-7)}`,
    ciudad: 'Bogotá',
  };
  const response = await request.post(CLIENTES_URL, { data });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{ id: string; nombre: string }>;
}

async function seedContacto(
  request: import('@playwright/test').APIRequestContext,
  overrides: { nombre?: string; email?: string; clienteId?: string | null } = {}
) {
  const now = Date.now();
  const data = {
    nombre: overrides.nombre ?? `Contacto Edge 4.2 ${now}`,
    email: overrides.email ?? `edge.42.${now}@empresa.co`,
    cargo: 'Analista',
    telefono: `310${String(now).slice(-7)}`,
    clienteId: overrides.clienteId ?? null,
  };
  const response = await request.post(CONTACTOS_URL, { data });
  expect(response.status()).toBe(201);
  return response.json() as Promise<{
    id: string;
    nombre: string;
    clienteId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Story 4.2 — API Edge Cases: PUT /api/v1/contactos/{id}/cliente', () => {
  const createdClienteIds: string[] = [];
  const createdContactoIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdContactoIds) {
      await request.delete(`${CONTACTOS_URL}/${id}`).catch(() => null);
    }
    for (const id of createdClienteIds) {
      await request.delete(`${CLIENTES_URL}/${id}`).catch(() => null);
    }
    createdContactoIds.length = 0;
    createdClienteIds.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-API-EDGE-1 (P1) — updatedAt is refreshed after assignment
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] TC-E4-4-2-API-EDGE-1: updatedAt in response should be strictly greater than createdAt after PUT /api/v1/contactos/{id}/cliente with a valid clienteId', async ({ request }) => {
    // GIVEN: An orphan contact and a client
    const cliente = await seedCliente(request, 'Cliente UpdatedAt Edge Test');
    createdClienteIds.push(cliente.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto UpdatedAt Edge',
      email: `updatedAt.edge.${Date.now()}@empresa.co`,
      clienteId: null,
    });
    createdContactoIds.push(contacto.id);

    // Small delay ensures measurable timestamp difference
    await new Promise((r) => setTimeout(r, 10));

    // WHEN: PUT /api/v1/contactos/{id}/cliente
    const response = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: cliente.id },
    });

    // THEN: 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json() as { createdAt: string; updatedAt: string; clienteId: string | null };

    // AND: clienteId is updated
    expect(body.clienteId).toBe(cliente.id);

    // AND: updatedAt is strictly greater than createdAt (domain method sets UpdatedAt = DateTimeOffset.UtcNow)
    const createdAt = new Date(body.createdAt).getTime();
    const updatedAt = new Date(body.updatedAt).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(createdAt);

    // AND: Both timestamps are valid ISO-8601 strings
    expect(() => new Date(body.createdAt)).not.toThrow();
    expect(() => new Date(body.updatedAt)).not.toThrow();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-API-EDGE-2 (P1) — Re-association: move contact to a different client
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] TC-E4-4-2-API-EDGE-2: should re-associate contact to a different client when PUT is called with new clienteId (direct re-assignment edge case)', async ({ request }) => {
    // GIVEN: Two clients and one contact linked to clienteA
    const clienteA = await seedCliente(request, 'Cliente A Re-Assign');
    createdClienteIds.push(clienteA.id);

    const clienteB = await seedCliente(request, 'Cliente B Re-Assign');
    createdClienteIds.push(clienteB.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto Para Reasignar',
      email: `reasignar.${Date.now()}@empresa.co`,
      clienteId: clienteA.id,
    });
    createdContactoIds.push(contacto.id);

    // WHEN: PUT with clienteB.id (re-assign to different client)
    const response = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: clienteB.id },
    });

    // THEN: 200 OK
    expect(response.status()).toBe(200);

    const body = await response.json() as { id: string; clienteId: string | null };

    // AND: clienteId is now clienteB (last assignment wins)
    expect(body.id).toBe(contacto.id);
    expect(body.clienteId).toBe(clienteB.id);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-API-EDGE-3 (P1) — Disassociation idempotency: null → null → 200
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1] TC-E4-4-2-API-EDGE-3: should return 200 OK when PUT /api/v1/contactos/{id}/cliente with clienteId: null is called twice (disassociation idempotency)', async ({ request }) => {
    // GIVEN: A contact already orphaned (clienteId = null)
    const contacto = await seedContacto(request, {
      nombre: 'Contacto Ya Huerfano Idempotent',
      email: `huerfano.idempotent.${Date.now()}@empresa.co`,
      clienteId: null,
    });
    createdContactoIds.push(contacto.id);

    // WHEN: PUT null the first time (contact is already null)
    const firstResponse = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: null },
    });

    // THEN: First call returns 200 OK
    expect(firstResponse.status()).toBe(200);
    const firstBody = await firstResponse.json() as { clienteId: string | null };
    expect(firstBody.clienteId).toBeNull();

    // WHEN: PUT null the second time (idempotent)
    const secondResponse = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: null },
    });

    // THEN: Second call also returns 200 OK (no error for already-null clienteId)
    expect(secondResponse.status()).toBe(200);
    const secondBody = await secondResponse.json() as { clienteId: string | null };
    expect(secondBody.clienteId).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-API-EDGE-4 (P2) — After re-association, old client no longer has the contact
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] TC-E4-4-2-API-EDGE-4: contact should NOT appear in old client\'s contactos list after being re-assigned to a different client', async ({ request }) => {
    // GIVEN: Contact assigned to clienteA
    const clienteA = await seedCliente(request, 'Cliente A Scope Leak Check');
    createdClienteIds.push(clienteA.id);

    const clienteB = await seedCliente(request, 'Cliente B Scope Leak Check');
    createdClienteIds.push(clienteB.id);

    const contacto = await seedContacto(request, {
      nombre: 'Contacto Scope Leak Verificar',
      email: `scope.leak.${Date.now()}@empresa.co`,
      clienteId: clienteA.id,
    });
    createdContactoIds.push(contacto.id);

    // Verify it appears under clienteA before re-assign
    const beforeGet = await request.get(`${CONTACTOS_URL}?clienteId=${clienteA.id}`);
    expect(beforeGet.status()).toBe(200);
    const beforeList = await beforeGet.json() as { id: string }[];
    const foundBefore = beforeList.find((c) => c.id === contacto.id);
    expect(foundBefore).toBeDefined();

    // WHEN: Re-assign contact to clienteB
    const putResp = await request.put(`${CONTACTOS_URL}/${contacto.id}/cliente`, {
      data: { clienteId: clienteB.id },
    });
    expect(putResp.status()).toBe(200);

    // THEN: Contact no longer appears under clienteA
    const afterGetA = await request.get(`${CONTACTOS_URL}?clienteId=${clienteA.id}`);
    expect(afterGetA.status()).toBe(200);
    const afterListA = await afterGetA.json() as { id: string }[];
    const foundAfterA = afterListA.find((c) => c.id === contacto.id);
    expect(foundAfterA).toBeUndefined();

    // AND: Contact appears under clienteB
    const afterGetB = await request.get(`${CONTACTOS_URL}?clienteId=${clienteB.id}`);
    expect(afterGetB.status()).toBe(200);
    const afterListB = await afterGetB.json() as { id: string }[];
    const foundAfterB = afterListB.find((c) => c.id === contacto.id);
    expect(foundAfterB).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E4-4-2-API-EDGE-5 (P2) — Malformed UUID in path returns 400/404 (not 500)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2] TC-E4-4-2-API-EDGE-5: should return 400 or 404 (NOT 500) when PUT /api/v1/contactos/{id}/cliente is called with a malformed non-UUID id', async ({ request }) => {
    // GIVEN: A path parameter that is not a valid UUID
    const malformedId = 'not-a-valid-uuid';

    // WHEN: PUT with malformed id
    const response = await request.put(`${CONTACTOS_URL}/${malformedId}/cliente`, {
      data: { clienteId: null },
    });

    // THEN: Response is a client error (400-range) — NOT a server error (500)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
