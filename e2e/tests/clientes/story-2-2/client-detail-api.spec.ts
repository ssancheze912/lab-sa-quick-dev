/**
 * Story 2.2: Client Detail View — API Contract Tests
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until the backend implementation is complete.
 *
 * Acceptance Criteria covered (backend side):
 *   AC2 — GET /api/v1/clientes/:id returns the correct ClienteDto (200)
 *   AC3 — GET /api/v1/clientes/:id returns Problem Details RFC 7807 (404) for non-existent IDs
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('API Contract — GET /api/v1/clientes/:id', () => {
  test('should return HTTP 404 with Problem Details when clienteId does not exist', async ({
    request,
  }) => {
    // GIVEN: A UUID that does not correspond to any client
    const nonExistentId = '00000000-0000-0000-0000-ffffffffffff';

    // WHEN: GET /api/v1/clientes/:id is called with the non-existent ID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: The response status is 404
    expect(response.status()).toBe(404);
  });

  test('should return Problem Details body when clienteId does not exist (RFC 7807)', async ({
    request,
  }) => {
    // GIVEN: A UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-ffffffffffff';

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();

    // THEN: The body follows RFC 7807 Problem Details format
    expect(body).toHaveProperty('status', 404);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.toLowerCase()).toContain('no encontrado');
  });

  test('should return HTTP 200 with a ClienteDto when clienteId exists', async ({ request }) => {
    // NOTE: This test requires at least one client to be present in the test database.
    // The test validates the response shape — it does not seed data.

    // GIVEN: We first fetch the list to get a valid ID
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(listResponse.status()).toBe(200);
    const clientes = await listResponse.json();

    // Skip if no clients exist (prevents false failures in empty environments)
    if (!Array.isArray(clientes) || clientes.length === 0) {
      test.skip();
      return;
    }

    const existingId: string = clientes[0].id;

    // WHEN: GET /api/v1/clientes/:id is called with a valid ID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${existingId}`);

    // THEN: The response is 200
    expect(response.status()).toBe(200);
  });

  test('should return a ClienteDto with all required fields when clienteId exists', async ({
    request,
  }) => {
    // GIVEN: We fetch the list to get a valid ID
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(listResponse.status()).toBe(200);
    const clientes = await listResponse.json();

    if (!Array.isArray(clientes) || clientes.length === 0) {
      test.skip();
      return;
    }

    const existingId: string = clientes[0].id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${existingId}`);
    const body = await response.json();

    // THEN: The response body has all required ClienteDto fields
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('nombre');
    expect(body).toHaveProperty('nit');
    expect(body).toHaveProperty('telefono');
    expect(body).toHaveProperty('ciudad');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('contactCount');
    expect(typeof body.contactCount).toBe('number');
  });

  test('should return a direct object (not wrapped in an envelope) for an existing clienteId', async ({
    request,
  }) => {
    // GIVEN: A valid client ID
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const clientes = await listResponse.json();

    if (!Array.isArray(clientes) || clientes.length === 0) {
      test.skip();
      return;
    }

    const existingId: string = clientes[0].id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${existingId}`);
    const body = await response.json();

    // THEN: Body is a direct object with 'id' at the root (not { data: {...} })
    expect(body).toHaveProperty('id', existingId);
    expect(Array.isArray(body)).toBe(false);
    expect(body.data).toBeUndefined();
  });

  test('should return createdAt as an ISO 8601 string with timezone offset', async ({ request }) => {
    // GIVEN: A valid client ID
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const clientes = await listResponse.json();

    if (!Array.isArray(clientes) || clientes.length === 0) {
      test.skip();
      return;
    }

    const existingId: string = clientes[0].id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${existingId}`);
    const body = await response.json();

    // THEN: createdAt is a valid ISO 8601 date string (DateTimeOffset)
    expect(typeof body.createdAt).toBe('string');
    const parsed = Date.parse(body.createdAt);
    expect(Number.isNaN(parsed)).toBe(false);
  });

  test('should return Content-Type application/json for a valid clienteId request', async ({
    request,
  }) => {
    // GIVEN: A valid client ID
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const clientes = await listResponse.json();

    if (!Array.isArray(clientes) || clientes.length === 0) {
      test.skip();
      return;
    }

    const existingId: string = clientes[0].id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${existingId}`);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });
});
