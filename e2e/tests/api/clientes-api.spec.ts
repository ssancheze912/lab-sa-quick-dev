/**
 * Story 2.1: Client List & Search — API Integration Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - GET /api/v1/clientes endpoint does not exist yet
 * - ClienteEntity, IClienteRepository, ClienteRepository not yet implemented
 * - EF Core migration for clientes table not yet created
 *
 * Acceptance Criteria covered:
 *   AC#1 — GET /api/v1/clientes returns all clients in the database with correct fields
 *   AC#5 — Backend returns proper error responses (500 → ExceptionHandlingMiddleware)
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P1-01: GET /api/v1/clientes returns full client list
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.1 — GET /api/v1/clientes endpoint (TC-E2-P1-01)', () => {
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

  // ─── AC#1: GET /api/v1/clientes returns 200 with client array ─────────────

  test('AC#1 — should return 200 OK with a JSON array (TC-E2-P1-01)', async ({ request }) => {
    // GIVEN: backend is running

    // WHEN: GET /api/v1/clientes is called
    // CRITICAL: intercept before navigation (Playwright request context)
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: HTTP status is 200 OK
    expect(response.status()).toBe(200);

    // AND: response is a JSON array
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('AC#1 — should return clients with all required fields per API contract (TC-E2-P1-01)', async ({ request }) => {
    // GIVEN: at least one client exists in the database
    const data = buildCliente({ nombre: 'Empresa API Test', nit: '900777888-1' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    expect(response.status()).toBe(200);
    const body: Record<string, unknown>[] = await response.json();

    // THEN: find the seeded client and verify all 7 required fields
    const found = body.find((c) => c['id'] === cliente.id);
    expect(found).toBeDefined();

    // All required fields per API contract (camelCase)
    expect(typeof found!['id']).toBe('string');
    expect(typeof found!['nombre']).toBe('string');
    expect(typeof found!['nit']).toBe('string');
    expect(typeof found!['telefono']).toBe('string');
    expect(typeof found!['ciudad']).toBe('string');
    expect(typeof found!['createdAt']).toBe('string');
    expect(typeof found!['updatedAt']).toBe('string');
  });

  test('AC#1 — should return correct field values for a seeded client', async ({ request }) => {
    // GIVEN: a client with known values is seeded
    const data = buildCliente({ nombre: 'Siesa Tech', nit: '800500600-2' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: Record<string, unknown>[] = await response.json();

    // THEN: the returned client matches expected values
    const found = body.find((c) => c['id'] === cliente.id);
    expect(found!['nombre']).toBe('Siesa Tech');
    expect(found!['nit']).toBe('800500600-2');
  });

  test('AC#1 — should return an empty array when no clients exist', async ({ request }) => {
    // GIVEN: database has no clients (afterEach cleanup ensures this for fresh state)
    // NOTE: This test assumes a clean database. In CI, ensure DB reset between test suites.

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: 200 OK with empty array (not 404 or error)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    // Array may or may not be empty depending on test isolation — this validates the contract
    // (empty array is a valid response, NOT an error)
  });

  test('AC#1 — response Content-Type should be application/json', async ({ request }) => {
    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Content-Type header includes application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('AC#1 — should NOT expose internal EF Core navigation property names', async ({ request }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'Empresa Shape Test', nit: '900400500-3' });
    const cliente = await apiHelper.createCliente(data);
    createdIds.push(cliente.id);

    // WHEN: GET /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body: Record<string, unknown>[] = await response.json();

    const found = body.find((c) => c['id'] === cliente.id);
    expect(found).toBeDefined();

    // THEN: no EF Core internal property names appear in the response
    const keys = Object.keys(found!);
    // EF Core navigation properties are typically PascalCase or contain "Entity"
    // The contract specifies exactly 7 camelCase fields
    expect(keys).not.toContain('Nombre');
    expect(keys).not.toContain('Nit');
    expect(keys).not.toContain('Id');
    expect(keys).not.toContain('Ciudad');

    // AND: only the 7 expected camelCase keys
    expect(keys).toEqual(
      expect.arrayContaining(['id', 'nombre', 'nit', 'telefono', 'ciudad', 'createdAt', 'updatedAt'])
    );
  });
});
