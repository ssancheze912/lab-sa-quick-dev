/**
 * Story 2.3: Create Client — API Contract Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC2: POST /api/v1/clientes returns 201 Created with ClienteDto body + Location header
 * - AC3: POST /api/v1/clientes returns 400 Bad Request (Problem Details) on empty required fields
 * - AC4: POST /api/v1/clientes returns 409 Conflict (Problem Details) when NIT already exists
 * - AC5: Backend responds with Problem Details on unhandled errors (not raw stack trace)
 *
 * These tests hit the real backend (http://localhost:5000).
 * They will remain RED until the backend endpoint is implemented.
 */

import { test, expect } from '@playwright/test';
import { buildClientePayload, buildClienteResponse } from '../support/factories/cliente.factory';

const BASE_URL = 'http://localhost:5000';
const ENDPOINT = `${BASE_URL}/api/v1/clientes`;

// ─── AC2: POST /api/v1/clientes — happy path ─────────────────────────────────

test.describe('POST /api/v1/clientes — AC2 happy path', () => {
  test('should return HTTP 201 Created on valid payload', async ({ request }) => {
    // GIVEN: A valid cliente payload
    const payload = buildClientePayload();

    // WHEN: A POST request is sent to /api/v1/clientes
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: Response status is 201
    expect(response.status()).toBe(201);
  });

  test('should return Content-Type application/json on 201', async ({ request }) => {
    // GIVEN: A valid cliente payload
    const payload = buildClientePayload();

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should return Location header pointing to the new client resource', async ({ request }) => {
    // GIVEN: A valid cliente payload
    const payload = buildClientePayload();

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: Location header is present and points to /api/v1/clientes/{id}
    const location = response.headers()['location'];
    expect(location).toMatch(/\/api\/v1\/clientes\//);
  });

  test('should return ClienteDto with the submitted nombre in the body', async ({ request }) => {
    // GIVEN: A valid cliente payload with a known nombre
    const payload = buildClientePayload({ nombre: 'Empresa API Test SA' });

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN: Body contains the submitted nombre
    expect(body.nombre).toBe('Empresa API Test SA');
  });

  test('should return ClienteDto with the submitted nit in the body', async ({ request }) => {
    // GIVEN: A valid cliente payload with a known nit
    const payload = buildClientePayload({ nit: '900111222-3' });

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN: Body contains the submitted nit
    expect(body.nit).toBe('900111222-3');
  });

  test('should return ClienteDto with an id (UUID) in the body', async ({ request }) => {
    // GIVEN: A valid cliente payload
    const payload = buildClientePayload();

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN: Body has a UUID id field
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test('should return ClienteDto with createdAt and updatedAt ISO timestamps', async ({ request }) => {
    // GIVEN: A valid cliente payload
    const payload = buildClientePayload();

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN: Both timestamp fields are present and are valid ISO 8601 strings
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
    expect(() => new Date(body.createdAt)).not.toThrow();
  });

  test('should return body with camelCase field names (no snake_case)', async ({ request }) => {
    // GIVEN: A valid cliente payload
    const payload = buildClientePayload();

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN: No snake_case keys exist in the response body
    const keys = Object.keys(body);
    const snakeCaseKeys = keys.filter((k) => k.includes('_'));
    expect(snakeCaseKeys).toHaveLength(0);
  });

  test('should make the new client appear in GET /api/v1/clientes after creation', async ({ request }) => {
    // GIVEN: A new client is created
    const payload = buildClientePayload({ nombre: 'Empresa Listada Post Creacion' });
    const createResponse = await request.post(ENDPOINT, { data: payload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    // WHEN: The list endpoint is called
    const listResponse = await request.get(ENDPOINT);
    const list: unknown[] = await listResponse.json();

    // THEN: The new client appears in the list
    const found = (list as Array<{ id: string }>).find((c) => c.id === created.id);
    expect(found).toBeDefined();
  });
});

// ─── AC3: POST /api/v1/clientes — 400 Bad Request (validation) ───────────────

test.describe('POST /api/v1/clientes — AC3 FluentValidation errors → 400', () => {
  test('should return HTTP 400 when nombre is empty', async ({ request }) => {
    // GIVEN: Payload with empty nombre
    const payload = { ...buildClientePayload(), nombre: '' };

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: Response status is 400
    expect(response.status()).toBe(400);
  });

  test('should return HTTP 400 when nit is empty', async ({ request }) => {
    // GIVEN: Payload with empty nit
    const payload = { ...buildClientePayload(), nit: '' };

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: Response status is 400
    expect(response.status()).toBe(400);
  });

  test('should return HTTP 400 when telefono is empty', async ({ request }) => {
    // GIVEN: Payload with empty telefono
    const payload = { ...buildClientePayload(), telefono: '' };

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: Response status is 400
    expect(response.status()).toBe(400);
  });

  test('should return HTTP 400 when ciudad is empty', async ({ request }) => {
    // GIVEN: Payload with empty ciudad
    const payload = { ...buildClientePayload(), ciudad: '' };

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: Response status is 400
    expect(response.status()).toBe(400);
  });

  test('should return Problem Details RFC 7807 body on 400', async ({ request }) => {
    // GIVEN: Payload with missing required field
    const payload = { nit: '900000000-1', telefono: '3000000000', ciudad: 'Bogotá' }; // nombre missing

    // WHEN: A POST request is sent
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN: Body is Problem Details with status 400
    expect(body.status).toBe(400);
  });
});

// ─── AC4: POST /api/v1/clientes — 409 Conflict (duplicate NIT) ───────────────

test.describe('POST /api/v1/clientes — AC4 duplicate NIT → 409 Conflict', () => {
  test('should return HTTP 409 when NIT already exists in the system', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const uniqueNit = `DUPNIT${Date.now()}`;
    const firstPayload = buildClientePayload({ nit: uniqueNit });
    await request.post(ENDPOINT, { data: firstPayload });

    // WHEN: A second client is created with the same NIT
    const duplicatePayload = buildClientePayload({ nit: uniqueNit });
    const response = await request.post(ENDPOINT, { data: duplicatePayload });

    // THEN: Response status is 409 Conflict
    expect(response.status()).toBe(409);
  });

  test('should return Problem Details with detail "El NIT/RUC ya está registrado." on 409', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const uniqueNit = `DUPDET${Date.now()}`;
    const firstPayload = buildClientePayload({ nit: uniqueNit });
    await request.post(ENDPOINT, { data: firstPayload });

    // WHEN: A second POST is sent with the same NIT
    const duplicatePayload = buildClientePayload({ nit: uniqueNit });
    const response = await request.post(ENDPOINT, { data: duplicatePayload });
    const body = await response.json();

    // THEN: Body detail contains the user-friendly message (NFR6 — no stack trace)
    expect(body.detail).toBe('El NIT/RUC ya está registrado.');
  });

  test('should NOT expose raw database error message on 409', async ({ request }) => {
    // GIVEN: A client with a specific NIT already exists
    const uniqueNit = `DUPEXPOSE${Date.now()}`;
    await request.post(ENDPOINT, { data: buildClientePayload({ nit: uniqueNit }) });

    // WHEN: A second POST is sent with the same NIT
    const response = await request.post(ENDPOINT, { data: buildClientePayload({ nit: uniqueNit }) });
    const body = await response.json();
    const bodyString = JSON.stringify(body).toLowerCase();

    // THEN: No DB-specific terms are exposed in the response (NFR6 compliance)
    expect(bodyString).not.toContain('23505');
    expect(bodyString).not.toContain('unique constraint');
    expect(bodyString).not.toContain('stack trace');
    expect(bodyString).not.toContain('exception');
  });
});
