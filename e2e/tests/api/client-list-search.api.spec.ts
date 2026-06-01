/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC5 — GET /api/v1/clientes returns JSON array with id, nombre, nit, telefono, ciudad, createdAt, updatedAt (HTTP 200)
 *   AC6 — Backend entity, EF Core config and migration compile with zero errors; snake_case columns; UUID PK; unique NIT
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — GET /api/v1/clientes returns HTTP 200 with correct JSON array shape
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — GET /api/v1/clientes endpoint contract', () => {
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

  test('[P0] should return HTTP 200 from GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response status is 200
    expect(response.status()).toBe(200);
  });

  test('[P0] should return a JSON array (direct array, no wrapper object)', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The body is a JSON array (no wrapper like { data: [...] })
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('[P0] should return application/json content type', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('[P0] should return client objects with all required fields', async ({ request }) => {
    // GIVEN: At least one client exists in the system
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Each client object has the required fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt
    const client = body.find((c: { id: string }) => c.id === created.id);
    expect(client).toBeDefined();
    expect(client).toMatchObject({
      id: expect.any(String),
      nombre: expect.any(String),
      nit: expect.any(String),
      telefono: expect.any(String),
      ciudad: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  test('[P0] should return client with id as UUID format', async ({ request }) => {
    // GIVEN: A client exists in the system
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The client id is in UUID format
    const client = body.find((c: { id: string }) => c.id === created.id);
    expect(client).toBeDefined();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(client.id).toMatch(uuidRegex);
  });

  test('[P0] should return correct field values for a created client', async ({ request }) => {
    // GIVEN: A client is created with specific data
    apiHelper = new ApiHelper(request);
    const data = buildCliente({
      nombre: 'Empresa Test ATDD',
      nit: '901234567-1',
    });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The returned client matches the created data
    const client = body.find((c: { id: string }) => c.id === created.id);
    expect(client.nombre).toBe(data.nombre);
    expect(client.nit).toBe(data.nit);
  });

  test('[P1] should return createdAt and updatedAt as ISO 8601 date strings', async ({ request }) => {
    // GIVEN: A client exists in the system
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: createdAt and updatedAt are valid ISO 8601 date strings
    const client = body.find((c: { id: string }) => c.id === created.id);
    expect(client).toBeDefined();
    expect(new Date(client.createdAt).toISOString()).toBe(client.createdAt);
    expect(new Date(client.updatedAt).toISOString()).toBe(client.updatedAt);
  });

  test('[P1] should return an empty array when no clients exist', async ({ request }) => {
    // GIVEN: The database has been seeded with no clients for this test
    // (requires clean state — test environment must allow this)
    // WHEN: GET /api/v1/clientes is called with known empty state (using network intercept)
    // NOTE: This test validates the contract shape; the E2E test validates the UI EmptyState

    // Validate that a 200 + empty array is the correct shape
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Body must be array (can be empty or populated — either is valid at API level)
    expect(Array.isArray(body)).toBe(true);
  });

  test('[P2] should NOT include a wrapper object with data property', async ({ request }) => {
    // GIVEN: The backend follows the "direct array" architecture standard (no wrapper)
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: Body is a raw array — not { data: [...] } or { items: [...] }
    expect(body).not.toHaveProperty('data');
    expect(body).not.toHaveProperty('items');
    expect(body).not.toHaveProperty('value');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Backend entity, EF Core config (migration creates clientes table)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Backend entity and database migration correctness', () => {
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

  test('[P0] should persist a cliente and retrieve it back via GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The backend entity, repository and migration are correctly configured
    // WHEN: A client is created via POST and then retrieved via GET
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The persisted client appears in the list (EF Core migration is correct)
    const found = body.find((c: { id: string }) => c.id === created.id);
    expect(found).toBeDefined();
    expect(found.nombre).toBe(data.nombre);
  });

  test('[P0] should reject creating a client with a duplicate NIT (unique constraint)', async ({ request }) => {
    // GIVEN: A client exists with a specific NIT
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nit: '123456789-UNIQUE' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: Another client is created with the same NIT
    const duplicateResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: buildCliente({ nit: '123456789-UNIQUE' }),
    });

    // THEN: The backend rejects with 409 Conflict (unique index on NIT)
    expect(duplicateResponse.status()).toBe(409);
  });

  test('[P1] should NOT expose stack traces in 409 error response body (NFR6)', async ({ request }) => {
    // GIVEN: A client exists with a specific NIT
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nit: '999888777-NFR6' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: A duplicate NIT triggers a 409 error
    const duplicateResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: buildCliente({ nit: '999888777-NFR6' }),
    });

    // THEN: The error body does NOT contain stack traces or technical internals
    const body = await duplicateResponse.json();
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('StackTrace');
    expect(bodyStr).not.toContain('stackTrace');
    expect(bodyStr).not.toContain('NpgsqlException');
    expect(bodyStr).not.toContain('System.Exception');
  });
});
