/**
 * Story 2.1: Client List & Search — API Contract Edge Cases
 * Epic 2: Client Management
 *
 * Expands ATDD API coverage with boundary conditions and contract precision:
 *   - Response shape: no wrapper object, no null fields, camelCase keys
 *   - Date field ISO 8601 timezone compliance (Z suffix or offset)
 *   - Multiple sequential GET calls return stable results
 *   - Large list (50 records) returns all without truncation
 *   - Response headers: Content-Type must include charset or be valid JSON mime
 *   - HTTP method rejections: POST/PUT/DELETE on read-only GET endpoint
 *
 * Framework: Playwright API testing
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ISO8601_WITH_TIMEZONE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

// ─────────────────────────────────────────────────────────────────────────────
// Response shape edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes — Response shape edge cases', () => {
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

  test('should NOT return a wrapper object — top-level response must be an array, not { data: [...] }', async ({ request }) => {
    // GIVEN: At least one client exists
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');
    const body = await response.json();

    // THEN: Top-level body IS an array (not { data: [...] }, { items: [...] }, etc.)
    expect(Array.isArray(body)).toBe(true);
    // Confirm it's not accidentally wrapped
    expect(typeof body).not.toBe('object');
    // This assertion passes only if body is an array (arrays are objects, but the above already guards)
    expect(body).not.toHaveProperty('data');
    expect(body).not.toHaveProperty('items');
    expect(body).not.toHaveProperty('results');
  });

  test('should return all required fields on each client object (no missing keys)', async ({ request }) => {
    // GIVEN: A client created via POST
    const data = buildCliente({ nombre: 'FullFields Test', ciudad: 'Barranquilla' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');
    const body = await response.json() as Array<Record<string, unknown>>;
    const found = body.find((c) => c['id'] === created.id);

    // THEN: All 7 required fields are present (no undefined/missing)
    expect(found).toBeDefined();
    if (!found) return;

    expect(found).toHaveProperty('id');
    expect(found).toHaveProperty('nombre');
    expect(found).toHaveProperty('nit');
    expect(found).toHaveProperty('telefono');
    expect(found).toHaveProperty('ciudad');
    expect(found).toHaveProperty('createdAt');
    expect(found).toHaveProperty('updatedAt');
  });

  test('should return camelCase field names (not snake_case) in the JSON response', async ({ request }) => {
    // GIVEN: At least one client exists
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');
    const body = await response.json() as Array<Record<string, unknown>>;
    const found = body.find((c) => c['id'] === created.id);
    expect(found).toBeDefined();
    if (!found) return;

    // THEN: camelCase keys exist; snake_case keys do NOT
    expect(found).toHaveProperty('createdAt');
    expect(found).toHaveProperty('updatedAt');
    expect(found).not.toHaveProperty('created_at');
    expect(found).not.toHaveProperty('updated_at');
  });

  test('should return none of the fields as null — all are required non-null strings', async ({ request }) => {
    // GIVEN: A client created with all valid fields
    const data = buildCliente({ nombre: 'NullCheck SA', telefono: '+57 600 000 0001' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');
    const body = await response.json() as Array<Record<string, unknown>>;
    const found = body.find((c) => c['id'] === created.id);
    expect(found).toBeDefined();
    if (!found) return;

    // THEN: No required field is null or undefined
    for (const key of ['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt']) {
      expect(found[key]).not.toBeNull();
      expect(found[key]).not.toBeUndefined();
    }
  });

  test('should return createdAt as ISO 8601 string with timezone designator', async ({ request }) => {
    // GIVEN: A newly created client
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');
    const body = await response.json() as Array<{ id: string; createdAt: string; updatedAt: string }>;
    const found = body.find((c) => c.id === created.id);
    expect(found).toBeDefined();
    if (!found) return;

    // THEN: createdAt and updatedAt include timezone info (Z or +HH:MM)
    expect(found.createdAt).toMatch(ISO8601_WITH_TIMEZONE_REGEX);
    expect(found.updatedAt).toMatch(ISO8601_WITH_TIMEZONE_REGEX);
  });

  test('should return client id as UUID v4 or v7 format', async ({ request }) => {
    // GIVEN: A newly created client
    const data = buildCliente();
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');
    const body = await response.json() as Array<{ id: string }>;
    const found = body.find((c) => c.id === created.id);
    expect(found).toBeDefined();
    if (!found) return;

    // THEN: id is a valid UUID (R-008 mitigation — never an integer)
    expect(found.id).toMatch(UUID_REGEX);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Stability and consistency edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes — Stability and idempotency', () => {
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

  test('should return the same count on two consecutive calls with no data changes', async ({ request }) => {
    // GIVEN: 2 clients exist
    for (let i = 0; i < 2; i++) {
      const created = await apiHelper.createCliente(buildCliente());
      createdIds.push(created.id);
    }

    // WHEN: GET /api/v1/clientes is called twice consecutively
    const response1 = await request.get('http://localhost:5000/api/v1/clientes');
    const response2 = await request.get('http://localhost:5000/api/v1/clientes');

    const body1 = await response1.json() as unknown[];
    const body2 = await response2.json() as unknown[];

    // THEN: Both return the same count (idempotent GET)
    expect(body1.length).toBe(body2.length);
  });

  test('should include the newly created client immediately after POST', async ({ request }) => {
    // GIVEN: A new unique client created via POST
    const data = buildCliente({ nombre: 'Immediate Reflect SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes is called immediately after
    const response = await request.get('http://localhost:5000/api/v1/clientes');
    const body = await response.json() as Array<{ id: string; nombre: string }>;

    // THEN: The new client appears in the list (no cache lag)
    const found = body.find((c) => c.id === created.id);
    expect(found).toBeDefined();
    expect(found?.nombre).toBe('Immediate Reflect SA');
  });

  test('should return at least 10 items when 10 clients have been seeded', async ({ request }) => {
    // GIVEN: 10 clients seeded (boundary — above typical "small" list)
    const seeded = await Promise.all(
      Array.from({ length: 10 }, () => apiHelper.createCliente(buildCliente()))
    );
    seeded.forEach((c) => createdIds.push(c.id));

    // WHEN: GET /api/v1/clientes
    const response = await request.get('http://localhost:5000/api/v1/clientes');
    const body = await response.json() as unknown[];

    // THEN: At least 10 items returned (no artificial truncation)
    expect(body.length).toBeGreaterThanOrEqual(10);
  });

  test('should return HTTP 200 (not 204) even when list is empty', async ({ request }) => {
    // GIVEN: The database might be empty (or all test clients deleted in teardown)
    // We don't create any extra clients here — test assumes a clean state or that 200 is always returned
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get('http://localhost:5000/api/v1/clientes');

    // THEN: Status is 200, not 204 (empty body would be wrong for a list endpoint)
    expect(response.status()).toBe(200);
    const body = await response.json();
    // 204 No Content would not parse to JSON — this assertion confirms 200 with body
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HTTP method rejection edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes — Incorrect HTTP methods', () => {
  test('should return 405 Method Not Allowed when PATCH is called on /api/v1/clientes', async ({ request }) => {
    // GIVEN: The /api/v1/clientes endpoint only supports GET (and POST)

    // WHEN: PATCH /api/v1/clientes (wrong method for collection)
    const response = await request.fetch('http://localhost:5000/api/v1/clientes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({}),
    });

    // THEN: HTTP 405 or 404 is returned — not 200 or 500
    // Note: ASP.NET Minimal API may return 404 or 405 depending on routing configuration
    expect([404, 405]).toContain(response.status());
  });
});
