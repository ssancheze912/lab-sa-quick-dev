/**
 * API Integration Tests — Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * RED PHASE: These tests are intentionally written to FAIL until the implementation
 * described in story 2-2-client-detail-view.md is complete.
 *
 * Test level: API Integration (Playwright request context against http://localhost:5000)
 *
 * Acceptance Criteria covered:
 *   AC#2 — GET /api/v1/clientes/:id returns 200 with full ClienteDto for a known ID (FR30)
 *   AC#3 — GET /api/v1/clientes/:id returns 404 Problem Details for an unknown ID
 *
 * Test cases:
 *   TC-E2-P2-02    — Backend GET /api/v1/clientes/:id returns 200 + ClienteDto shape
 *   TC-E2-P2-02-fe — Backend GET /api/v1/clientes/unknown returns 404 Problem Details
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// TC-E2-P2-02 — GET /api/v1/clientes/:id — 200 with ClienteDto shape
// ---------------------------------------------------------------------------

test.describe('GET /api/v1/clientes/:id — 200 with ClienteDto (TC-E2-P2-02)', () => {
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

  test('should return HTTP 200 when GET /api/v1/clientes/:id with a valid existing ID', async ({ request }) => {
    // GIVEN: A client has been seeded in the system
    const clienteData = buildCliente({ nombre: 'Empresa Get By Id SA' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes/:id is called with the seeded client's id
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);

    // THEN: HTTP 200 OK is returned
    expect(response.status()).toBe(200);
  });

  test('should return Content-Type application/json for GET /api/v1/clientes/:id', async ({ request }) => {
    // GIVEN: A client exists in the system
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is application/json (single object, not wrapped)
    expect(contentType).toContain('application/json');
  });

  test('should return a single ClienteDto object (not an array) for GET /api/v1/clientes/:id', async ({ request }) => {
    // GIVEN: A client exists in the system
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const body = await response.json();

    // THEN: The response body is a single object, not an array
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
  });

  test('ClienteDto from GET /api/v1/clientes/:id must have a valid UUID "id" field', async ({ request }) => {
    // GIVEN: A client exists with a known ID
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: The returned id matches the requested id and is a valid UUID
    expect(body['id']).toBe(createdId);
    expect(body['id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test('ClienteDto from GET /api/v1/clientes/:id must return correct "nombre" field', async ({ request }) => {
    // GIVEN: A client with nombre "Empresa Nombre Test" exists
    const clienteData = buildCliente({ nombre: 'Empresa Nombre Test' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: The "nombre" field matches the seeded value
    expect(body['nombre']).toBe('Empresa Nombre Test');
  });

  test('ClienteDto from GET /api/v1/clientes/:id must return correct "nit" field', async ({ request }) => {
    // GIVEN: A client with nit "900777888-9" exists
    const clienteData = buildCliente({ nit: '900777888-9' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: The "nit" field matches the seeded value
    expect(body['nit']).toBe('900777888-9');
  });

  test('ClienteDto from GET /api/v1/clientes/:id must return correct "telefono" field', async ({ request }) => {
    // GIVEN: A client with telefono "3005551122" exists
    const clienteData = buildCliente({ telefono: '3005551122' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: The "telefono" field matches the seeded value
    expect(body['telefono']).toBe('3005551122');
  });

  test('ClienteDto from GET /api/v1/clientes/:id must return correct "ciudad" field', async ({ request }) => {
    // GIVEN: A client with ciudad "Cali" exists
    const clienteData = buildCliente({ ciudad: 'Cali' });
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: The "ciudad" field matches the seeded value
    expect(body['ciudad']).toBe('Cali');
  });

  test('ClienteDto from GET /api/v1/clientes/:id must have "createdAt" in ISO 8601 with timezone', async ({ request }) => {
    // GIVEN: A client exists with a server-generated timestamp
    const clienteData = buildCliente();
    const created = await apiHelper.createCliente(clienteData);
    createdId = created.id;

    // WHEN: GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${createdId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: The "createdAt" field is a valid ISO 8601 string with timezone (DateTimeOffset)
    expect(typeof body['createdAt']).toBe('string');
    expect(body['createdAt']).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
    );
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P2-02 — GET /api/v1/clientes/:id — 404 Problem Details for unknown ID
// ---------------------------------------------------------------------------

test.describe('GET /api/v1/clientes/:id — 404 Problem Details for unknown ID (TC-E2-P2-02)', () => {
  test('should return HTTP 404 when GET /api/v1/clientes/00000000-0000-0000-0000-000000000000', async ({ request }) => {
    // GIVEN: No client exists with the null UUID
    // WHEN: GET /api/v1/clientes/00000000-0000-0000-0000-000000000000 is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000000`,
    );

    // THEN: HTTP 404 Not Found is returned
    expect(response.status()).toBe(404);
  });

  test('should return Content-Type application/problem+json for 404 response', async ({ request }) => {
    // GIVEN: No client exists with the null UUID
    // WHEN: GET /api/v1/clientes/00000000-0000-0000-0000-000000000000 is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000000`,
    );
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is application/problem+json (RFC 7807)
    expect(contentType).toContain('application/problem+json');
  });

  test('should return Problem Details body with "status": 404 for unknown client ID', async ({ request }) => {
    // GIVEN: No client exists with the null UUID
    // WHEN: GET /api/v1/clientes/00000000-0000-0000-0000-000000000000 is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000000`,
    );
    const body = await response.json() as Record<string, unknown>;

    // THEN: The Problem Details body contains "status": 404
    expect(body['status']).toBe(404);
  });

  test('should return Problem Details body with Spanish "title" field for unknown client ID', async ({ request }) => {
    // GIVEN: No client exists with the null UUID
    // WHEN: GET /api/v1/clientes/00000000-0000-0000-0000-000000000000 is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000000`,
    );
    const body = await response.json() as Record<string, unknown>;

    // THEN: The Problem Details body has a Spanish "title" field (NFR6 - no stack traces)
    expect(typeof body['title']).toBe('string');
    expect(body['title']).toBeTruthy();
    // Must NOT expose internal error details
    expect(body['title']).not.toContain('StackTrace');
    expect(body['title']).not.toContain('at System.');
  });

  test('Problem Details response must NOT include stack traces or internal .NET fields (NFR6)', async ({ request }) => {
    // GIVEN: No client exists with the null UUID
    // WHEN: GET /api/v1/clientes/00000000-0000-0000-0000-000000000000 is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/clientes/00000000-0000-0000-0000-000000000000`,
    );
    const body = await response.text();

    // THEN: No internal error information is exposed (NFR6)
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('at System.');
    expect(body).not.toContain('InnerException');
  });
});
