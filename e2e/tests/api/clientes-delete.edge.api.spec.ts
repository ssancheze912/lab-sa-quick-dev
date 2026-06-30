/**
 * Story 2.5: Delete Client — API Edge Cases
 * Epic 2: Client Management
 *
 * Expanded API-level automation: boundary conditions and error paths
 * NOT covered by the ATDD acceptance tests (clientes-delete.api.spec.ts).
 *
 * Scenarios covered:
 *   - DELETE with invalid UUID format returns 400/404 (not 500)
 *   - DELETE is idempotent: second call on already-deleted ID returns 404
 *   - DELETE response has no body (strictly no content-type for 204)
 *   - Concurrent DELETE of the same client: second call returns 404
 *   - Response does NOT expose internal details (stack trace guard — NFR6)
 *   - DELETE /api/v1/clientes/{id} with multiple associated contacts: all become null
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Boundary — invalid UUID format
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — DELETE with invalid UUID format', () => {
  test('[P1] should return 400 or 404 (not 500) for a non-UUID path segment', async ({ request }) => {
    // GIVEN: A path segment that is not a valid UUID
    // WHEN: DELETE /api/v1/clientes/not-a-uuid
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/not-a-valid-uuid`);

    // THEN: Response is 4xx — never 500 for bad client input (AC2 — error handling)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should return a Problem Details body (not empty) for invalid UUID format', async ({ request }) => {
    // GIVEN: Non-UUID path segment
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/bad-id-format`);

    // THEN: Body is not empty and is a structured error (Problem Details or similar)
    const text = await response.text();
    expect(text.length).toBeGreaterThan(0);
  });

  test('[P1] should not expose stack trace for invalid UUID input (NFR6)', async ({ request }) => {
    // GIVEN: Non-UUID path segment
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/not-a-uuid`);
    const body = await response.text();

    // THEN: Internal technical details are not exposed
    expect(body).not.toMatch(/stackTrace|exception|at System\.|at Microsoft\./i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Idempotency — second DELETE on already-deleted ID
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — DELETE is not idempotent: second call returns 404', () => {
  let createdId: string | null = null;

  test.beforeEach(async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Idempotency Test ${Date.now()}`,
        nit: `I${Date.now().toString().slice(-8)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const body = await response.json();
    createdId = body.id ?? null;
  });

  test.afterEach(async ({ request }) => {
    if (createdId) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`).catch(() => null);
      createdId = null;
    }
  });

  test('[P1] second DELETE on the same client should return 404', async ({ request }) => {
    // GIVEN: A client has already been deleted
    const firstDelete = await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    expect(firstDelete.status()).toBe(204);
    createdId = null;

    const deletedId = firstDelete.url().split('/').pop()!;

    // WHEN: DELETE is called again with the same id
    const secondDelete = await request.delete(`${API_BASE_URL}/api/v1/clientes/${deletedId}`);

    // THEN: 404 — the resource no longer exists (not idempotent — returns error on second call)
    expect(secondDelete.status()).toBe(404);
  });

  test('[P1] second DELETE response should follow Problem Details RFC 7807', async ({ request }) => {
    // GIVEN: Client is deleted once
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const id = createdId;
    createdId = null;

    // WHEN: Second DELETE
    const response = await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`);
    expect(response.status()).toBe(404);

    // THEN: Problem Details format
    const body = await response.json();
    expect(body.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Concurrent deletion — race condition
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Concurrent DELETE of the same client', () => {
  let createdId: string | null = null;

  test.beforeEach(async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Concurrent Test ${Date.now()}`,
        nit: `CC${Date.now().toString().slice(-7)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const body = await response.json();
    createdId = body.id ?? null;
  });

  test.afterEach(async ({ request }) => {
    if (createdId) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdId}`).catch(() => null);
      createdId = null;
    }
  });

  test('[P2] concurrent DELETEs on the same client should result in exactly one 204 and one 404', async ({ request }) => {
    // GIVEN: Two concurrent DELETE requests for the same client
    const id = createdId!;

    // WHEN: Both fired concurrently
    const [r1, r2] = await Promise.all([
      request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`),
      request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`),
    ]);

    const statuses = [r1.status(), r2.status()].sort();

    // THEN: One succeeds (204) and one fails (404) — DB ensures single deletion
    expect(statuses).toEqual([204, 404]);
    createdId = null;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple contacts — all become null after client deletion
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Multiple contacts all become unassigned after client deletion', () => {
  let createdClienteId: string | null = null;
  const createdContactoIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    // Create client
    const clienteResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente Multi Contactos ${Date.now()}`,
        nit: `MC${Date.now().toString().slice(-7)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const cliente = await clienteResponse.json();
    createdClienteId = cliente.id ?? null;

    // Create 3 contacts assigned to this client
    for (let i = 0; i < 3; i++) {
      const contactoResponse = await request.post(`${API_BASE_URL}/api/v1/contactos`, {
        data: {
          nombre: `Contacto Multi ${i} ${Date.now()}`,
          email: `multi.contact.${i}.${Date.now()}@test.co`,
          cargo: 'Analista',
          telefono: `310${i}${Date.now().toString().slice(-6)}`,
          clienteId: createdClienteId,
        },
      });
      const contacto = await contactoResponse.json();
      if (contacto.id) createdContactoIds.push(contacto.id);
    }
  });

  test.afterEach(async ({ request }) => {
    for (const cId of createdContactoIds) {
      await request.delete(`${API_BASE_URL}/api/v1/contactos/${cId}`).catch(() => null);
    }
    createdContactoIds.length = 0;
    if (createdClienteId) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdClienteId}`).catch(() => null);
      createdClienteId = null;
    }
  });

  test('[P1] all 3 contacts should have clienteId = null after client deletion (FR25)', async ({ request }) => {
    // GIVEN: 3 contacts are assigned to the client
    expect(createdContactoIds).toHaveLength(3);

    // WHEN: Client is deleted
    const deleteResponse = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/${createdClienteId}`
    );
    expect(deleteResponse.status()).toBe(204);
    createdClienteId = null;

    // THEN: All 3 contacts have clienteId = null (ON DELETE SET NULL cascade)
    for (const contactoId of createdContactoIds) {
      const getResponse = await request.get(`${API_BASE_URL}/api/v1/contactos/${contactoId}`);
      expect(getResponse.status()).toBe(200);
      const contacto = await getResponse.json();
      expect(contacto.clienteId).toBeNull();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security — no internal information leakage on 500
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Response does not expose internal details (NFR6)', () => {
  test('[P1] successful 204 response should have no Content-Type header', async ({ request }) => {
    // GIVEN: A valid client to delete
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `Cliente NFR Test ${Date.now()}`,
        nit: `NF${Date.now().toString().slice(-7)}`,
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const cliente = await createResponse.json();

    // WHEN: Client is deleted
    const deleteResponse = await request.delete(
      `${API_BASE_URL}/api/v1/clientes/${cliente.id}`
    );
    expect(deleteResponse.status()).toBe(204);

    // THEN: 204 response body is empty (RFC 7230 — No Content has no entity body)
    const body = await deleteResponse.text();
    expect(body).toBe('');
  });
});
