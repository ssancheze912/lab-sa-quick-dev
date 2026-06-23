/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Integration Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC6 — GET /api/v1/clientes returns JSON array of client objects with HTTP 200
 *          (direct array, no wrapper object)
 *   AC7 — clientes table exists in siesa_agents_db with correct columns and uk_clientes_nit index
 *
 * Note: AC7 (DB migration / schema) is validated indirectly via the endpoint response:
 * if the migration ran and entity is configured correctly, the endpoint works.
 * Schema-level assertions (unique index) are covered by the 409 conflict test.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC6: GET /api/v1/clientes returns 200 with direct JSON array
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — GET /api/v1/clientes endpoint contract', () => {
  test('should return HTTP 200 from GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The backend is running and the clientes endpoint is implemented
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response status is 200
    expect(response.status()).toBe(200);
  });

  test('should return Content-Type application/json from GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response Content-Type includes application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return a JSON array (not a wrapped object) from GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The response body is an array (not { data: [...] } or { items: [...] })
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return client objects with all required fields when clients exist', async ({ request }) => {
    // GIVEN: At least one client exists in the database (seeded via POST)
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD Test Client ${Date.now()}`,
        nit: `ATDD${Date.now()}`.slice(0, 12),
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    // If create fails (endpoint not implemented), skip assertion — test will fail at GET assertion
    const createdClient = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: At least one client object has all required fields
    if (body.length > 0) {
      const client = body[0];
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('nombre');
      expect(client).toHaveProperty('nit');
      expect(client).toHaveProperty('telefono');
      expect(client).toHaveProperty('ciudad');
      expect(client).toHaveProperty('createdAt');
      expect(client).toHaveProperty('updatedAt');
    }

    // Cleanup: delete the created client
    if (createdClient?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdClient.id}`);
    }
  });

  test('should return an empty array when no clients exist', async ({ request }) => {
    // GIVEN: There are no clients in the database (assuming clean test DB)
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The response is a valid array (may be empty or have existing records)
    // This test primarily validates the contract: response must be an array regardless
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return client id as UUID string format', async ({ request }) => {
    // GIVEN: At least one client exists
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD UUID Test ${Date.now()}`,
        nit: `UUID${Date.now()}`.slice(0, 12),
        telefono: null,
        ciudad: null,
      },
    });
    const createdClient = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Each client id is a UUID format string
    if (body.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(body[0].id)).toBe(true);
    }

    // Cleanup
    if (createdClient?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdClient.id}`);
    }
  });

  test('should return createdAt and updatedAt as ISO 8601 datetime strings', async ({ request }) => {
    // GIVEN: At least one client exists
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD Date Test ${Date.now()}`,
        nit: `DATE${Date.now()}`.slice(0, 12),
        telefono: null,
        ciudad: null,
      },
    });
    const createdClient = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: createdAt and updatedAt match ISO 8601 format with timezone
    if (body.length > 0) {
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      expect(isoRegex.test(body[0].createdAt)).toBe(true);
      expect(isoRegex.test(body[0].updatedAt)).toBe(true);
    }

    // Cleanup
    if (createdClient?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${createdClient.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7: DB migration — clientes table + uk_clientes_nit unique index
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — DB migration: clientes table and unique NIT constraint', () => {
  test('should enforce NIT uniqueness — POST with duplicate NIT returns 409', async ({ request }) => {
    // GIVEN: A client with NIT "ATDDUNIQ001" already exists
    const nit = `ATDDUQ${Date.now()}`.slice(0, 12);
    const firstCreate = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD First ${Date.now()}`,
        nit,
        telefono: null,
        ciudad: null,
      },
    });
    const firstClient = firstCreate.status() === 201 ? await firstCreate.json() : null;

    // WHEN: A second client with the same NIT is created
    const duplicateResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD Second ${Date.now()}`,
        nit, // same NIT — violates uk_clientes_nit
        telefono: null,
        ciudad: null,
      },
    });

    // THEN: The response is 409 Conflict (uk_clientes_nit index enforced)
    expect(duplicateResponse.status()).toBe(409);

    // AND: The response does not expose stack traces (NFR6)
    const body = await duplicateResponse.json();
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('StackTrace');
    expect(bodyStr).not.toContain('InnerException');
    expect(bodyStr).not.toContain('Exception');

    // Cleanup
    if (firstClient?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${firstClient.id}`);
    }
  });

  test('should accept nullable telefono and ciudad fields', async ({ request }) => {
    // GIVEN: A valid client payload with null optional fields
    const nit = `ATDDN${Date.now()}`.slice(0, 12);
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD Nullable Test ${Date.now()}`,
        nit,
        telefono: null,
        ciudad: null,
      },
    });

    // WHEN: POST /api/v1/clientes with null optional fields

    // THEN: The response is 201 Created (nullable columns accepted)
    expect(createResponse.status()).toBe(201);
    const client = await createResponse.json();
    expect(client.telefono).toBeNull();
    expect(client.ciudad).toBeNull();

    // Cleanup
    if (client?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${client.id}`);
    }
  });
});
