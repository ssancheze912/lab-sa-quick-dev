/**
 * Story 2.2: Client Detail View — API Edge Case Tests
 *
 * Expands coverage beyond ATDD tests (clientes-getbyid-api.spec.ts).
 * Covers:
 *   - id field is a valid UUID v4 format in 200 response
 *   - createdAt and updatedAt are valid ISO 8601 dates
 *   - Response has exactly 7 fields (no extra fields exposed)
 *   - Concurrent GET requests to same /{id} return consistent data
 *   - Malformed (non-UUID) path segment returns 4xx (not 500)
 *   - Empty Guid (all zeros) consistently returns 404
 *   - Response Content-Type for 200 is application/json
 *
 * Does NOT duplicate coverage from clientes-getbyid-api.spec.ts.
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.2 — GET /api/v1/clientes/{id} API edge cases', () => {
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

  // ─── id field is valid UUID v4 format in the 200 response ──────────────────

  test('[P1] id field in 200 response should be a valid UUID (8-4-4-4-12 hex format)', async ({ request }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'UUID Format Test', nit: '900701001-1' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    expect(response.status()).toBe(200);
    const body: Record<string, unknown> = await response.json();

    // THEN: id is a valid UUID (8-4-4-4-12 hex format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(typeof body['id']).toBe('string');
    expect(body['id'] as string).toMatch(uuidRegex);
  });

  // ─── createdAt and updatedAt are valid ISO 8601 dates ──────────────────────

  test('[P1] createdAt and updatedAt should be valid ISO 8601 date strings in 200 response', async ({ request }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'ISO Date Test', nit: '900701002-2' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    expect(response.status()).toBe(200);
    const body: Record<string, unknown> = await response.json();

    // THEN: createdAt and updatedAt parse as valid dates
    const createdAt = new Date(body['createdAt'] as string);
    const updatedAt = new Date(body['updatedAt'] as string);

    expect(isNaN(createdAt.getTime())).toBe(false);
    expect(isNaN(updatedAt.getTime())).toBe(false);

    // AND: dates are not in the far future (sanity check)
    expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now() + 5000);
    expect(updatedAt.getTime()).toBeLessThanOrEqual(Date.now() + 5000);
  });

  // ─── Response has exactly 7 fields (no extra fields) ──────────────────────

  test('[P1] 200 response body should have exactly 7 fields per API contract', async ({ request }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'Field Count Test', nit: '900701003-3' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    expect(response.status()).toBe(200);
    const body: Record<string, unknown> = await response.json();

    // THEN: exactly 7 camelCase fields (per API contract)
    const keys = Object.keys(body).sort();
    expect(keys).toEqual(
      ['ciudad', 'createdAt', 'id', 'nombre', 'nit', 'telefono', 'updatedAt']
    );
  });

  // ─── Concurrent requests to same /{id} return consistent data ─────────────

  test('[P2] concurrent GET requests to same /{id} should return consistent data', async ({ request }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'Concurrent Test', nit: '900701004-4' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: two concurrent GET requests for the same ID
    const [response1, response2] = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`),
      request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`),
    ]);

    // THEN: both return 200
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    const body1: Record<string, unknown> = await response1.json();
    const body2: Record<string, unknown> = await response2.json();

    // AND: both return identical data
    expect(body1['id']).toBe(body2['id']);
    expect(body1['nombre']).toBe(body2['nombre']);
    expect(body1['nit']).toBe(body2['nit']);
  });

  // ─── Malformed (non-UUID) path segment returns 4xx — NOT 500 ──────────────

  test('[P1] malformed (non-UUID) path segment should return 4xx — not 500 server error', async ({ request }) => {
    // GIVEN: a non-UUID string as path segment
    const malformedId = 'not-a-valid-uuid-at-all';

    // WHEN: GET /api/v1/clientes/{malformed-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${malformedId}`);

    // THEN: response is a 4xx error (400 Bad Request or 404 Not Found)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  // ─── Malformed path segment body does not expose stack trace ──────────────

  test('[P1] malformed path segment response body should not expose internal details (NFR6)', async ({ request }) => {
    // GIVEN: a non-UUID string as path segment
    const malformedId = 'not-a-valid-uuid';

    // WHEN: GET /api/v1/clientes/{malformed-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${malformedId}`);

    // THEN: response body (if any) does not expose stack trace or exception details
    const text = await response.text();
    expect(text).not.toContain('StackTrace');
    expect(text).not.toContain('stackTrace');
    expect(text).not.toContain('Exception');
    expect(text).not.toContain('InnerException');
    expect(text).not.toContain('System.');
  });

  // ─── Empty GUID consistently returns 404 ──────────────────────────────────

  test('[P1] Guid.Empty (00000000-...) should consistently return 404 Not Found', async ({ request }) => {
    // GIVEN: the all-zeros UUID (Guid.Empty) — guaranteed never to exist
    const emptyGuid = '00000000-0000-0000-0000-000000000000';

    // WHEN: two separate GET requests for the same non-existent Guid.Empty
    const [response1, response2] = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/clientes/${emptyGuid}`),
      request.get(`${API_BASE_URL}/api/v1/clientes/${emptyGuid}`),
    ]);

    // THEN: both consistently return 404
    expect(response1.status()).toBe(404);
    expect(response2.status()).toBe(404);
  });

  // ─── Content-Type for 200 response is application/json ────────────────────

  test('[P1] 200 response should have Content-Type: application/json', async ({ request }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'Content-Type Test', nit: '900701005-5' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    expect(response.status()).toBe(200);

    // THEN: Content-Type contains application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  // ─── nombre field is non-empty in 200 response ────────────────────────────

  test('[P2] nombre field should be a non-empty string in the 200 response', async ({ request }) => {
    // GIVEN: a client with a valid nombre
    const data = buildCliente({ nombre: 'Nombre Non-Empty Test', nit: '900701006-6' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body: Record<string, unknown> = await response.json();

    // THEN: nombre is a non-empty string
    expect(typeof body['nombre']).toBe('string');
    expect((body['nombre'] as string).trim().length).toBeGreaterThan(0);
  });

  // ─── id in response matches the id in the request URL ─────────────────────

  test('[P1] id field in response should match the UUID used in the request URL', async ({ request }) => {
    // GIVEN: a client with a known UUID
    const data = buildCliente({ nombre: 'ID Match Test', nit: '900701007-7' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    expect(response.status()).toBe(200);
    const body: Record<string, unknown> = await response.json();

    // THEN: returned id matches the requested UUID (case-insensitive)
    expect((body['id'] as string).toLowerCase()).toBe(created.id.toLowerCase());
  });
});
