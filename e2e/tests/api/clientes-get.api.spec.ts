/**
 * Story 2.1: Client List & Search — API Contract Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC5 — GET /api/v1/clientes returns HTTP 200 with a JSON array of client objects
 *          (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
 *          directly (no wrapper object), sourced from the `clientes` PostgreSQL table.
 *
 * Test status: RED — tests will fail until backend implementation is complete.
 *   - ClienteEntity, IClienteRepository, ClienteRepository do not exist yet
 *   - GET /api/v1/clientes endpoint does not exist yet
 *   - `clientes` table does not exist yet (EF Core migration not run)
 *
 * Framework: Playwright API testing (@playwright/test)
 * Priority: P2 (TC-E2-P2-04)
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — GET /api/v1/clientes returns 200 with JSON array
// (TC-E2-P2-04)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — GET /api/v1/clientes API contract', () => {
  const createdIds: string[] = [];
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ request }) => {
    apiHelper = new ApiHelper(request);
  });

  test.afterEach(async () => {
    for (const id of createdIds) {
      await apiHelper.deleteCliente(id).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should return HTTP 200 when GET /api/v1/clientes is called', async ({ request }) => {
    // GIVEN: The clientes endpoint exists (not yet — RED phase)

    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: HTTP 200 is returned
    expect(response.status()).toBe(200);
  });

  test('should return a JSON array (not a wrapper object) when GET /api/v1/clientes is called', async ({ request }) => {
    // GIVEN: The clientes endpoint is available
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: Response body is a JSON array
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return an empty array when the clientes table has no records', async ({ request }) => {
    // GIVEN: No clients exist in the system

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: Response is 200 with an empty JSON array (not null, not undefined)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return 3 items when 3 clients exist in the database', async ({ request }) => {
    // GIVEN: 3 clients are seeded via the API
    apiHelper = new ApiHelper(request);
    for (let i = 0; i < 3; i++) {
      const data = buildCliente();
      const created = await apiHelper.createCliente(data);
      createdIds.push(created.id);
    }

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: Response body contains at least 3 items
    const body = await response.json() as unknown[];
    expect(body.length).toBeGreaterThanOrEqual(3);
  });

  test('should return client objects with an "id" field that is a valid UUID', async ({ request }) => {
    // GIVEN: At least one client exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: Each client item has an "id" that is a valid UUID v4 or v7 (R-008 mitigation)
    const body = await response.json() as Array<{ id: string }>;
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].id).toMatch(UUID_REGEX);
  });

  test('should return client objects with a "nombre" field', async ({ request }) => {
    // GIVEN: A client with nombre "Empresa API Test" exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nombre: 'Empresa API Test' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: At least one item has "nombre" = "Empresa API Test"
    const body = await response.json() as Array<{ nombre: string }>;
    const found = body.find((c) => c.nombre === 'Empresa API Test');
    expect(found).toBeDefined();
  });

  test('should return client objects with a "nit" field', async ({ request }) => {
    // GIVEN: A client with nit "555666777-8" exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ nit: '555666777-8' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: At least one item has "nit" = "555666777-8"
    const body = await response.json() as Array<{ nit: string }>;
    const found = body.find((c) => c.nit === '555666777-8');
    expect(found).toBeDefined();
  });

  test('should return client objects with a "telefono" field', async ({ request }) => {
    // GIVEN: A client with telefono "+57 300 111 2222" exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ telefono: '+57 300 111 2222' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: At least one item has "telefono" = "+57 300 111 2222"
    const body = await response.json() as Array<{ telefono: string }>;
    const found = body.find((c) => c.telefono === '+57 300 111 2222');
    expect(found).toBeDefined();
  });

  test('should return client objects with a "ciudad" field', async ({ request }) => {
    // GIVEN: A client with ciudad "Cartagena" exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente({ ciudad: 'Cartagena' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: At least one item has "ciudad" = "Cartagena"
    const body = await response.json() as Array<{ ciudad: string }>;
    const found = body.find((c) => c.ciudad === 'Cartagena');
    expect(found).toBeDefined();
  });

  test('should return client objects with a "createdAt" field in ISO 8601 format', async ({ request }) => {
    // GIVEN: At least one client exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: Each client object has "createdAt" as a valid ISO 8601 date string with timezone
    const body = await response.json() as Array<{ createdAt: string }>;
    expect(body.length).toBeGreaterThan(0);
    const date = new Date(body[0].createdAt);
    expect(isNaN(date.getTime())).toBe(false);
  });

  test('should return client objects with an "updatedAt" field in ISO 8601 format', async ({ request }) => {
    // GIVEN: At least one client exists
    apiHelper = new ApiHelper(request);
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: Each client object has "updatedAt" as a valid ISO 8601 date string
    const body = await response.json() as Array<{ updatedAt: string }>;
    expect(body.length).toBeGreaterThan(0);
    const date = new Date(body[0].updatedAt);
    expect(isNaN(date.getTime())).toBe(false);
  });

  test('should return response Content-Type application/json', async ({ request }) => {
    // GIVEN: The clientes endpoint exists

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: Content-Type header is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });
});
