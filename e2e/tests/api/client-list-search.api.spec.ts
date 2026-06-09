/**
 * API Integration Tests — Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * RED PHASE: These tests are intentionally written to FAIL until the implementation
 * described in story 2-1-client-list-search.md is complete.
 *
 * Test level: API Integration (Playwright request context against http://localhost:5000)
 *
 * Acceptance Criteria covered:
 *   AC#1 — GET /api/v1/clientes returns 200 with ClienteDto[] array
 *   AC#1 — Each ClienteDto has required fields: id, nombre, nit, telefono, ciudad, createdAt
 *   TC-E2-P2-01 — Backend GET /api/v1/clientes returns array of ClienteDto
 *   TC-E2-P3-04 — useClientes hook returns typed Cliente[] (contract validated via API shape)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// TC-E2-P2-01 — GET /api/v1/clientes returns 200 with ClienteDto[]
// ---------------------------------------------------------------------------

test.describe('GET /api/v1/clientes — endpoint contract (TC-E2-P2-01)', () => {
  test('should return HTTP 200 when GET /api/v1/clientes is requested', async ({ request }) => {
    // GIVEN: The backend is running and the clientes endpoint is registered
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: HTTP 200 OK is returned
    expect(response.status()).toBe(200);
  });

  test('should return Content-Type application/json for GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The clientes endpoint is registered and returns JSON
    // WHEN: A GET request is made
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is application/json
    expect(contentType).toContain('application/json');
  });

  test('should return a JSON array (not a wrapped object) from GET /api/v1/clientes', async ({ request }) => {
    // GIVEN: The API contract specifies a direct array (no wrapper object)
    // WHEN: The endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json();

    // THEN: The response body is a JSON array
    expect(Array.isArray(body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ClienteDto shape validation — each item must have all required fields
// ---------------------------------------------------------------------------

test.describe('GET /api/v1/clientes — ClienteDto shape validation', () => {
  let apiHelper: ApiHelper;
  let createdId: string | null = null;

  test.beforeEach(({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    if (createdId) {
      await apiHelper.deleteCliente(createdId).catch(() => null);
      createdId = null;
    }
  });

  test('each ClienteDto must have an "id" field that is a UUID string', async ({ request }) => {
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // GIVEN: At least one client exists in the system
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: The created client is in the list with a valid UUID id
    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();
    expect(typeof found!['id']).toBe('string');
    expect(found!['id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test('each ClienteDto must have a "nombre" field (non-empty string)', async ({ request }) => {
    const clienteData = buildCliente({ nombre: 'Empresa Test Shape' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // GIVEN: A client with nombre "Empresa Test Shape" exists
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: The client has the correct "nombre" field
    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();
    expect(found!['nombre']).toBe('Empresa Test Shape');
  });

  test('each ClienteDto must have a "nit" field (non-empty string)', async ({ request }) => {
    const clienteData = buildCliente({ nit: '123456789-0' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // GIVEN: A client with nit "123456789-0" exists
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: The client has the correct "nit" field
    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();
    expect(found!['nit']).toBe('123456789-0');
  });

  test('each ClienteDto must have a "telefono" field (string)', async ({ request }) => {
    const clienteData = buildCliente({ telefono: '3009876543' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // GIVEN: A client with telefono "3009876543" exists
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: The client has the correct "telefono" field
    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();
    expect(found!['telefono']).toBe('3009876543');
  });

  test('each ClienteDto must have a "ciudad" field (string)', async ({ request }) => {
    const clienteData = buildCliente({ ciudad: 'Medellín' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // GIVEN: A client with ciudad "Medellín" exists
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: The client has the correct "ciudad" field
    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();
    expect(found!['ciudad']).toBe('Medellín');
  });

  test('each ClienteDto must have a "createdAt" field in ISO 8601 format with timezone', async ({ request }) => {
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // GIVEN: A client was created with a server-generated timestamp
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: The createdAt field is a valid ISO 8601 string with timezone offset (DateTimeOffset)
    const found = body.find((c) => c['id'] === createdId);
    expect(found).toBeDefined();
    expect(typeof found!['createdAt']).toBe('string');
    // ISO 8601 with timezone (Z or +HH:MM)
    expect(found!['createdAt']).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
    );
  });

  test('ClienteDto must NOT include stack traces or internal error fields', async ({ request }) => {
    // GIVEN: The endpoint is working and the client list is returned
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.text();

    // THEN: No stack trace or internal .NET error fields are present (NFR6)
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('at System.');
    expect(body).not.toContain('InnerException');
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P2-01 — Empty array returned when no clients exist
// ---------------------------------------------------------------------------

test.describe('GET /api/v1/clientes — empty state contract', () => {
  test('should return an empty JSON array (not null) when no clients exist', async ({ request }) => {
    // NOTE: This test assumes the DB is clean. In CI, use a fresh DB per test run.
    // In local dev, this may pass with existing data — the key assertion is array type.

    // GIVEN: The backend is running
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: A JSON array is returned (not null, not 404, not a wrapped object)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P2-01 — Ordering: results ordered by createdAt descending
// ---------------------------------------------------------------------------

test.describe('GET /api/v1/clientes — default ordering', () => {
  let apiHelper: ApiHelper;
  const createdIds: string[] = [];

  test.beforeEach(({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should return clients ordered by createdAt descending (newest first)', async ({ request }) => {
    // GIVEN: Two clients created sequentially (first created is older)
    const olderData = buildCliente({ nombre: 'Cliente Más Antiguo' });
    const newerData = buildCliente({ nombre: 'Cliente Más Reciente' });

    const older = await apiHelper.createCliente(olderData);
    createdIds.push(older.id);
    // Small delay to ensure different createdAt timestamps
    await new Promise((r) => setTimeout(r, 50));
    const newer = await apiHelper.createCliente(newerData);
    createdIds.push(newer.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<{ id: string; nombre: string; createdAt: string }>;

    // THEN: The newer client appears before the older client in the list
    const olderIndex = body.findIndex((c) => c.id === older.id);
    const newerIndex = body.findIndex((c) => c.id === newer.id);

    expect(olderIndex).toBeGreaterThan(-1);
    expect(newerIndex).toBeGreaterThan(-1);
    expect(newerIndex).toBeLessThan(olderIndex);
  });
});
