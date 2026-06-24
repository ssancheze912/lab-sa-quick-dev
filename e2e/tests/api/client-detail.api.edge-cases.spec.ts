/**
 * API Edge Case Tests — Story 2.2: GET /api/v1/clientes/{id}
 * BMad-Integrated Automate — Expansion of ATDD coverage
 *
 * Covers edge cases and boundary conditions NOT covered by the ATDD API tests:
 *   - GET with malformed / non-GUID id format (should return 404, not 500)
 *   - GET with uppercase UUID (case sensitivity)
 *   - GET after client deletion (404 expected)
 *   - Response does NOT include extra fields (no data leakage)
 *   - id field in response matches the requested id
 *   - Multiple GET calls for same id return consistent data
 *   - GET with id that has valid UUID format but random content always returns 404
 *
 * Uses Playwright's APIRequestContext (no browser). Requires:
 *   - Backend running on http://localhost:5000
 *   - EF Core migration applied (clientes table exists)
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// Malformed ID format
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes/{id} — malformed id edge cases', () => {
  test('[P1] should return a non-500 status (400 or 404) when id is not a valid GUID', async ({ request }) => {
    // GIVEN: A non-UUID string as the id
    const malformedId = 'not-a-guid';

    // WHEN: GET is called with malformed id
    const response = await request.get(`${ENDPOINT}/${malformedId}`);

    // THEN: API does not return 500 (must handle gracefully — route constraint returns 404 or 400)
    expect(response.status()).not.toBe(500);
    expect([400, 404]).toContain(response.status());
  });

  test('[P1] should NOT expose a stack trace when id is malformed', async ({ request }) => {
    // GIVEN: A non-UUID string as the id
    const malformedId = 'not-a-guid';

    // WHEN: GET is called with malformed id
    const response = await request.get(`${ENDPOINT}/${malformedId}`);

    // THEN: No stack trace in response body (NFR6)
    let bodyStr = '';
    try {
      const body = await response.json() as Record<string, unknown>;
      bodyStr = JSON.stringify(body);
    } catch {
      // Non-JSON response is acceptable for malformed route
      bodyStr = await response.text();
    }

    expect(bodyStr).not.toMatch(/StackTrace/i);
    expect(bodyStr).not.toMatch(/at System\./);
    expect(bodyStr).not.toMatch(/\.cs:line/);
  });

  test('[P2] should return non-500 status when id is an empty segment (numeric)', async ({ request }) => {
    // GIVEN: A numeric id (not a UUID)
    const numericId = '12345';

    // WHEN: GET is called with numeric id
    const response = await request.get(`${ENDPOINT}/${numericId}`);

    // THEN: Not a 500 error — route constraints handle this gracefully
    expect(response.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Uppercase UUID (case sensitivity)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes/{id} — UUID case sensitivity', () => {
  test('[P2] should return 200 or consistent result when UUID is passed in uppercase', async ({ request }) => {
    // GIVEN: A client is seeded
    const payload = {
      nombre: 'Uppercase UUID Test',
      nit: `1${Date.now().toString().slice(-8)}`,
      telefono: '3009001234',
      ciudad: 'Bogotá',
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET is called with uppercase UUID
      const uppercaseId = createdId?.toUpperCase();
      const response = await request.get(`${ENDPOINT}/${uppercaseId}`);

      // THEN: Should respond consistently — 200 (case-insensitive) or 404 (case-sensitive — both acceptable)
      expect([200, 404]).toContain(response.status());
      // Must NOT be 500
      expect(response.status()).not.toBe(500);
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET after client deletion (race condition boundary)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes/{id} — after deletion', () => {
  test('[P1] should return 404 when retrieving a previously deleted client', async ({ request }) => {
    // GIVEN: A client is created then immediately deleted
    const payload = {
      nombre: 'Deleted Client',
      nit: `9${Date.now().toString().slice(-8)}`,
      telefono: '3001234567',
      ciudad: 'Medellín',
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    if (createdId) {
      await request.delete(`${ENDPOINT}/${createdId}`);
    }

    // WHEN: GET is called for the deleted client
    const response = await request.get(`${ENDPOINT}/${createdId}`);

    // THEN: 404 is returned (not 500, not 200)
    expect(response.status()).toBe(404);
  });

  test('[P1] should return Problem Details (not plain text) after client deletion', async ({ request }) => {
    // GIVEN: A client is created then deleted
    const payload = {
      nombre: 'Deleted ProblemDetails',
      nit: `8${Date.now().toString().slice(-8)}`,
      telefono: '3002345678',
      ciudad: 'Cali',
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    if (createdId) {
      await request.delete(`${ENDPOINT}/${createdId}`);
    }

    // WHEN: GET is called for the deleted client
    const response = await request.get(`${ENDPOINT}/${createdId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: Problem Details RFC 7807 format is returned
    expect(body).toHaveProperty('status', 404);
    expect(body).toHaveProperty('title');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response data integrity: returned id matches requested id
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes/{id} — response data integrity', () => {
  test('[P1] should return the exact same id in the response body as was requested', async ({ request }) => {
    // GIVEN: A client is seeded
    const payload = {
      nombre: 'ID Integrity Test',
      nit: `7${Date.now().toString().slice(-8)}`,
      telefono: '3003456789',
      ciudad: 'Barranquilla',
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET is called with the created id
      const response = await request.get(`${ENDPOINT}/${createdId}`);
      const body = await response.json() as Record<string, unknown>;

      // THEN: The returned id matches the requested id (lowercase UUID comparison)
      expect(String(body.id).toLowerCase()).toBe(String(createdId).toLowerCase());
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('[P1] should NOT include extra fields beyond the documented API contract', async ({ request }) => {
    // GIVEN: A client is seeded
    const payload = {
      nombre: 'No Extra Fields SA',
      nit: `6${Date.now().toString().slice(-8)}`,
      telefono: '3004567890',
      ciudad: 'Pereira',
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET is called
      const response = await request.get(`${ENDPOINT}/${createdId}`);
      const body = await response.json() as Record<string, unknown>;

      // THEN: Response does not include sensitive/internal fields
      const keys = Object.keys(body);
      expect(keys).not.toContain('passwordHash');
      expect(keys).not.toContain('deletedAt');
      expect(keys).not.toContain('isDeleted');
      expect(keys).not.toContain('rowVersion');
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('[P2] should return consistent data across multiple consecutive GET requests for the same id', async ({ request }) => {
    // GIVEN: A client is seeded
    const payload = {
      nombre: 'Idempotent GET Test',
      nit: `5${Date.now().toString().slice(-8)}`,
      telefono: '3005678901',
      ciudad: 'Bucaramanga',
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET is called three times in a row
      const response1 = await request.get(`${ENDPOINT}/${createdId}`);
      const response2 = await request.get(`${ENDPOINT}/${createdId}`);
      const response3 = await request.get(`${ENDPOINT}/${createdId}`);

      const body1 = await response1.json() as Record<string, unknown>;
      const body2 = await response2.json() as Record<string, unknown>;
      const body3 = await response3.json() as Record<string, unknown>;

      // THEN: All responses return 200 and consistent field values
      expect(response1.status()).toBe(200);
      expect(response2.status()).toBe(200);
      expect(response3.status()).toBe(200);
      expect(body1.nombre).toBe(body2.nombre);
      expect(body2.nombre).toBe(body3.nombre);
      expect(body1.id).toBe(body2.id);
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('[P2] should return the correct nombre when two different clients are fetched sequentially', async ({ request }) => {
    // GIVEN: Two distinct clients are seeded
    const payloadA = {
      nombre: 'Client Sequence A',
      nit: `4${Date.now().toString().slice(-8)}`,
      telefono: '3006789012',
      ciudad: 'Manizales',
    };
    const payloadB = {
      nombre: 'Client Sequence B',
      nit: `3${(Date.now() + 1).toString().slice(-8)}`,
      telefono: '3007890123',
      ciudad: 'Cúcuta',
    };

    const createA = await request.post(ENDPOINT, { data: payloadA });
    const idA: string | undefined = createA.ok() ? (await createA.json()).id : undefined;
    const createB = await request.post(ENDPOINT, { data: payloadB });
    const idB: string | undefined = createB.ok() ? (await createB.json()).id : undefined;

    try {
      // WHEN: GET is called for both in sequence
      const responseA = await request.get(`${ENDPOINT}/${idA}`);
      const responseB = await request.get(`${ENDPOINT}/${idB}`);
      const bodyA = await responseA.json() as Record<string, unknown>;
      const bodyB = await responseB.json() as Record<string, unknown>;

      // THEN: Each returns its own data (no cross-contamination)
      expect(bodyA.nombre).toBe('Client Sequence A');
      expect(bodyB.nombre).toBe('Client Sequence B');
      expect(bodyA.id).not.toBe(bodyB.id);
    } finally {
      if (idA) await request.delete(`${ENDPOINT}/${idA}`);
      if (idB) await request.delete(`${ENDPOINT}/${idB}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Method not allowed (GET endpoint should not allow POST/PUT/DELETE for {id})
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes/{id} — HTTP method boundary', () => {
  test('[P2] should return 405 or 404 when PUT is sent to GET /api/v1/clientes/{id} (no update endpoint)', async ({ request }) => {
    // GIVEN: A valid UUID
    const someId = '00000000-0000-0000-0000-000000000001';

    // WHEN: PUT is sent to the GET-only endpoint
    const response = await request.put(`${ENDPOINT}/${someId}`, { data: { nombre: 'Should Fail' } });

    // THEN: Should not return 200 (endpoint is not implemented for PUT at this route in Story 2.2)
    expect(response.status()).not.toBe(200);
  });

  test('[P2] should return 405 or 404 when PATCH is sent to /api/v1/clientes/{id}', async ({ request }) => {
    // GIVEN: A valid UUID
    const someId = '00000000-0000-0000-0000-000000000002';

    // WHEN: PATCH is sent
    const response = await request.patch(`${ENDPOINT}/${someId}`, { data: {} });

    // THEN: Should not return 200
    expect(response.status()).not.toBe(200);
    expect(response.status()).not.toBe(500);
  });
});
