/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Integration Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC7 — GET /api/v1/clientes/{id} returns 200 with correct client object when client exists
 *   AC7 — GET /api/v1/clientes/{id} returns 404 Problem Details (RFC 7807) when client does not exist
 *
 * Tests hit the real backend API at API_BASE_URL.
 * Seed data is created via POST /api/v1/clientes and cleaned up after each test.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

// ─────────────────────────────────────────────────────────────────────────────
// AC7 (happy path): GET /api/v1/clientes/{id} returns 200 with client object
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — GET /api/v1/clientes/{id} happy path', () => {
  test('should return HTTP 200 when GET /api/v1/clientes/{id} is called with an existing client id', async ({ request }) => {
    // GIVEN: A client exists in the database
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD Detail Test ${Date.now()}`,
        nit: `DTL${Date.now()}`.slice(0, 12),
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });
    const created = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes/{id} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created?.id ?? 'missing-implementation'}`);

    // THEN: The response status is 200
    expect(response.status()).toBe(200);

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    }
  });

  test('should return Content-Type application/json from GET /api/v1/clientes/{id}', async ({ request }) => {
    // GIVEN: A client exists in the database
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD ContentType ${Date.now()}`,
        nit: `CT${Date.now()}`.slice(0, 12),
        telefono: null,
        ciudad: null,
      },
    });
    const created = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes/{id} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created?.id ?? 'missing-implementation'}`);

    // THEN: Content-Type includes application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    }
  });

  test('should return a JSON object (not an array) from GET /api/v1/clientes/{id}', async ({ request }) => {
    // GIVEN: A client exists
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD Object Shape ${Date.now()}`,
        nit: `OBJ${Date.now()}`.slice(0, 12),
        telefono: null,
        ciudad: null,
      },
    });
    const created = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created?.id ?? 'missing-implementation'}`);
    const body = await response.json();

    // THEN: The body is a plain object, not an array
    expect(Array.isArray(body)).toBe(false);
    expect(typeof body).toBe('object');

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    }
  });

  test('should return all required fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt', async ({ request }) => {
    // GIVEN: A client with all fields is created
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD All Fields ${Date.now()}`,
        nit: `AF${Date.now()}`.slice(0, 12),
        telefono: '3007654321',
        ciudad: 'Medellín',
      },
    });
    const created = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created?.id ?? 'missing-implementation'}`);
    const body = await response.json();

    // THEN: All required fields are present
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('nombre');
    expect(body).toHaveProperty('nit');
    expect(body).toHaveProperty('telefono');
    expect(body).toHaveProperty('ciudad');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    }
  });

  test('should return the correct field values matching the created client', async ({ request }) => {
    // GIVEN: A client with specific values is created
    const uniqueNombre = `ATDD Correct Values ${Date.now()}`;
    const uniqueNit = `CV${Date.now()}`.slice(0, 12);
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: uniqueNombre,
        nit: uniqueNit,
        telefono: '3009876543',
        ciudad: 'Cali',
      },
    });
    const created = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created?.id ?? 'missing-implementation'}`);
    const body = await response.json();

    // THEN: The returned values match what was created
    expect(body.nombre).toBe(uniqueNombre);
    expect(body.nit).toBe(uniqueNit);
    expect(body.telefono).toBe('3009876543');
    expect(body.ciudad).toBe('Cali');

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    }
  });

  test('should return id as a valid UUID string from GET /api/v1/clientes/{id}', async ({ request }) => {
    // GIVEN: A client is created
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD UUID ${Date.now()}`,
        nit: `UUID${Date.now()}`.slice(0, 12),
        telefono: null,
        ciudad: null,
      },
    });
    const created = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created?.id ?? 'missing-implementation'}`);
    const body = await response.json();

    // THEN: The id field matches UUID v4 format
    expect(UUID_REGEX.test(body.id)).toBe(true);

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    }
  });

  test('should return createdAt and updatedAt as ISO 8601 datetime strings', async ({ request }) => {
    // GIVEN: A client is created
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD Dates ${Date.now()}`,
        nit: `DT${Date.now()}`.slice(0, 12),
        telefono: null,
        ciudad: null,
      },
    });
    const created = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created?.id ?? 'missing-implementation'}`);
    const body = await response.json();

    // THEN: createdAt and updatedAt are ISO 8601 formatted
    expect(ISO_REGEX.test(body.createdAt)).toBe(true);
    expect(ISO_REGEX.test(body.updatedAt)).toBe(true);

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    }
  });

  test('should return null for telefono when client was created with null telefono', async ({ request }) => {
    // GIVEN: A client is created with null telefono
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: `ATDD Null Tel ${Date.now()}`,
        nit: `NT${Date.now()}`.slice(0, 12),
        telefono: null,
        ciudad: null,
      },
    });
    const created = createResponse.status() === 201 ? await createResponse.json() : null;

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created?.id ?? 'missing-implementation'}`);
    const body = await response.json();

    // THEN: telefono is null in the response
    expect(body.telefono).toBeNull();

    // Cleanup
    if (created?.id) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 (not-found path): GET /api/v1/clientes/{id} returns 404 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — GET /api/v1/clientes/{id} not-found (404 Problem Details)', () => {
  test('should return HTTP 404 when GET /api/v1/clientes/{id} is called with a non-existent id', async ({ request }) => {
    // GIVEN: A clienteId that does not exist in the database
    const nonExistentId = '00000000-0000-4000-8000-000000000000';

    // WHEN: GET /api/v1/clientes/{id} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: The response status is 404
    expect(response.status()).toBe(404);
  });

  test('should return Problem Details RFC 7807 shape on 404 — field "title" present', async ({ request }) => {
    // GIVEN: A non-existent clienteId
    const nonExistentId = '00000000-0000-4000-8000-000000000001';

    // WHEN: GET /api/v1/clientes/{id} returns 404
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();

    // THEN: Problem Details has a "title" field
    expect(body).toHaveProperty('title');
  });

  test('should return Problem Details RFC 7807 shape on 404 — field "status" equals 404', async ({ request }) => {
    // GIVEN: A non-existent clienteId
    const nonExistentId = '00000000-0000-4000-8000-000000000002';

    // WHEN: GET /api/v1/clientes/{id} returns 404
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();

    // THEN: Problem Details has "status" === 404
    expect(body.status).toBe(404);
  });

  test('should return "Cliente no encontrado." as the title in Problem Details 404 response', async ({ request }) => {
    // GIVEN: A non-existent clienteId
    const nonExistentId = '00000000-0000-4000-8000-000000000003';

    // WHEN: GET /api/v1/clientes/{id} returns 404
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();

    // THEN: The title is "Cliente no encontrado."
    expect(body.title).toBe('Cliente no encontrado.');
  });

  test('should NOT expose stack traces or internal exception details in 404 response body', async ({ request }) => {
    // GIVEN: A non-existent clienteId
    const nonExistentId = '00000000-0000-4000-8000-000000000004';

    // WHEN: GET /api/v1/clientes/{id} returns 404
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body = await response.json();
    const bodyStr = JSON.stringify(body);

    // THEN: No internal details are exposed (NFR6 compliance)
    expect(bodyStr).not.toContain('StackTrace');
    expect(bodyStr).not.toContain('InnerException');
    expect(bodyStr).not.toContain('System.');
  });

  test('should return 404 for a syntactically valid but non-existent UUID', async ({ request }) => {
    // GIVEN: A valid UUID v4 format that doesn't correspond to any client
    const validButAbsentUuid = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${validButAbsentUuid}`);

    // THEN: Response is 404 (not 500 or 400)
    expect(response.status()).toBe(404);
  });
});
