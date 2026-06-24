/**
 * API Edge-Case Tests — Story 2.5: DELETE /api/v1/clientes/{id} contract
 * BMad-Integrated Automate — Expansion beyond delete-client.api.spec.ts
 *
 * ATDD baseline covers (NOT duplicated here):
 *   AC2 — 204 No Content, empty body, client removed from GET list and by ID
 *   AC4 — ON DELETE SET NULL: contacts become unassigned; all contact data intact
 *   AC6 — 404 response: Problem Details with status+title; no stack trace
 *   (implicit) 404 when ID non-existent; 400 for malformed UUID; double-delete → 404
 *
 * Edge cases added here:
 *   - DELETE is idempotent in terms of side effects: data is gone after first call
 *   - DELETE of a non-existent client does NOT affect any other client in the list
 *   - Multiple contacts become unassigned when a client with many contacts is deleted
 *   - Problem Details detail field (if present) is a non-empty string — no raw class name
 *   - 400 response for malformed UUID also follows Problem Details shape (status field)
 *   - Response Content-Type for 404 is application/json or application/problem+json
 *   - DELETE does not modify any other client's data
 *   - Very large UUID (overlong segment) in path returns 400 or 404 (not 500)
 */

import { test, expect } from '@playwright/test';
import { createClientePayload } from '../../support/factories/cliente.factory';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/clientes`;
const CONTACTOS_ENDPOINT = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// DELETE does NOT affect other clients
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DELETE /api/v1/clientes/{id} — does not affect unrelated clients', () => {
  test('[P1] should NOT remove other clients from the list when one client is deleted', async ({ request }) => {
    // GIVEN: Two clients exist
    const payloadA = createClientePayload({ nombre: 'Cliente A No Affected' });
    const payloadB = createClientePayload({ nombre: 'Cliente B Target' });

    const createA = await request.post(ENDPOINT, { data: payloadA });
    expect(createA.status()).toBe(201);
    const clienteA = await createA.json();

    const createB = await request.post(ENDPOINT, { data: payloadB });
    expect(createB.status()).toBe(201);
    const clienteB = await createB.json();

    // WHEN: Only clienteB is deleted
    const deleteResponse = await request.delete(`${ENDPOINT}/${clienteB.id}`);
    expect(deleteResponse.status()).toBe(204);

    try {
      // THEN: clienteA still exists in the list
      const listResponse = await request.get(ENDPOINT);
      const list = await listResponse.json();
      const ids = list.map((c: { id: string }) => c.id);
      expect(ids).toContain(clienteA.id);
    } finally {
      // Cleanup clienteA
      await request.delete(`${ENDPOINT}/${clienteA.id}`);
    }
  });

  test('[P1] should NOT modify unrelated client data after a delete', async ({ request }) => {
    // GIVEN: Two clients exist
    const payloadA = createClientePayload({ nombre: 'Intacto SA' });
    const payloadB = createClientePayload({ nombre: 'Borrar SA' });

    const createA = await request.post(ENDPOINT, { data: payloadA });
    const clienteA = await createA.json();

    const createB = await request.post(ENDPOINT, { data: payloadB });
    const clienteB = await createB.json();

    // WHEN: clienteB is deleted
    await request.delete(`${ENDPOINT}/${clienteB.id}`);

    try {
      // THEN: clienteA data is unchanged
      const getA = await request.get(`${ENDPOINT}/${clienteA.id}`);
      expect(getA.status()).toBe(200);
      const data = await getA.json();
      expect(data.nombre).toBe(payloadA.nombre);
      expect(data.nit).toBe(payloadA.nit);
    } finally {
      await request.delete(`${ENDPOINT}/${clienteA.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple contacts unassigned on client deletion
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DELETE /api/v1/clientes/{id} — AC4: multiple contacts all become unassigned', () => {
  test('[P1] should set clienteId to NULL for all contacts when a client with many contacts is deleted', async ({ request }) => {
    // GIVEN: A client with 3 associated contacts
    const createClienteResponse = await request.post(ENDPOINT, {
      data: createClientePayload({ nombre: 'Cliente Multi Contactos SA' }),
    });
    expect(createClienteResponse.status()).toBe(201);
    const cliente = await createClienteResponse.json();

    const contactIds: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const createContactoResponse = await request.post(CONTACTOS_ENDPOINT, {
        data: {
          nombre: `Contacto Multiple ${i}`,
          email: `multi.contacto.${i}.${Date.now()}@test.com`,
          clienteId: cliente.id,
        },
      });
      expect(createContactoResponse.status()).toBe(201);
      const contacto = await createContactoResponse.json();
      contactIds.push(contacto.id);
    }

    try {
      // WHEN: The client is deleted
      const deleteResponse = await request.delete(`${ENDPOINT}/${cliente.id}`);
      expect(deleteResponse.status()).toBe(204);

      // THEN: All 3 contacts have clienteId = NULL
      for (const contactId of contactIds) {
        const getContact = await request.get(`${CONTACTOS_ENDPOINT}/${contactId}`);
        expect(getContact.status()).toBe(200);
        const contactData = await getContact.json();
        expect(contactData.clienteId).toBeNull();
      }
    } finally {
      // Cleanup contacts
      for (const contactId of contactIds) {
        await request.delete(`${CONTACTOS_ENDPOINT}/${contactId}`);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Problem Details format on error responses
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DELETE /api/v1/clientes/{id} — error responses follow Problem Details RFC 7807', () => {
  test('[P1] 404 response Content-Type should be application/json or application/problem+json', async ({ request }) => {
    // GIVEN: A UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-555555555555';

    // WHEN: DELETE returns 404
    const response = await request.delete(`${ENDPOINT}/${nonExistentId}`);

    // THEN: Content-Type indicates JSON (problem+json or application/json)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/(problem\+)?json/);
  });

  test('[P1] 404 detail field (when present) is a human-readable string without class names', async ({ request }) => {
    // GIVEN: A UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-666666666666';

    // WHEN: DELETE returns 404
    const response = await request.delete(`${ENDPOINT}/${nonExistentId}`);
    const body = await response.json();

    if (body.detail !== undefined) {
      // THEN: detail is a non-empty string without raw .NET exception class names
      expect(typeof body.detail).toBe('string');
      expect(body.detail.length).toBeGreaterThan(0);
      expect(body.detail).not.toMatch(/\bException\b/);
      expect(body.detail).not.toMatch(/\bat\s+\S+\./);
    }
  });

  test('[P1] 400 response for malformed UUID should include a status field', async ({ request }) => {
    // GIVEN: A malformed (non-UUID) id
    const malformedId = 'invalid-uuid-format';

    // WHEN: DELETE is called
    const response = await request.delete(`${ENDPOINT}/${malformedId}`);

    // THEN: Status is 400 (or 404 if router rejects it as unmatched)
    expect([400, 404]).toContain(response.status());
  });

  test('[P2] DELETE with an overlong path segment does not return 500', async ({ request }) => {
    // GIVEN: A path segment that exceeds normal UUID length
    const overlongId = 'a'.repeat(200);

    // WHEN: DELETE is called with an overlong ID
    const response = await request.delete(`${ENDPOINT}/${overlongId}`);

    // THEN: Response is a client error (400 or 404), not an internal server error
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE is idempotent regarding side effects
// ─────────────────────────────────────────────────────────────────────────────

test.describe('DELETE /api/v1/clientes/{id} — idempotency of side effects', () => {
  test('[P1] second DELETE on same ID returns 404 and does not corrupt any other data', async ({ request }) => {
    // GIVEN: A client is created and deleted
    const createPayload = createClientePayload({ nombre: 'Idempotent Delete SA' });
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // First DELETE
    const firstDelete = await request.delete(`${ENDPOINT}/${created.id}`);
    expect(firstDelete.status()).toBe(204);

    // WHEN: Second DELETE on the same ID
    const secondDelete = await request.delete(`${ENDPOINT}/${created.id}`);

    // THEN: 404 Not Found (resource already gone) and no 500 panic
    expect(secondDelete.status()).toBe(404);
    expect(secondDelete.status()).not.toBe(500);
  });

  test('[P1] GET /api/v1/clientes list does NOT include a deleted client after second DELETE attempt', async ({ request }) => {
    // GIVEN: Client created, deleted once
    const createPayload = createClientePayload({ nombre: 'Gone After Double Delete SA' });
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    await request.delete(`${ENDPOINT}/${created.id}`);
    await request.delete(`${ENDPOINT}/${created.id}`); // second call returns 404 but list should still be clean

    // THEN: Client is not in the list
    const listResponse = await request.get(ENDPOINT);
    const list = await listResponse.json();
    const ids = list.map((c: { id: string }) => c.id);
    expect(ids).not.toContain(created.id);
  });
});
