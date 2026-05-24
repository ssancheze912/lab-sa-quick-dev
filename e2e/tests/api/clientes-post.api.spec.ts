/**
 * Story 2.3: Create Client — API Contract Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC7 — POST /api/v1/clientes returns 201 + ClienteDto with UUID id when all fields are valid
 *   AC8 — POST /api/v1/clientes returns 400 + Problem Details when required fields are empty/whitespace
 *   AC9 — POST /api/v1/clientes returns 409 + Problem Details (no stack trace) when NIT already exists
 *
 * Test scenarios from test-design-epic-2.md:
 *   TC-E2-P0-06 — POST /api/v1/clientes returns 201 + UUID id
 *   TC-E2-P0-05 — POST /api/v1/clientes returns 400 for empty/whitespace required fields
 *   TC-E2-P0-02 — POST /api/v1/clientes returns 409 for duplicate NIT
 *
 * Test status: RED — tests will fail until POST /api/v1/clientes endpoint is implemented:
 *   - CreateClienteCommand / CreateClienteCommandHandler do NOT exist yet
 *   - POST /api/v1/clientes endpoint does NOT exist yet
 *   - CreateClienteRequestValidator does NOT exist yet
 *
 * Framework: Playwright API testing (@playwright/test)
 * Patterns: Given-When-Then, auto-cleanup via afterEach, UUID validation.
 */

