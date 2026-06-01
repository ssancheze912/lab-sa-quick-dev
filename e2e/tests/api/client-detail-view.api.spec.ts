/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC7 — GET /api/v1/clientes/{id} returns HTTP 200 with full client object for valid UUID
 *         and HTTP 404 in Problem Details RFC 7807 format for unknown UUID
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — GET /api/v1/clientes/{id} endpoint contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — GET /api/v1/clientes/{id} endpoint contract', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('[P0] should return HTTP 200 for GET /api/v1/clientes/{id} with a valid UUID', async ({ request }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/:id is called with the valid UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN: Response status is 200
    expect(response.status()).toBe(200);
  });

  test('[P0] should return application/json content type for client detail', async ({ request }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('[P0] should return a single client object (not an array) for a valid UUID', async ({ request }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: The response body is a single object (not an array)
    expect(Array.isArray(body)).toBe(false);
    expect(typeof body).toBe('object');
  });

  test('[P0] should return all required fields for a client detail', async ({ request }) => {
    // GIVEN: A client is created with full data
    const data = buildCliente({
      nombre: 'Empresa Detail ATDD',
      nit: '901234500-7',
      telefono: '3001112222',
      ciudad: 'Bogotá',
    });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: The client object has all required fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt
    expect(body).toMatchObject({
      id: expect.any(String),
      nombre: expect.any(String),
      nit: expect.any(String),
      telefono: expect.any(String),
      ciudad: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  test('[P0] should return correct field values matching the created client', async ({ request }) => {
    // GIVEN: A client is created with specific data
    const data = buildCliente({
      nombre: 'Empresa Values ATDD',
      nit: '901234501-8',
      telefono: '3003334444',
      ciudad: 'Medellín',
    });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: The returned values match exactly what was created
    expect(body.id).toBe(created.id);
    expect(body.nombre).toBe(data.nombre);
    expect(body.nit).toBe(data.nit);
    expect(body.telefono).toBe(data.telefono);
    expect(body.ciudad).toBe(data.ciudad);
  });

  test('[P0] should return id in UUID format', async ({ request }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: The id is in UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(body.id).toMatch(uuidRegex);
  });

  test('[P1] should return createdAt and updatedAt as ISO 8601 date strings', async ({ request }) => {
    // GIVEN: A client exists in the system
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: createdAt and updatedAt are valid ISO 8601 date strings
    expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
    expect(new Date(body.updatedAt).toISOString()).toBe(body.updatedAt);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // HTTP 404 — Unknown UUID — Problem Details RFC 7807
  // ─────────────────────────────────────────────────────────────────────────────

  test('[P0] should return HTTP 404 for GET /api/v1/clientes/{id} with an unknown UUID', async ({ request }) => {
    // GIVEN: A UUID that does not exist in the system
    const unknownId = '00000000-0000-0000-0000-000000000404';

    // WHEN: GET /api/v1/clientes/:id is called with the unknown UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${unknownId}`);

    // THEN: Response status is 404
    expect(response.status()).toBe(404);
  });

  test('[P0] should return Problem Details RFC 7807 format for 404 response', async ({ request }) => {
    // GIVEN: An unknown UUID
    const unknownId = '00000000-0000-0000-0000-000000000405';

    // WHEN: GET /api/v1/clientes/:id is called with an unknown UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${unknownId}`);
    const body = await response.json();

    // THEN: The response body conforms to Problem Details RFC 7807
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('status');
    expect(body.status).toBe(404);
  });

  test('[P0] should return "Cliente no encontrado" as the title in the 404 Problem Details', async ({ request }) => {
    // GIVEN: An unknown UUID
    const unknownId = '00000000-0000-0000-0000-000000000406';

    // WHEN: GET /api/v1/clientes/:id is called with an unknown UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${unknownId}`);
    const body = await response.json();

    // THEN: The title is "Cliente no encontrado" (in Spanish, per domain language)
    expect(body.title).toBe('Cliente no encontrado');
  });

  test('[P0] should NOT expose stack traces or internal details in 404 response body (NFR6)', async ({ request }) => {
    // GIVEN: An unknown UUID triggers a 404
    const unknownId = '00000000-0000-0000-0000-000000000407';

    // WHEN: GET /api/v1/clientes/:id is called with an unknown UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${unknownId}`);
    const body = await response.json();
    const bodyStr = JSON.stringify(body);

    // THEN: No stack traces or technical internals are exposed (NFR6 compliance)
    expect(bodyStr).not.toContain('StackTrace');
    expect(bodyStr).not.toContain('stackTrace');
    expect(bodyStr).not.toContain('NpgsqlException');
    expect(bodyStr).not.toContain('System.Exception');
    expect(bodyStr).not.toContain('SiesaAgents.Infrastructure');
  });

  test('[P1] should NOT accept non-UUID values in the {id:guid} route (route constraint)', async ({ request }) => {
    // GIVEN: The route is constrained to {id:guid}
    // WHEN: A non-GUID value is passed in the URL
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/not-a-valid-uuid`);

    // THEN: The route does not match — 404 (no handler found, ASP.NET routing rejects non-GUID)
    expect(response.status()).toBe(404);
  });
});
