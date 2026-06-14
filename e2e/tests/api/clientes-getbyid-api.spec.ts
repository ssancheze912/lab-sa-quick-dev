/**
 * Story 2.2: Client Detail View — API Integration Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - GET /api/v1/clientes/{id} endpoint does not exist yet
 * - GetClienteByIdQueryHandler / GetClienteByIdQuery not yet implemented
 * - IClienteRepository.GetByIdAsync not yet implemented
 *
 * Acceptance Criteria covered:
 *   AC#3 — Direct URL /clientes/:clienteId loads correct client via GET /api/v1/clientes/{id}
 *   AC#4 — Non-existent clienteId returns graceful not-found (HTTP 404 Problem Details)
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P1-05: GET /api/v1/clientes/{id} returns 404 for non-existent ID
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.2 — GET /api/v1/clientes/{id} endpoint', () => {
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

  // ─── AC#3: GET /api/v1/clientes/{id} — Existing client returns 200 ──────────

  test('AC#3 — should return 200 OK with correct ClienteDto for an existing ID', async ({ request }) => {
    // GIVEN: a client exists in the system
    const data = buildCliente({ nombre: 'Empresa Detail Test', nit: '900222333-1' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id} is called with the known UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN: HTTP status is 200 OK
    expect(response.status()).toBe(200);

    // AND: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');

    // AND: response body contains the correct client data
    const body: Record<string, unknown> = await response.json();
    expect(body['id']).toBe(created.id);
    expect(body['nombre']).toBe('Empresa Detail Test');
    expect(body['nit']).toBe('900222333-1');
  });

  test('AC#3 — should return all 7 required fields per API contract', async ({ request }) => {
    // GIVEN: a client exists in the system
    const data = buildCliente({ nombre: 'Empresa Campos Test', nit: '900444555-2' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    expect(response.status()).toBe(200);

    const body: Record<string, unknown> = await response.json();

    // THEN: all 7 required fields present (camelCase, per API contract)
    expect(typeof body['id']).toBe('string');
    expect(typeof body['nombre']).toBe('string');
    expect(typeof body['nit']).toBe('string');
    expect(typeof body['telefono']).toBe('string');
    expect(typeof body['ciudad']).toBe('string');
    expect(typeof body['createdAt']).toBe('string');
    expect(typeof body['updatedAt']).toBe('string');
  });

  test('AC#3 — should return exact field values matching the seeded client', async ({ request }) => {
    // GIVEN: a client with all known field values
    const data = buildCliente({
      nombre: 'Siesa Tech Colombia',
      nit: '800666777-3',
      telefono: '6014445566',
      ciudad: 'Medellín',
    });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body: Record<string, unknown> = await response.json();

    // THEN: each field matches the seeded value exactly
    expect(body['nombre']).toBe('Siesa Tech Colombia');
    expect(body['nit']).toBe('800666777-3');
    expect(body['telefono']).toBe('6014445566');
    expect(body['ciudad']).toBe('Medellín');
  });

  test('AC#3 — should NOT expose EF Core navigation property names (PascalCase)', async ({ request }) => {
    // GIVEN: a client exists
    const data = buildCliente({ nombre: 'Empresa Shape Test', nit: '900800900-4' });
    const created = await apiHelper.createCliente(data);
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);
    const body: Record<string, unknown> = await response.json();

    // THEN: no PascalCase (EF Core) fields in the response
    const keys = Object.keys(body);
    expect(keys).not.toContain('Nombre');
    expect(keys).not.toContain('Nit');
    expect(keys).not.toContain('Id');
    expect(keys).not.toContain('Ciudad');
  });

  // ─── AC#4: GET /api/v1/clientes/{id} — Non-existent ID returns 404 ──────────
  // Test case: TC-E2-P1-05

  test('AC#4 — should return 404 Not Found for a non-existent UUID (TC-E2-P1-05)', async ({ request }) => {
    // GIVEN: a UUID that does not exist in the database
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{non-existent-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: HTTP status is 404 Not Found
    expect(response.status()).toBe(404);
  });

  test('AC#4 — should return Problem Details (application/problem+json) for 404 (TC-E2-P1-05)', async ({ request }) => {
    // GIVEN: a UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{non-existent-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN: Content-Type is application/problem+json (RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('AC#4 — 404 response body should contain status 404 and a descriptive title', async ({ request }) => {
    // GIVEN: a UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{non-existent-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body: Record<string, unknown> = await response.json();

    // THEN: Problem Details body has status 404
    expect(body['status']).toBe(404);

    // AND: has a descriptive title (per architecture.md: "Cliente no encontrado.")
    expect(typeof body['title']).toBe('string');
    expect((body['title'] as string).length).toBeGreaterThan(0);
  });

  test('AC#4 — 404 response must NOT expose stack trace or internal exception details (NFR6)', async ({ request }) => {
    // GIVEN: a UUID that does not exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN: GET /api/v1/clientes/{non-existent-id}
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);
    const body: Record<string, unknown> = await response.json();

    // THEN: no stack trace or internal exception details in response
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('StackTrace');
    expect(bodyStr).not.toContain('stackTrace');
    expect(bodyStr).not.toContain('Exception');
    expect(bodyStr).not.toContain('InnerException');
  });
});