import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-06 — AC7: POST /api/v1/clientes returns 201 + ClienteDto with UUID id
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC7 — POST /api/v1/clientes returns 201 + ClienteDto with UUID id', () => {
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

  test('TC-E2-P0-06: should return HTTP 201 when all required fields are provided', async ({ request }) => {
    // GIVEN: Valid request body with all required fields
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: HTTP 201 Created is returned
    expect(response.status()).toBe(201);

    const body = await response.json();
    if (body?.id) createdIds.push(body.id);
  });

  test('TC-E2-P0-06: should return a ClienteDto JSON object (not an array)', async ({ request }) => {
    // GIVEN: Valid request body
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: Response body is an object, not an array
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
  });

  test('TC-E2-P0-06: should return a UUID v4 "id" field (R-008 mitigation — not an integer)', async ({ request }) => {
    // GIVEN: Valid request body
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: "id" is a UUID v4 string (not an integer)
    expect(typeof body.id).toBe('string');
    expect(body.id).toMatch(UUID_V4_REGEX);
  });

  test('should return ClienteDto with "nombre" matching the submitted value', async ({ request }) => {
    // GIVEN: Valid request with specific nombre
    const data = buildCliente({ nombre: 'Empresa DTO Test SA' });

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: "nombre" matches
    expect(body.nombre).toBe(data.nombre);
  });

  test('should return ClienteDto with "nit" matching the submitted value', async ({ request }) => {
    // GIVEN: Valid request
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: "nit" matches
    expect(body.nit).toBe(data.nit);
  });

  test('should return ClienteDto with "telefono" field', async ({ request }) => {
    // GIVEN: Valid request
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: "telefono" is returned
    expect(body.telefono).toBe(data.telefono);
  });

  test('should return ClienteDto with "ciudad" field', async ({ request }) => {
    // GIVEN: Valid request
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: "ciudad" is returned
    expect(body.ciudad).toBe(data.ciudad);
  });

  test('should return ClienteDto with "createdAt" in ISO 8601 format with timezone', async ({ request }) => {
    // GIVEN: Valid request
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: "createdAt" is a valid ISO 8601 datetime
    expect(body.createdAt).toBeTruthy();
    expect(new Date(body.createdAt).toISOString()).toBeTruthy();
  });

  test('should return Content-Type application/json for a 201 response', async ({ request }) => {
    // GIVEN: Valid request
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-05 — AC8: POST returns 400 + Problem Details for empty/whitespace fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC8 — POST /api/v1/clientes returns 400 + Problem Details for empty/whitespace fields', () => {

  test('TC-E2-P0-05: should return HTTP 400 when "nombre" is empty', async ({ request }) => {
    // GIVEN: Request body with empty nombre
    const data = { nombre: '', nit: '900111222-0', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('TC-E2-P0-05: should return HTTP 400 when "nombre" is whitespace-only', async ({ request }) => {
    // GIVEN: Request body with whitespace-only nombre
    const data = { nombre: '   ', nit: '900111222-1', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('TC-E2-P0-05: should return HTTP 400 when "nit" is empty', async ({ request }) => {
    // GIVEN: Request body with empty nit
    const data = { nombre: 'Empresa Test SA', nit: '', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('TC-E2-P0-05: should return HTTP 400 when "telefono" is empty', async ({ request }) => {
    // GIVEN: Request body with empty telefono
    const data = { nombre: 'Empresa Test SA', nit: '900111333-0', telefono: '', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('TC-E2-P0-05: should return HTTP 400 when "ciudad" is empty', async ({ request }) => {
    // GIVEN: Request body with empty ciudad
    const data = { nombre: 'Empresa Test SA', nit: '900111444-0', telefono: '3001234567', ciudad: '' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return Content-Type application/problem+json on 400', async ({ request }) => {
    // GIVEN: Request with empty nombre
    const data = { nombre: '', nit: '900222000-0', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Content-Type is application/problem+json (Problem Details RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return Problem Details RFC 7807 body on 400', async ({ request }) => {
    // GIVEN: Request with empty nombre
    const data = { nombre: '', nit: '900222001-0', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();

    // THEN: Body contains "status" and "errors" fields per RFC 7807
    expect(body.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  test('should NOT persist a record when 400 is returned', async ({ request }) => {
    // GIVEN: Invalid request (empty nombre)
    const uniqueNit = `900229${Date.now().toString().slice(-6)}`;
    const data = { nombre: '', nit: uniqueNit, telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: No client was persisted with that NIT
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const clientes = await listResponse.json();
    const found = clientes.find((c: { nit: string }) => c.nit === uniqueNit);
    expect(found).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-02 — AC9: POST returns 409 + Problem Details (no stack trace) for duplicate NIT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC9 — POST /api/v1/clientes returns 409 + Problem Details for duplicate NIT', () => {
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

  test('TC-E2-P0-02: should return HTTP 409 when NIT already exists in the system', async ({ request }) => {
    // GIVEN: A client with a specific NIT is already in the system
    const data = buildCliente();
    const existing = await apiHelper.createCliente(data);
    createdIds.push(existing.id);

    // WHEN: Another POST is sent with the same NIT
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { ...data, nombre: 'Empresa Diferente SA' },
    });

    // THEN: HTTP 409 Conflict is returned
    expect(response.status()).toBe(409);
  });

  test('TC-E2-P0-02: should return Content-Type application/problem+json on 409', async ({ request }) => {
    // GIVEN: Duplicate NIT scenario
    const data = buildCliente();
    const existing = await apiHelper.createCliente(data);
    createdIds.push(existing.id);

    // WHEN: Duplicate POST request
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { ...data, nombre: 'Empresa Diferente SA' },
    });

    // THEN: Content-Type is application/problem+json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('TC-E2-P0-02: should NOT expose stackTrace in the 409 response body (NFR6)', async ({ request }) => {
    // GIVEN: Duplicate NIT scenario
    const data = buildCliente();
    const existing = await apiHelper.createCliente(data);
    createdIds.push(existing.id);

    // WHEN: Duplicate POST request
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { ...data, nombre: 'Empresa Diferente SA' },
    });
    const body = await response.json();

    // THEN: No stack trace fields are present in the response
    expect(body.stackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
    expect(body.innerException).toBeUndefined();
  });

  test('should NOT persist the duplicate record on 409', async ({ request }) => {
    // GIVEN: Duplicate NIT scenario
    const data = buildCliente();
    const existing = await apiHelper.createCliente(data);
    createdIds.push(existing.id);

    // WHEN: Duplicate POST request
    await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: { ...data, nombre: 'Empresa Diferente SA' },
    });

    // THEN: Only the original client exists in the system
    const listResponse = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const clientes = await listResponse.json();
    const withSameNit = clientes.filter((c: { nit: string }) => c.nit === data.nit);
    expect(withSameNit).toHaveLength(1);
  });
});
