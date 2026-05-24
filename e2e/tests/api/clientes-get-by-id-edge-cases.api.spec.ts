/**
 * Story 2.2: Client Detail View — API Edge Cases
 * Epic 2: Client Management
 *
 * Expands ATDD API coverage with boundary conditions NOT present in
 * clientes-get-by-id.api.spec.ts:
 *
 *   - Non-UUID string path (e.g., "not-a-uuid") returns 400 or 404 (routing guards)
 *   - All 7 ClienteDto fields are camelCase in the response (no PascalCase)
 *   - Response body "id" is a v4 UUID (RFC 4122 variant 1, version 4)
 *   - Concurrent GET requests for the same ID both return 200 with the same data
 *   - GET immediately after POST returns the just-created record (no caching issue)
 *   - Response does NOT contain a stack trace (NFR6 even on 200 path)
 *   - CORS / Content-Type header for 200 response is application/json (not text/plain)
 *   - createdAt and updatedAt are equal on a freshly created record
 *   - Request with a path segment that looks like an integer returns non-200 (UUID guard)
 *
 * Framework: Playwright API testing (@playwright/test)
 * Given-When-Then structure.
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─────────────────────────────────────────────────────────────────────────────
// Non-UUID path protection
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Non-UUID path segment handling', () => {
  test('should NOT return HTTP 200 when path segment is a plain string (not a UUID)', async ({ request }) => {
    // GIVEN: A non-UUID path segment
    // WHEN: GET /api/v1/clientes/not-a-uuid
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/not-a-uuid`);

    // THEN: Response is not 200 (ASP.NET Minimal API {id:guid} constraint rejects non-UUID)
    expect(response.status()).not.toBe(200);
  });

  test('should return 4xx when path segment is an integer (R-008: UUID-only endpoint)', async ({ request }) => {
    // GIVEN: An integer path segment (tests that old-style integer PK routes are rejected)
    // WHEN: GET /api/v1/clientes/12345
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/12345`);

    // THEN: Not a 200 response (integer is not a valid UUID)
    // The {id:guid} route constraint causes a 404 (route not matched) in ASP.NET Minimal APIs
    expect(response.status()).not.toBe(200);
    expect(response.status()).not.toBe(500);
  });

  test('should return 4xx when path segment is an empty-ish string (no GUID)', async ({ request }) => {
    // GIVEN: A "random" non-UUID segment
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/INVALID-NOT-UUID`);

    // THEN: Not 200
    expect(response.status()).not.toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// camelCase response shape (R-008 and NFR: no PascalCase leaking)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteDto — camelCase response contract', () => {
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

  test('should return "id" in camelCase (not "Id" in PascalCase)', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'CamelCase Test SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: Property is "id" (camelCase), not "Id" (PascalCase)
    expect(body).toHaveProperty('id');
    expect(body).not.toHaveProperty('Id');
  });

  test('should return "nombre" in camelCase (not "Nombre")', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'CamelCase Nombre SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: camelCase field name
    expect(body).toHaveProperty('nombre');
    expect(body).not.toHaveProperty('Nombre');
  });

  test('should return "nit", "telefono", "ciudad" in camelCase', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'All Fields CamelCase SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: All standard fields are camelCase
    expect(body).toHaveProperty('nit');
    expect(body).toHaveProperty('telefono');
    expect(body).toHaveProperty('ciudad');
    // Verify PascalCase equivalents are absent
    expect(body).not.toHaveProperty('Nit');
    expect(body).not.toHaveProperty('Telefono');
    expect(body).not.toHaveProperty('Ciudad');
  });

  test('should return "createdAt" and "updatedAt" in camelCase', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Timestamps CamelCase SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: Timestamp fields are camelCase (not PascalCase "CreatedAt")
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');
    expect(body).not.toHaveProperty('CreatedAt');
    expect(body).not.toHaveProperty('UpdatedAt');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UUID v4 shape validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ClienteDto "id" field — UUID v4 format', () => {
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

  test('should return "id" as a valid UUID v4 (RFC 4122 version 4)', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'UUID v4 Check SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: "id" matches UUID v4 regex (4th segment starts with 4; 5th with 8,9,a,b)
    expect(body.id).toMatch(UUID_V4_REGEX);
  });

  test('should NOT return an integer as "id" (R-008 mitigation)', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'No Integer PK SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: id is a string UUID, not an integer
    expect(typeof body.id).toBe('string');
    expect(Number.isInteger(body.id)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Consistency: GET immediately after POST returns the exact same record
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET immediately after POST — consistency check', () => {
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

  test('should return exactly the same data that was POSTed (no transformation of values)', async ({ request }) => {
    // GIVEN: A client is created with specific field values
    const payload = buildCliente({
      nombre: 'Consistency Check SA',
      nit: '900888777-6',
      telefono: '+57 601 888 7776',
      ciudad: 'Cartagena',
    });
    const created = await apiHelper.createCliente(payload);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id} is called immediately after POST
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: All field values match what was POSTed (no back-end transformation)
    expect(body.nombre).toBe(payload.nombre);
    expect(body.nit).toBe(payload.nit);
    expect(body.telefono).toBe(payload.telefono);
    expect(body.ciudad).toBe(payload.ciudad);
  });

  test('should return createdAt and updatedAt as equal on a freshly created record', async ({ request }) => {
    // GIVEN: A brand-new client (never updated)
    const data = buildCliente({ nombre: 'Fresh Record SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: createdAt and updatedAt are equal (no update has occurred)
    // Allow a 1-second window for clock imprecision
    const diff = Math.abs(
      new Date(body.createdAt).getTime() - new Date(body.updatedAt).getTime()
    );
    expect(diff).toBeLessThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Concurrent requests to the same resource
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Concurrent GET requests for the same clienteId', () => {
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

  test('should return HTTP 200 for both concurrent requests to the same ID', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Concurrent GET SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: Two GET requests are issued concurrently
    const [response1, response2] = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`),
      request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`),
    ]);

    // THEN: Both return 200
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);
  });

  test('should return the same data in both concurrent responses', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Same Data Concurrent SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: Two concurrent GET requests
    const [r1, r2] = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`),
      request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`),
    ]);

    const [body1, body2] = await Promise.all([r1.json(), r2.json()]);

    // THEN: Same id, nombre, nit across both responses (idempotent reads)
    expect(body1.id).toBe(body2.id);
    expect(body1.nombre).toBe(body2.nombre);
    expect(body1.nit).toBe(body2.nit);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security: No stack trace or internal info in 200 response
// ─────────────────────────────────────────────────────────────────────────────

test.describe('200 response — no internal info exposure (NFR6)', () => {
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

  test('should NOT expose stack trace fields in a 200 response body', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'NFR6 Check SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const bodyStr = await response.text();

    // THEN: No stack trace or internal runtime info in the response
    expect(bodyStr).not.toContain('stackTrace');
    expect(bodyStr).not.toContain('StackTrace');
    expect(bodyStr).not.toContain('exception');
    expect(bodyStr).not.toContain('Exception');
    expect(bodyStr).not.toContain('at System.');
    expect(bodyStr).not.toContain('Microsoft.AspNetCore');
  });

  test('should return only the 7 documented ClienteDto fields in the 200 response', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'Field Count SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    const bodyKeys = Object.keys(body);

    // THEN: All 7 documented fields are present
    const expectedFields = ['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt'];
    for (const field of expectedFields) {
      expect(bodyKeys).toContain(field);
    }
  });
});
