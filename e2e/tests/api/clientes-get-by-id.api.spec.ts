/**
 * Story 2.2: Client Detail View — API Contract Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC7 — GET /api/v1/clientes/{id} returns HTTP 200 with ClienteDto when record exists
 *   AC8 — GET /api/v1/clientes/{id} returns HTTP 404 with Problem Details RFC 7807 when not found
 *
 * Test scenarios from test-design-epic-2.md:
 *   TC-E2-P2-06 — GET /api/v1/clientes/{id} returns 404 + application/problem+json
 *
 * Test status: RED — tests will fail until GET /api/v1/clientes/{id} endpoint is implemented.
 *   - GetClienteByIdQuery / GetClienteByIdQueryHandler do NOT exist yet
 *   - GET /api/v1/clientes/{id:guid} endpoint does NOT exist yet
 *
 * Framework: Playwright API testing (@playwright/test)
 *
 * Given-When-Then structure.
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — GET /api/v1/clientes/{id} returns 200 + ClienteDto when record exists
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — GET /api/v1/clientes/{id} returns ClienteDto on 200', () => {
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

  test('should return HTTP 200 when GET /api/v1/clientes/{id} is called with an existing id', async ({ request }) => {
    // GIVEN: A client has been created and its UUID is known
    const data = buildCliente({ nombre: 'API Test Corp', nit: '900999000-1' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id} is called with the known UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN: HTTP 200 is returned
    expect(response.status()).toBe(200);
  });

  test('should return a ClienteDto JSON object (not an array) for an existing id', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'DTO Shape Test SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET request with the UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: Body is an object (not an array, not wrapped)
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
  });

  test('should return ClienteDto with an "id" field matching the requested UUID', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'ID Match Test SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: The returned id matches the requested UUID (R-008 mitigation: no integer PK leak)
    expect(body.id).toBe(created.id);
    expect(body.id).toMatch(UUID_V4_REGEX);
  });

  test('should return ClienteDto with "nombre" field matching the seeded value', async ({ request }) => {
    // GIVEN: A client with a known nombre
    const data = buildCliente({ nombre: 'Nombre Verify SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: Nombre is correct in the response
    expect(body.nombre).toBe('Nombre Verify SA');
  });

  test('should return ClienteDto with "nit" field matching the seeded value', async ({ request }) => {
    // GIVEN: A client with a known NIT
    const data = buildCliente({ nombre: 'NIT Test SA', nit: '800300100-4' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: NIT is correct
    expect(body.nit).toBe('800300100-4');
  });

  test('should return ClienteDto with "telefono" field', async ({ request }) => {
    // GIVEN: A client with a known telefono
    const data = buildCliente({ nombre: 'Telefono Test SA', telefono: '+57 604 888 7766' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: Telefono is present and correct
    expect(body.telefono).toBe('+57 604 888 7766');
  });

  test('should return ClienteDto with "ciudad" field', async ({ request }) => {
    // GIVEN: A client with a known ciudad
    const data = buildCliente({ nombre: 'Ciudad Test SA', ciudad: 'Barranquilla' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: Ciudad is correct
    expect(body.ciudad).toBe('Barranquilla');
  });

  test('should return ClienteDto with "createdAt" field in ISO 8601 format', async ({ request }) => {
    // GIVEN: A newly created client
    const data = buildCliente({ nombre: 'CreatedAt ISO Test SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: createdAt is a valid ISO 8601 date string with timezone
    expect(body.createdAt).toBeDefined();
    expect(new Date(body.createdAt).toString()).not.toBe('Invalid Date');
    // Must contain a timezone offset or Z (ISO 8601 with timezone)
    expect(body.createdAt).toMatch(/Z$|[+-]\d{2}:\d{2}$/);
  });

  test('should return ClienteDto with "updatedAt" field in ISO 8601 format', async ({ request }) => {
    // GIVEN: A newly created client
    const data = buildCliente({ nombre: 'UpdatedAt ISO Test SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body = await response.json();

    // THEN: updatedAt is a valid ISO 8601 date string
    expect(body.updatedAt).toBeDefined();
    expect(new Date(body.updatedAt).toString()).not.toBe('Invalid Date');
    expect(body.updatedAt).toMatch(/Z$|[+-]\d{2}:\d{2}$/);
  });

  test('should return Content-Type application/json for a 200 response', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'ContentType Test SA' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN: Content-Type is application/json
    expect(response.headers()['content-type']).toContain('application/json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC8 + TC-E2-P2-06 — GET /api/v1/clientes/{id} returns 404 + Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 + TC-E2-P2-06 — GET /api/v1/clientes/{id} returns 404 + Problem Details', () => {
  const NON_EXISTENT_ID = '00000000-0000-4000-8000-000000000000';

  test('should return HTTP 404 when GET /api/v1/clientes/{id} record does not exist (TC-E2-P2-06)', async ({ request }) => {
    // GIVEN: A non-existent UUID is requested
    // WHEN: GET /api/v1/clientes/{non-existent-uuid}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${NON_EXISTENT_ID}`);

    // THEN: HTTP 404 is returned
    expect(response.status()).toBe(404);
  });

  test('should return Content-Type application/problem+json on 404 (TC-E2-P2-06, NFR6)', async ({ request }) => {
    // GIVEN: A non-existent UUID
    // WHEN: GET request
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${NON_EXISTENT_ID}`);

    // THEN: Problem Details content type
    expect(response.headers()['content-type']).toContain('application/problem+json');
  });

  test('should return a Problem Details RFC 7807 body on 404 (TC-E2-P2-06)', async ({ request }) => {
    // GIVEN: A non-existent UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${NON_EXISTENT_ID}`);
    const body = await response.json();

    // THEN: Body conforms to Problem Details RFC 7807
    expect(body.status).toBe(404);
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('should NOT expose a stack trace in the 404 response body (NFR6)', async ({ request }) => {
    // GIVEN: A non-existent UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${NON_EXISTENT_ID}`);
    const body = await response.json();
    const bodyStr = JSON.stringify(body);

    // THEN: No stack trace fields are present (NFR6 — no internal info exposed)
    expect(bodyStr).not.toContain('stackTrace');
    expect(bodyStr).not.toContain('StackTrace');
    expect(bodyStr).not.toContain('exception');
    expect(bodyStr).not.toContain('Exception');
    expect(bodyStr).not.toContain('innerException');
  });

  test('should not return HTTP 200 for a non-existent UUID', async ({ request }) => {
    // GIVEN: A non-existent UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${NON_EXISTENT_ID}`);

    // THEN: Status is NOT 200
    expect(response.status()).not.toBe(200);
  });
});
