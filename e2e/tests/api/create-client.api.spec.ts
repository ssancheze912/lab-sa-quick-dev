// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.3: Create Client
// Test Level: API (Playwright request context)
// Phase: RED — all tests fail until backend implementation exists
//
// Acceptance Criteria covered:
//   AC2 — POST /api/v1/clientes returns 201 Created + ClienteDto body
//   AC3 — POST /api/v1/clientes with empty fields returns 400 Problem Details RFC 7807
//   AC4 — POST /api/v1/clientes with duplicate NIT returns 409 Problem Details RFC 7807
//
// Backend endpoint contract:
//   POST /api/v1/clientes → 201 Created + ClienteDto
//   POST /api/v1/clientes (invalid) → 400 Problem Details
//   POST /api/v1/clientes (NIT conflict) → 409 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

import { test, expect } from '@playwright/test';
import { buildCliente } from '../../helpers/data.helper';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — POST /api/v1/clientes returns 201 Created with ClienteDto
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — POST /api/v1/clientes creates client successfully', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should return 201 Created when all required fields are provided', async ({ request }) => {
    // GIVEN: Valid client data with all required fields
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Response status is 201 Created
    expect(response.status()).toBe(201);

    const body = await response.json();
    if (body?.id) createdIds.push(body.id);
  });

  test('should return a ClienteDto with id (UUID) in the response body', async ({ request }) => {
    // GIVEN: Valid client data
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: Body contains id as a valid UUID
    expect(body.id).toBeTruthy();
    expect(typeof body.id).toBe('string');
    // UUID format: 8-4-4-4-12 hex chars
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test('should return ClienteDto with Nombre matching the submitted value', async ({ request }) => {
    // GIVEN: Valid client data with a specific Nombre
    const data = buildCliente({ nombre: 'Empresa Validación ATDD' });

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: Body contains Nombre matching the submitted value
    expect(body.nombre).toBe(data.nombre);
  });

  test('should return ClienteDto with NIT matching the submitted value', async ({ request }) => {
    // GIVEN: Valid client data with a specific NIT
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: Body contains NIT matching the submitted value
    expect(body.nit).toBe(data.nit);
  });

  test('should return ClienteDto with createdAt and updatedAt timestamps', async ({ request }) => {
    // GIVEN: Valid client data
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: Body contains ISO timestamp fields
    expect(body.createdAt).toBeTruthy();
    expect(body.updatedAt).toBeTruthy();
    expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
  });

  test('should return Location header pointing to the new client URL', async ({ request }) => {
    // GIVEN: Valid client data
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: Location header references /api/v1/clientes/{id}
    const location = response.headers()['location'];
    expect(location).toBeTruthy();
    expect(location).toContain('/api/v1/clientes/');
  });

  test('should return Content-Type application/json for successful creation', async ({
    request,
  }) => {
    // GIVEN: Valid client data
    const data = buildCliente();

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    if (body?.id) createdIds.push(body.id);

    // THEN: Content-Type header is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — POST /api/v1/clientes with empty fields returns 400 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — POST /api/v1/clientes validation returns 400 Problem Details', () => {
  test('should return 400 when Nombre is empty', async ({ request }) => {
    // GIVEN: Client data with empty Nombre
    const data = { nombre: '', nit: '900000001', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Response is 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when NIT is empty', async ({ request }) => {
    // GIVEN: Client data with empty NIT
    const data = { nombre: 'Empresa Test', nit: '', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Response is 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when Teléfono is empty', async ({ request }) => {
    // GIVEN: Client data with empty Teléfono
    const data = { nombre: 'Empresa Test', nit: '900000001', telefono: '', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Response is 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when Ciudad is empty', async ({ request }) => {
    // GIVEN: Client data with empty Ciudad
    const data = { nombre: 'Empresa Test', nit: '900000001', telefono: '3001234567', ciudad: '' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Response is 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return 400 when all fields are missing', async ({ request }) => {
    // GIVEN: Empty body
    const data = {};

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Response is 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return Problem Details format (RFC 7807) for 400 response', async ({ request }) => {
    // GIVEN: Invalid data (empty Nombre)
    const data = { nombre: '', nit: '900000001', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });

    // THEN: Body follows RFC 7807 Problem Details format
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.status).toBe(400);
    expect(body.title).toBeTruthy();
    // RFC 7807 requires at minimum: type, title, status
  });

  test('should NOT expose stack traces in 400 validation error response', async ({ request }) => {
    // GIVEN: Invalid data
    const data = { nombre: '', nit: '', telefono: '', ciudad: '' };

    // WHEN: POST /api/v1/clientes is called
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data });
    const body = await response.json();
    const bodyString = JSON.stringify(body).toLowerCase();

    // THEN: No stack trace or technical exception details exposed
    expect(bodyString).not.toContain('exception');
    expect(bodyString).not.toContain('stacktrace');
    expect(bodyString).not.toContain('at system.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — POST /api/v1/clientes with duplicate NIT returns 409 Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — POST /api/v1/clientes NIT conflict returns 409 Problem Details', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  test('should return 409 Conflict when NIT already exists', async ({ request }) => {
    // GIVEN: A client already exists with a specific NIT
    const existing = buildCliente();
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: existing,
    });
    const created = await createResponse.json();
    if (created?.id) createdIds.push(created.id);

    // WHEN: Another client is created with the same NIT
    const duplicate = buildCliente({ nit: existing.nit, nombre: 'Empresa Duplicada' });
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: duplicate });

    // THEN: Response is 409 Conflict
    expect(response.status()).toBe(409);
  });

  test('should return Problem Details format (RFC 7807) for 409 response', async ({ request }) => {
    // GIVEN: A client already exists with a specific NIT
    const existing = buildCliente();
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: existing,
    });
    const created = await createResponse.json();
    if (created?.id) createdIds.push(created.id);

    // WHEN: Another client is created with the same NIT
    const duplicate = buildCliente({ nit: existing.nit, nombre: 'Empresa Duplicada 2' });
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: duplicate });

    // THEN: Body follows RFC 7807 Problem Details format
    expect(response.status()).toBe(409);
    const body = await response.json();
    expect(body.status).toBe(409);
    expect(body.title).toBeTruthy();
    expect(body.detail).toBeTruthy();
  });

  test('should NOT expose stack traces in 409 conflict response body', async ({ request }) => {
    // GIVEN: A client already exists
    const existing = buildCliente();
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: existing,
    });
    const created = await createResponse.json();
    if (created?.id) createdIds.push(created.id);

    // WHEN: Duplicate NIT is submitted
    const duplicate = buildCliente({ nit: existing.nit, nombre: 'Empresa Dup NFR6' });
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: duplicate });
    const body = await response.json();
    const bodyString = JSON.stringify(body).toLowerCase();

    // THEN: No stack trace details (NFR6)
    expect(bodyString).not.toContain('stacktrace');
    expect(bodyString).not.toContain('at system.');
    expect(bodyString).not.toContain('conflictexception');
  });

  test('should include conflict detail message about the duplicate NIT', async ({ request }) => {
    // GIVEN: A client already exists with a specific NIT
    const existing = buildCliente();
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: existing,
    });
    const created = await createResponse.json();
    if (created?.id) createdIds.push(created.id);

    // WHEN: Duplicate NIT is submitted
    const duplicate = buildCliente({ nit: existing.nit, nombre: 'Empresa Dup Detail' });
    const response = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: duplicate });

    // THEN: Detail field mentions the conflict
    const body = await response.json();
    const detail: string = body.detail ?? '';
    // Detail should mention NIT or "registrado" (per API contract)
    expect(detail.toLowerCase()).toMatch(/nit|registrado|conflict/i);
  });
});
