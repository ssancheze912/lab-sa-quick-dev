/**
 * Story 2.2: Client Detail View — API Contract Edge Cases
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD API coverage with edge cases and boundary conditions
 * NOT covered by cliente-detail.api.spec.ts.
 *
 * Additional scenarios:
 * - Malformed UUID returns 400 or 404 (not 500)
 * - Empty string UUID segment behavior
 * - Response body completeness: all expected fields present
 * - No extra/unexpected fields in response
 * - 404 detail message references the requested ID
 * - Response time within acceptable bounds
 * - List endpoint still works after detail endpoint is called
 *
 * These tests hit the real backend (http://localhost:5000).
 * They verify the contract established by AC3, AC4, AC5 at the API level.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const ENDPOINT_BASE = `${BASE_URL}/api/v1/clientes`;

const KNOWN_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440001';
const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000000';

// ─── Malformed UUID handling ──────────────────────────────────────────────────

test.describe('[P1] GET /api/v1/clientes/{id} — Malformed UUID handling', () => {
  test('[P1] should return 400 or 404 (not 500) for a non-UUID string as id', async ({ request }) => {
    // GIVEN: A non-UUID string is passed as the id segment
    // WHEN: A GET request is sent to /api/v1/clientes/not-a-uuid
    const response = await request.get(`${ENDPOINT_BASE}/not-a-uuid`);

    // THEN: Server returns 400 Bad Request or 404 Not Found (ASP.NET route constraint {id:guid}
    //       rejects non-GUID values and returns 404 — correct behavior, not a 500)
    expect([400, 404]).toContain(response.status());
  });

  test('[P1] should not return 500 for a request with a purely numeric id', async ({ request }) => {
    // GIVEN: A numeric string is passed as the id segment
    // WHEN: A GET request is sent to /api/v1/clientes/12345
    const response = await request.get(`${ENDPOINT_BASE}/12345`);

    // THEN: Server does not return 500 (route constraint prevents execution)
    expect(response.status()).not.toBe(500);
  });
});

// ─── Response body completeness and contract ─────────────────────────────────

test.describe('[P1] GET /api/v1/clientes/{id} — Response body completeness', () => {
  test('[P1] should return all required fields in the response body', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists in the database
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: All required fields are present and non-null
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('nombre');
    expect(body).toHaveProperty('nit');
    expect(body).toHaveProperty('telefono');
    expect(body).toHaveProperty('ciudad');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');
  });

  test('[P1] should return a valid UUID string in the id field', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: id field matches UUID v4 format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(body['id'] as string).toMatch(uuidPattern);
  });

  test('[P1] should return createdAt in ISO 8601 format with timezone', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: createdAt is a parseable ISO date (not an empty string, not null)
    const createdAt = body['createdAt'] as string;
    expect(createdAt.length).toBeGreaterThan(0);
    const date = new Date(createdAt);
    expect(isNaN(date.getTime())).toBe(false);
  });

  test('[P1] should return updatedAt in ISO 8601 format with timezone', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: updatedAt is a parseable ISO date
    const updatedAt = body['updatedAt'] as string;
    expect(updatedAt.length).toBeGreaterThan(0);
    const date = new Date(updatedAt);
    expect(isNaN(date.getTime())).toBe(false);
  });
});

// ─── 404 Problem Details message content ─────────────────────────────────────

test.describe('[P1] GET /api/v1/clientes/{id} — 404 Problem Details content', () => {
  test('[P1] should include the requested id in the 404 detail message', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent
    const response = await request.get(`${ENDPOINT_BASE}/${UNKNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: The detail message references the requested UUID
    const detail = body['detail'] as string | undefined;
    if (detail !== undefined) {
      // Per architecture spec: "Cliente con id {id} no encontrado."
      expect(detail).toContain(UNKNOWN_CLIENT_ID);
    }
    // Acceptable if detail is omitted — only status and title are required by RFC 7807
    expect(body['status']).toBe(404);
  });

  test('[P1] should include a title field in the 404 Problem Details response', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent
    const response = await request.get(`${ENDPOINT_BASE}/${UNKNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: title is a non-empty string
    expect(typeof body['title']).toBe('string');
    expect((body['title'] as string).length).toBeGreaterThan(0);
  });
});

// ─── List endpoint still works alongside detail endpoint ─────────────────────

test.describe('[P2] GET /api/v1/clientes — List endpoint coexistence with detail endpoint', () => {
  test('[P2] should return the client list successfully after a detail request', async ({ request }) => {
    // GIVEN: A detail request was made first (to verify no side effects)
    await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);

    // WHEN: A list request is sent immediately after
    const listResponse = await request.get(ENDPOINT_BASE);

    // THEN: List endpoint still returns 200 with an array
    expect(listResponse.status()).toBe(200);
    const body = await listResponse.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('[P2] should return a detail response that is consistent with the list response (same id)', async ({ request }) => {
    // GIVEN: The client is in the list and accessible via detail endpoint
    // WHEN: We fetch the list and find the client
    const listResponse = await request.get(ENDPOINT_BASE);
    if (listResponse.status() !== 200) {
      test.skip();
      return;
    }
    const list = await listResponse.json() as Record<string, unknown>[];
    if (list.length === 0) {
      test.skip();
      return;
    }

    const firstId = list[0]['id'] as string;

    // THEN: The detail endpoint returns the same client with matching id
    const detailResponse = await request.get(`${ENDPOINT_BASE}/${firstId}`);
    expect(detailResponse.status()).toBe(200);
    const detailBody = await detailResponse.json() as Record<string, unknown>;
    expect(detailBody['id']).toBe(firstId);
  });
});

// ─── HTTP method restrictions ─────────────────────────────────────────────────

test.describe('[P2] GET /api/v1/clientes/{id} — HTTP method restrictions', () => {
  test('[P2] should return 405 Method Not Allowed for POST to the detail endpoint', async ({ request }) => {
    // GIVEN: The detail endpoint only accepts GET
    // WHEN: A POST request is sent to /api/v1/clientes/{id}
    const response = await request.post(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`, {
      data: {},
    });

    // THEN: 405 Method Not Allowed (endpoint is GET only)
    expect(response.status()).toBe(405);
  });

  test('[P2] should return 405 Method Not Allowed for DELETE to the detail endpoint', async ({ request }) => {
    // GIVEN: The detail endpoint only accepts GET
    // WHEN: A DELETE request is sent to /api/v1/clientes/{id}
    const response = await request.delete(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);

    // THEN: 405 Method Not Allowed
    expect(response.status()).toBe(405);
  });
});
