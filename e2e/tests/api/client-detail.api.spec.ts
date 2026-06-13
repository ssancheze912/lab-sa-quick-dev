/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * API Contract Tests — RED Phase (Playwright API)
 * These tests are intentionally FAILING until backend implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — GET /api/v1/clientes/{id} returns correct client data (200)
 *   AC3 — GET /api/v1/clientes/{id} returns Problem Details 404 when ID does not exist
 *   AC4 — Error format is Problem Details RFC 7807 (not unhandled crash)
 *
 * These tests hit the real backend (http://localhost:5000).
 * Run ONLY when backend is running.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — GET /api/v1/clientes/{id} returns 200 with correct client shape
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — GET /api/v1/clientes/{id} returns correct client data', () => {
  test('should return HTTP 200 when requesting an existing client by ID', async ({ request }) => {
    // GIVEN: A client was previously created via POST /api/v1/clientes
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: 'ATDD Test Cliente Detail',
        nit: '900000099',
        telefono: '3009999999',
        ciudad: 'Bogotá',
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    const clienteId = created.id;

    // WHEN: GET /api/v1/clientes/{id} is requested with the created ID
    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes/${clienteId}`);

    // THEN: HTTP 200 is returned
    expect(getResponse.status()).toBe(200);

    // Cleanup
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${clienteId}`);
  });

  test('should return a JSON object with id, nombre, nit, telefono, ciudad fields', async ({ request }) => {
    // GIVEN: An existing client
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: 'ATDD Shape Test',
        nit: '900000088',
        telefono: '3008888888',
        ciudad: 'Cali',
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    const clienteId = created.id;

    // WHEN: Fetching the client by ID
    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes/${clienteId}`);
    const body = await getResponse.json();

    // THEN: Response body has the expected shape (camelCase)
    expect(body).toMatchObject({
      id: clienteId,
      nombre: 'ATDD Shape Test',
      nit: '900000088',
      telefono: '3008888888',
      ciudad: 'Cali',
    });
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');

    // Cleanup
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${clienteId}`);
  });

  test('should return content-type application/json for a successful response', async ({ request }) => {
    // GIVEN: An existing client
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: 'ATDD ContentType Test',
        nit: '900000077',
        telefono: '3007777777',
        ciudad: 'Barranquilla',
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    const clienteId = created.id;

    // WHEN: Requesting the client
    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes/${clienteId}`);

    // THEN: Content-Type is application/json
    const contentType = getResponse.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');

    // Cleanup
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${clienteId}`);
  });

  test('should return the exact same data that was used to create the client', async ({ request }) => {
    // GIVEN: A client created with specific field values
    const clienteData = {
      nombre: 'ATDD Exact Data Test',
      nit: '900000066',
      telefono: '3006666666',
      ciudad: 'Medellín',
    };
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: clienteData,
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    const clienteId = created.id;

    // WHEN: Retrieving the created client
    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes/${clienteId}`);
    const body = await getResponse.json();

    // THEN: All fields match the created data exactly
    expect(body.nombre).toBe(clienteData.nombre);
    expect(body.nit).toBe(clienteData.nit);
    expect(body.telefono).toBe(clienteData.telefono);
    expect(body.ciudad).toBe(clienteData.ciudad);

    // Cleanup
    await request.delete(`${API_BASE_URL}/api/v1/clientes/${clienteId}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — GET /api/v1/clientes/{id} returns Problem Details 404 for missing ID
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — GET /api/v1/clientes/{id} returns 404 for non-existent ID', () => {
  test('should return HTTP 404 when requesting a client ID that does not exist', async ({ request }) => {
    // GIVEN: A UUID that is guaranteed to not exist in the database
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // WHEN: GET /api/v1/clientes/{nonExistentId}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: HTTP 404 is returned
    expect(response.status()).toBe(404);
  });

  test('should return a Problem Details body (RFC 7807) for a 404 response', async ({ request }) => {
    // GIVEN: A non-existent client ID
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // WHEN: GET /api/v1/clientes/{nonExistentId}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();

    // THEN: Problem Details structure is returned
    expect(body.status).toBe(404);
    expect(body.title).toBeTruthy();
  });

  test('should include detail "Cliente not found." in the 404 Problem Details body', async ({ request }) => {
    // GIVEN: A non-existent client ID
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // WHEN: GET /api/v1/clientes/{nonExistentId}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();

    // THEN: The detail field contains the expected message
    expect(body.detail).toBe('Cliente not found.');
  });

  test('should return content-type application/problem+json for a 404 response', async ({ request }) => {
    // GIVEN: A non-existent client ID
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // WHEN: GET /api/v1/clientes/{nonExistentId}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: Content-Type indicates Problem Details format
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return HTTP 400 or 404 (not 500) for a malformed (non-GUID) clienteId', async ({ request }) => {
    // GIVEN: A non-GUID ID in the URL
    const invalidId = 'not-a-valid-guid';

    // WHEN: GET /api/v1/clientes/{invalidId}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${invalidId}`);

    // THEN: The API returns a 4xx error (graceful validation), NOT 500
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Error response format follows Problem Details RFC 7807 (not unhandled crash)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Error format is Problem Details RFC 7807', () => {
  test('should never return an HTML error page for a missing client (must be JSON)', async ({ request }) => {
    // GIVEN: A non-existent client ID
    const nonExistentId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    // WHEN: GET /api/v1/clientes/{nonExistentId}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: Response is JSON, not an HTML error page
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('text/html');
  });
});
