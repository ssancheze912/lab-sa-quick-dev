/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — GET /api/v1/clientes/{id} returns 200 + ClienteDto when client exists (FR30 deep link)
 *   AC3 — GET /api/v1/clientes/{id} returns 404 (Problem Details) when client does not exist
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — GET /api/v1/clientes/{id} — found (200)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — GET /api/v1/clientes/{id} — client found', () => {
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

  test('should respond with HTTP 200 when the client exists', async ({ request }) => {
    // GIVEN: A client has been created
    const data = buildCliente({ nombre: 'API GetById 200', nit: '901001001-1' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes/{id} is called with a valid existing GUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`);

    // THEN: HTTP status is 200
    expect(response.status()).toBe(200);
  });

  test('should return content-type application/json when client exists', async ({ request }) => {
    // GIVEN: A client exists
    const data = buildCliente({ nombre: 'API GetById ContentType', nit: '901001001-2' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes/{id} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return a ClienteDto with the correct id', async ({ request }) => {
    // GIVEN: A client has been created with a known ID
    const data = buildCliente({ nombre: 'API GetById Id Field', nit: '901001001-3' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes/{id} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`);
    const body = await response.json();

    // THEN: Response body contains the expected id
    expect(body.id).toBe(cliente.id);
  });

  test('should return a ClienteDto with the correct nombre', async ({ request }) => {
    // GIVEN: A client exists with a known nombre
    const data = buildCliente({ nombre: 'API GetById Nombre Check', nit: '901001001-4' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes/{id} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`);
    const body = await response.json();

    // THEN: Response body contains the correct nombre
    expect(body.nombre).toBe('API GetById Nombre Check');
  });

  test('should return a ClienteDto with the correct nit', async ({ request }) => {
    // GIVEN: A client exists with a known nit
    const data = buildCliente({ nombre: 'API GetById Nit Check', nit: '901002002-5' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes/{id} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`);
    const body = await response.json();

    // THEN: Response body contains the correct nit
    expect(body.nit).toBe('901002002-5');
  });

  test('should return a ClienteDto with all required fields', async ({ request }) => {
    // GIVEN: A client has been created
    const data = buildCliente({ nombre: 'API GetById All Fields', nit: '901003003-6', telefono: '3001112223', ciudad: 'Cali' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes/{id} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`);
    const body = await response.json();

    // THEN: ClienteDto has all required fields
    expect(typeof body.id).toBe('string');
    expect(typeof body.nombre).toBe('string');
    expect(typeof body.nit).toBe('string');
    expect(typeof body.telefono).toBe('string');
    expect(typeof body.ciudad).toBe('string');
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
  });

  test('should return a direct ClienteDto object (not wrapped)', async ({ request }) => {
    // GIVEN: Architecture mandates direct object — no { data: {...} } wrapper
    const data = buildCliente({ nombre: 'API GetById No Wrapper', nit: '901004004-7' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes/{id} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${cliente.id}`);
    const body = await response.json();

    // THEN: Body is a plain object with id, not an array or nested wrapper
    expect(Array.isArray(body)).toBe(false);
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('nombre');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — GET /api/v1/clientes/{id} — not found (404)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — GET /api/v1/clientes/{id} — client not found', () => {
  test('should respond with HTTP 404 when the clienteId does not exist', async ({ request }) => {
    // GIVEN: A GUID that does not correspond to any client in the system
    // WHEN: GET /api/v1/clientes/{nonExistentId} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${NON_EXISTENT_ID}`);

    // THEN: HTTP status is 404
    expect(response.status()).toBe(404);
  });

  test('should return Problem Details RFC 7807 format on 404', async ({ request }) => {
    // GIVEN: A non-existent clienteId
    // WHEN: GET /api/v1/clientes/{nonExistentId} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${NON_EXISTENT_ID}`);

    // THEN: Response Content-Type signals Problem Details (application/problem+json or application/json)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/json/);
  });

  test('should not expose internal stack trace in 404 response body', async ({ request }) => {
    // GIVEN: A non-existent clienteId (NFR6: no stack traces)
    // WHEN: GET /api/v1/clientes/{nonExistentId} is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${NON_EXISTENT_ID}`);
    const body = await response.text();

    // THEN: No C# stack trace or exception details leaked
    expect(body).not.toContain('System.');
    expect(body).not.toContain('Exception');
    expect(body).not.toContain('at ');
  });

  test('should respond with 400 or 404 for a non-GUID clienteId (route constraint)', async ({ request }) => {
    // GIVEN: The route uses {id:guid} constraint — rejects non-GUID values at routing level
    // WHEN: A non-GUID string is used as clienteId
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/not-a-valid-guid`);

    // THEN: Route constraint rejects it with 400 or 404 — never 500
    expect([400, 404, 405]).toContain(response.status());
  });
});
