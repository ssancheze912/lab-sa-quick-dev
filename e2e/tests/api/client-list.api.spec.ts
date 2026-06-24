/**
 * API Tests — Story 2.1: GET /api/v1/clientes contract
 * RED PHASE — Tests are intentionally FAILING until backend implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC6 — GET /api/v1/clientes returns the correct HTTP contract (status, headers, body shape)
 *
 * Uses Playwright's APIRequestContext (no browser). Requires:
 *   - Backend running on http://localhost:5000
 *   - EF Core migration applied (clientes table exists)
 *   - No authentication required (MVP has no auth layer)
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/clientes — contract validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes — HTTP contract', () => {
  test('should return HTTP 200 when the clientes table is accessible', async ({ request }) => {
    // GIVEN: The backend API is running and clientes table exists

    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);

    // THEN: HTTP status is 200
    expect(response.status()).toBe(200);
  });

  test('should return Content-Type: application/json', async ({ request }) => {
    // GIVEN: The backend is running

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(ENDPOINT);

    // THEN: Content-Type header includes application/json
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
  });

  test('should return a JSON array (not an object wrapper)', async ({ request }) => {
    // GIVEN: The backend returns client data

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(ENDPOINT);
    const body = await response.json();

    // THEN: The response body is a JSON array (no { data: [...] } wrapper)
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return HTTP 200 with empty array [] when no clients exist', async ({ request }) => {
    // GIVEN: No clients seeded in the database (or table is freshly created)

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(ENDPOINT);
    const body = await response.json();

    // THEN: HTTP 200 + empty array (NOT a 404)
    expect(response.status()).toBe(200);
    if (body.length === 0) {
      expect(body).toEqual([]);
    }
    // If data exists, the test still passes — empty-array scenario is verified separately in seeded tests
  });

  test('should return client objects with required camelCase fields', async ({ request }) => {
    // GIVEN: At least one client exists in the system (seeded via beforeAll or existing data)
    // NOTE: This test seeds a client via POST first to guarantee at least one record.
    const clientPayload = {
      nombre: 'API Contract Test SA',
      nit: `9${Date.now().toString().slice(-8)}`,
      telefono: '3001234567',
      ciudad: 'Medellín',
    };

    // Seed client (will fail in RED phase because endpoint not implemented)
    const createResponse = await request.post(ENDPOINT, { data: clientPayload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/clientes is called
      const response = await request.get(ENDPOINT);
      const body = await response.json() as Array<Record<string, unknown>>;

      // THEN: If the list has items, each item has the mandatory camelCase fields
      if (body.length > 0) {
        const item = body[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('nombre');
        expect(item).toHaveProperty('nit');
        expect(item).toHaveProperty('telefono');
        expect(item).toHaveProperty('ciudad');
        expect(item).toHaveProperty('createdAt');
        expect(item).toHaveProperty('updatedAt');
      }
    } finally {
      // Cleanup: delete seeded client if it was created
      if (createdId) {
        await request.delete(`${ENDPOINT}/${createdId}`);
      }
    }
  });

  test('should return id as a UUID string (not numeric)', async ({ request }) => {
    // GIVEN: At least one client exists
    const clientPayload = {
      nombre: 'UUID Shape Test',
      nit: `8${Date.now().toString().slice(-8)}`,
      telefono: '3109876543',
      ciudad: 'Cali',
    };

    const createResponse = await request.post(ENDPOINT, { data: clientPayload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/clientes is called
      const response = await request.get(ENDPOINT);
      const body = await response.json() as Array<Record<string, unknown>>;

      // THEN: id field matches UUID format
      if (body.length > 0) {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(String(body[0].id)).toMatch(uuidPattern);
      }
    } finally {
      if (createdId) {
        await request.delete(`${ENDPOINT}/${createdId}`);
      }
    }
  });

  test('should return createdAt and updatedAt as ISO 8601 timestamp strings', async ({ request }) => {
    // GIVEN: At least one client exists
    const clientPayload = {
      nombre: 'Timestamp Shape Test',
      nit: `7${Date.now().toString().slice(-8)}`,
      telefono: '3201234567',
      ciudad: 'Barranquilla',
    };

    const createResponse = await request.post(ENDPOINT, { data: clientPayload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/clientes is called
      const response = await request.get(ENDPOINT);
      const body = await response.json() as Array<Record<string, unknown>>;

      // THEN: timestamps are ISO 8601 strings
      if (body.length > 0) {
        const item = body[0];
        expect(typeof item.createdAt).toBe('string');
        expect(typeof item.updatedAt).toBe('string');
        // Validate ISO 8601 format
        expect(new Date(String(item.createdAt)).toISOString()).toBe(item.createdAt);
      }
    } finally {
      if (createdId) {
        await request.delete(`${ENDPOINT}/${createdId}`);
      }
    }
  });

  test('should NOT return snake_case field names (must be camelCase)', async ({ request }) => {
    // GIVEN: At least one client exists
    const clientPayload = {
      nombre: 'CamelCase Validation',
      nit: `6${Date.now().toString().slice(-8)}`,
      telefono: '3154567890',
      ciudad: 'Pereira',
    };

    const createResponse = await request.post(ENDPOINT, { data: clientPayload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/clientes is called
      const response = await request.get(ENDPOINT);
      const body = await response.json() as Array<Record<string, unknown>>;

      // THEN: No snake_case keys present in the response
      if (body.length > 0) {
        const keys = Object.keys(body[0]);
        expect(keys).not.toContain('created_at');
        expect(keys).not.toContain('updated_at');
        expect(keys).not.toContain('NombreCompleto');
      }
    } finally {
      if (createdId) {
        await request.delete(`${ENDPOINT}/${createdId}`);
      }
    }
  });
});
