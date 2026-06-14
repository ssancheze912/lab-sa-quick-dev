/**
 * Story 2.3: Create Client — API Integration Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - POST /api/v1/clientes endpoint does not exist yet
 * - CreateClienteRequest DTO, FluentValidation, CreateClienteCommandHandler not yet implemented
 * - NIT/RUC uniqueness check (IClienteRepository.NitExistsAsync) not yet implemented
 *
 * Acceptance Criteria covered:
 *   AC#2 — POST /api/v1/clientes creates a client and returns 201 with correct body
 *   AC#3 — POST with missing required field returns 400 Problem Details
 *   AC#4 — POST with duplicate NIT/RUC returns 409 Conflict Problem Details
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P0-01: POST /api/v1/clientes — NIT/RUC Uniqueness Returns 409 Conflict
 *   TC-E2-P0-02: POST /api/v1/clientes — Missing Required Fields Returns 400
 *   TC-E2-P1-02: POST /api/v1/clientes — Creates Client and Returns 201 with Location Header
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

test.describe('Story 2.3 — POST /api/v1/clientes endpoint', () => {
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

  // ─── TC-E2-P1-02: POST creates client and returns 201 with Location header ───

  test('AC#2 — should return 201 Created with new client body (TC-E2-P1-02)', async ({ request }) => {
    // GIVEN: valid client payload
    const data = buildCliente({ nombre: 'Siesa Tech', nit: '800555111-0', ciudad: 'Medellín' });

    // WHEN: POST /api/v1/clientes (intercept via Playwright request context)
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: HTTP status is 201 Created
    expect(response.status()).toBe(201);

    // AND: response body contains the created client with a UUID id
    const body = await response.json();
    expect(body).toMatchObject({
      nombre: data.nombre,
      nit: data.nit,
      telefono: data.telefono,
      ciudad: data.ciudad,
    });
    expect(typeof body.id).toBe('string');
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    createdIds.push(body.id);
  });

  test('AC#2 — should return Location header pointing to the new client (TC-E2-P1-02)', async ({ request }) => {
    // GIVEN: valid client payload
    const data = buildCliente({ nombre: 'Empresa Location Test', nit: '900123001-1' });

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    expect(response.status()).toBe(201);

    const body = await response.json();
    createdIds.push(body.id);

    // THEN: Location header points to /api/v1/clientes/{new-id}
    const location = response.headers()['location'] ?? '';
    expect(location).toContain(`/api/v1/clientes/${body.id}`);
  });

  test('AC#2 — POST then GET should confirm client was persisted (TC-E2-P1-02)', async ({ request }) => {
    // GIVEN: a client is created via POST
    const data = buildCliente({ nombre: 'Empresa Persistencia', nit: '900123002-2' });
    const postResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    expect(postResponse.status()).toBe(201);

    const created = await postResponse.json();
    createdIds.push(created.id);

    // WHEN: GET /api/v1/clientes/{id} is called
    const getResponse = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN: the client is found and matches created data
    expect(getResponse.status()).toBe(200);
    const fetched = await getResponse.json();
    expect(fetched.id).toBe(created.id);
    expect(fetched.nombre).toBe(data.nombre);
    expect(fetched.nit).toBe(data.nit);
  });

  test('AC#2 — response includes createdAt and updatedAt timestamps', async ({ request }) => {
    // GIVEN: valid client payload
    const data = buildCliente({ nombre: 'Empresa Timestamps', nit: '900123003-3' });

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    expect(response.status()).toBe(201);

    const body = await response.json();
    createdIds.push(body.id);

    // THEN: timestamps are present and are valid ISO strings
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
    expect(new Date(body.createdAt).getTime()).not.toBeNaN();
    expect(new Date(body.updatedAt).getTime()).not.toBeNaN();
  });

  // ─── TC-E2-P0-01: Duplicate NIT returns 409 Conflict ────────────────────────

  test('AC#4 — should return 409 Conflict when NIT already exists (TC-E2-P0-01)', async ({ request }) => {
    // GIVEN: a client with nit "900123456-7" already exists in the database
    const existingData = buildCliente({ nombre: 'Empresa Existente', nit: '900123456-7' });
    const seeded = await apiHelper.createCliente(existingData);
    createdIds.push(seeded.id);

    // WHEN: POST /api/v1/clientes with the same NIT
    const duplicateData = {
      nombre: 'Empresa Nueva',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    };
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: duplicateData });

    // THEN: HTTP status is 409 Conflict
    expect(response.status()).toBe(409);
  });

  test('AC#4 — 409 response should have Content-Type application/problem+json (TC-E2-P0-01)', async ({ request }) => {
    // GIVEN: a client with known NIT exists
    const existingData = buildCliente({ nombre: 'Empresa NIT Dup', nit: '900654321-1' });
    const seeded = await apiHelper.createCliente(existingData);
    createdIds.push(seeded.id);

    // WHEN: POST with same NIT
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Otra Empresa', nit: '900654321-1', telefono: '3009999999', ciudad: 'Cali' },
    });

    expect(response.status()).toBe(409);

    // THEN: Content-Type is application/problem+json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('AC#4 — 409 response should NOT contain stack trace or internal error details (NFR6, TC-E2-P0-01)', async ({ request }) => {
    // GIVEN: a client with known NIT exists
    const existingData = buildCliente({ nombre: 'Empresa NFR6', nit: '900111222-9' });
    const seeded = await apiHelper.createCliente(existingData);
    createdIds.push(seeded.id);

    // WHEN: POST with duplicate NIT
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Nueva Empresa', nit: '900111222-9', telefono: '3008888888', ciudad: 'Medellín' },
    });

    expect(response.status()).toBe(409);

    // THEN: response body does not expose stack trace or internal exception details
    const body = await response.text();
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('at System');
    expect(body).not.toContain('Exception');
  });

  test('AC#4 — 409 response should NOT create a duplicate client record', async ({ request }) => {
    // GIVEN: one client with known NIT
    const existingData = buildCliente({ nombre: 'Empresa Única', nit: '900777888-5' });
    const seeded = await apiHelper.createCliente(existingData);
    createdIds.push(seeded.id);

    // Get count before attempt
    const beforeResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const beforeList: Record<string, unknown>[] = await beforeResponse.json();
    const countBefore = beforeList.filter((c) => c['nit'] === '900777888-5').length;

    // WHEN: POST with duplicate NIT (409)
    await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { nombre: 'Duplicado', nit: '900777888-5', telefono: '3007777777', ciudad: 'Cali' },
    });

    // THEN: still only one client with that NIT in the database
    const afterResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const afterList: Record<string, unknown>[] = await afterResponse.json();
    const countAfter = afterList.filter((c) => c['nit'] === '900777888-5').length;
    expect(countAfter).toBe(countBefore);
  });

  // ─── TC-E2-P0-02: Missing required fields returns 400 ───────────────────────

  test('AC#3 — POST without nombre should return 400 Bad Request (TC-E2-P0-02)', async ({ request }) => {
    // GIVEN: payload missing required field "nombre"
    const payload = { nit: '900000011-1', telefono: '3001111111', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('AC#3 — POST without nit should return 400 Bad Request (TC-E2-P0-02)', async ({ request }) => {
    // GIVEN: payload missing required field "nit"
    const payload = { nombre: 'Empresa Sin NIT', telefono: '3001111112', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('AC#3 — POST without telefono should return 400 Bad Request (TC-E2-P0-02)', async ({ request }) => {
    // GIVEN: payload missing required field "telefono"
    const payload = { nombre: 'Empresa Sin Tel', nit: '900000012-2', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('AC#3 — POST without ciudad should return 400 Bad Request (TC-E2-P0-02)', async ({ request }) => {
    // GIVEN: payload missing required field "ciudad"
    const payload = { nombre: 'Empresa Sin Ciudad', nit: '900000013-3', telefono: '3001111113' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('AC#3 — 400 response should have Content-Type application/problem+json (TC-E2-P0-02)', async ({ request }) => {
    // GIVEN: payload missing nombre
    const payload = { nit: '900000014-4', telefono: '3001111114', ciudad: 'Cali' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });

    expect(response.status()).toBe(400);

    // THEN: Content-Type is application/problem+json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('AC#3 — 400 response body identifies the missing field (TC-E2-P0-02)', async ({ request }) => {
    // GIVEN: payload missing nombre specifically
    const payload = { nit: '900000015-5', telefono: '3001111115', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });

    expect(response.status()).toBe(400);

    // THEN: response body references the missing field (Nombre or nombre)
    const body = await response.text();
    expect(body.toLowerCase()).toContain('nombre');
  });

  test('AC#3 — 400 response should NOT expose stack trace (NFR6, TC-E2-P0-02)', async ({ request }) => {
    // GIVEN: incomplete payload
    const payload = { nit: '900000016-6' };

    // WHEN: POST /api/v1/clientes
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });

    expect(response.status()).toBe(400);

    // THEN: no stack trace in response (NFR6)
    const body = await response.text();
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('at System');
  });
});
