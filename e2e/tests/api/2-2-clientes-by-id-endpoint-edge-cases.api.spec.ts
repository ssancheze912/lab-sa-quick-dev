/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * API Tests — Edge Cases & Boundary Conditions (BMad-Integrated Expansion)
 * Expands ATDD coverage with API-level edge cases not covered in
 * 2-2-clientes-by-id-endpoint.api.spec.ts.
 *
 * New Test Cases:
 *   TC-2.2-A-06 — GET /api/v1/clientes/{id} → Content-Type is application/json
 *   TC-2.2-A-07 — GET /api/v1/clientes/{id} → updatedAt >= createdAt (temporal integrity)
 *   TC-2.2-A-08 — GET /api/v1/clientes/{id} → no unexpected properties leaked in 200 response
 *   TC-2.2-A-09 — GET /api/v1/clientes/{nonexistent} → 404 Content-Type is problem+json or application/json
 *   TC-2.2-A-10 — GET /api/v1/clientes/{malformed-id} → returns 400 or 404 (not 500)
 *   TC-2.2-A-11 — GET /api/v1/clientes/{id} → id field in response matches requested id
 *   TC-2.2-A-12 — GET /api/v1/clientes/{id} → 404 title is in Spanish (localized error message)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('GET /api/v1/clientes/{id} — API edge cases (Story 2.2)', () => {
  let api: ApiHelper;

  test.beforeEach(({ request }) => {
    api = new ApiHelper(request);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-06 — Content-Type is application/json for 200 response
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.2-A-06] Given a client exists, When GET /api/v1/clientes/{id}, Then Content-Type is application/json', async ({
    request,
  }) => {
    // GIVEN: A client is created
    const data = buildCliente();
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

      // THEN: Status is 200 and Content-Type is application/json
      expect(response.status()).toBe(200);
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/application\/json/i);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-07 — updatedAt >= createdAt (temporal integrity)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.2-A-07] Given a client exists, When GET /api/v1/clientes/{id}, Then updatedAt >= createdAt (temporal integrity)', async ({
    request,
  }) => {
    // GIVEN: A client is created
    const data = buildCliente({ nombre: 'Temporal Integrity Edge SA' });
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
      const body = await response.json() as Record<string, string>;

      expect(response.status()).toBe(200);

      // THEN: updatedAt is at or after createdAt
      const createdAtMs = new Date(body.createdAt).getTime();
      const updatedAtMs = new Date(body.updatedAt).getTime();

      expect(Number.isNaN(createdAtMs)).toBe(false);
      expect(Number.isNaN(updatedAtMs)).toBe(false);
      expect(updatedAtMs).toBeGreaterThanOrEqual(createdAtMs);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-08 — No unexpected properties in single-client 200 response
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.2-A-08] Given a client exists, When GET /api/v1/clientes/{id}, Then response has only expected DTO fields (no leak of internal properties)', async ({
    request,
  }) => {
    // GIVEN: A client is created
    const data = buildCliente({ nombre: 'No Leak Single Corp' });
    const created = await api.createCliente(data);

    const expectedKeys = new Set(['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt']);

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
      const body = await response.json() as Record<string, unknown>;

      expect(response.status()).toBe(200);

      // THEN: No unexpected keys (e.g., passwordHash, internalNotes, stackTrace, etc.)
      const unexpectedKeys = Object.keys(body).filter((k) => !expectedKeys.has(k));
      expect(unexpectedKeys).toHaveLength(0);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-09 — 404 response Content-Type is problem+json or application/json
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.2-A-09] Given a nonexistent id, When GET /api/v1/clientes/{id} returns 404, Then Content-Type is problem+json or application/json', async ({
    request,
  }) => {
    // GIVEN: A UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{nonexistent-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: Status is 404
    expect(response.status()).toBe(404);

    // AND: Content-Type is either problem+json (RFC 7807) or application/json (acceptable fallback)
    const contentType = response.headers()['content-type'] ?? '';
    const isProblemJson = /application\/problem\+json/i.test(contentType);
    const isApplicationJson = /application\/json/i.test(contentType);
    expect(isProblemJson || isApplicationJson).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-10 — Malformed UUID (not a valid GUID) returns 400 or 404, NOT 500
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.2-A-10] Given a malformed UUID (not a valid GUID format), When GET /api/v1/clientes/{malformed}, Then response is 400 or 404 (never 500)', async ({
    request,
  }) => {
    // GIVEN: A string that is not a valid UUID/GUID
    const malformedId = 'not-a-valid-uuid-123';

    // WHEN: GET /api/v1/clientes/{malformed}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${malformedId}`);

    // THEN: Response is a client error (400 Bad Request for route constraint rejection, or 404 for unmatched route)
    // It MUST NOT be a 500 Internal Server Error (no unhandled exceptions)
    expect(response.status()).not.toBe(500);

    // AND: Response is in the 4xx range
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-11 — id field in response matches requested id
  // ─────────────────────────────────────────────────────────────────────────

  test('[P1][TC-2.2-A-11] Given a client exists, When GET /api/v1/clientes/{id}, Then the id field in response matches the requested id exactly', async ({
    request,
  }) => {
    // GIVEN: A client is created
    const data = buildCliente({ nombre: 'ID Match Corp SA' });
    const created = await api.createCliente(data);

    try {
      // WHEN: GET /api/v1/clientes/{id}
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
      const body = await response.json() as Record<string, string>;

      expect(response.status()).toBe(200);

      // THEN: The id in the response body matches exactly what was requested
      // This guards against returning a different client (data integrity)
      expect(body.id).toBe(created.id);
    } finally {
      await api.deleteCliente(created.id).catch(() => null);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-2.2-A-12 — 404 title is in Spanish (localized error)
  // ─────────────────────────────────────────────────────────────────────────

  test('[P2][TC-2.2-A-12] Given a nonexistent id, When GET /api/v1/clientes/{id} returns 404, Then the title field is in Spanish (localized)', async ({
    request,
  }) => {
    // GIVEN: A UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{nonexistent-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json() as Record<string, unknown>;

    expect(response.status()).toBe(404);

    // THEN: The title is in Spanish — matches the company standards (document_output_language: Spanish for UI messages)
    // Should contain "no encontrado" or "Cliente no encontrado" (case-insensitive)
    expect(body.title).toBeTruthy();
    expect(String(body.title).toLowerCase()).toMatch(/no encontrado|cliente/i);
  });
});
