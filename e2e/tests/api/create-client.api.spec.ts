/**
 * API Tests — Story 2.3: POST /api/v1/clientes contract
 * RED PHASE — Tests are intentionally FAILING until backend implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — POST /api/v1/clientes returns 201 Created with correct body shape (camelCase fields, UUID id)
 *   AC3 — POST /api/v1/clientes returns 400 Bad Request with Problem Details when required fields are missing
 *   AC4 — POST /api/v1/clientes returns 409 Conflict with Problem Details when NIT/RUC already exists
 *
 * Uses Playwright's APIRequestContext (no browser). Requires:
 *   - Backend running on http://localhost:5000
 *   - EF Core migration applied (clientes table exists with uk_clientes_nit unique index)
 *   - No authentication required (MVP has no auth layer)
 */

import { test, expect } from '@playwright/test';
import { createClientePayload } from '../../support/factories/cliente.factory';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/clientes — 201 Created (AC2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POST /api/v1/clientes — 201 Created response contract', () => {
  test('should return HTTP 201 when all required fields are provided', async ({ request }) => {
    // GIVEN: A valid client payload
    const payload = createClientePayload();

    // WHEN: POST /api/v1/clientes is called with valid data
    const response = await request.post(ENDPOINT, { data: payload });

    // Cleanup
    if (response.ok()) {
      const body = await response.json();
      if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);
    }

    // THEN: HTTP status is 201 Created
    expect(response.status()).toBe(201);
  });

  test('should return Content-Type: application/json on 201 response', async ({ request }) => {
    // GIVEN: A valid client payload
    const payload = createClientePayload();

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });

    // Cleanup
    if (response.ok()) {
      const body = await response.json();
      if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);
    }

    // THEN: Response Content-Type is application/json
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
  });

  test('should return the created client with a UUID id field', async ({ request }) => {
    // GIVEN: A valid client payload
    const payload = createClientePayload();

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // Cleanup
    if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);

    // THEN: Response body contains an id field matching UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(String(body.id)).toMatch(uuidPattern);
  });

  test('should return the created client with all input fields echoed back in camelCase', async ({ request }) => {
    // GIVEN: A valid client payload with known values
    const payload = createClientePayload({
      nombre: 'API Contract Corp',
      nit: `9${Date.now().toString().slice(-8)}`,
      telefono: '3001112233',
      ciudad: 'Medellín',
    });

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // Cleanup
    if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);

    // THEN: Response body contains all input fields with their submitted values
    expect(body.nombre).toBe(payload.nombre);
    expect(body.nit).toBe(payload.nit);
    expect(body.telefono).toBe(payload.telefono);
    expect(body.ciudad).toBe(payload.ciudad);
  });

  test('should return createdAt and updatedAt as ISO 8601 timestamps in the 201 response', async ({ request }) => {
    // GIVEN: A valid client payload
    const payload = createClientePayload();

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // Cleanup
    if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);

    // THEN: createdAt and updatedAt are ISO 8601 timestamp strings
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
    expect(new Date(body.createdAt).toISOString()).toBe(body.createdAt);
    expect(new Date(body.updatedAt).toISOString()).toBe(body.updatedAt);
  });

  test('should return a Location header pointing to /api/v1/clientes/{id} on 201 Created', async ({ request }) => {
    // GIVEN: A valid client payload
    const payload = createClientePayload();

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // Cleanup
    if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);

    // THEN: Location header is set to the resource URL
    const locationHeader = response.headers()['location'];
    expect(locationHeader).toBeTruthy();
    expect(locationHeader).toContain(`/api/v1/clientes/${body.id}`);
  });

  test('should NOT return snake_case field names in the 201 response body', async ({ request }) => {
    // GIVEN: A valid client payload
    const payload = createClientePayload();

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // Cleanup
    if (body?.id) await request.delete(`${ENDPOINT}/${body.id}`);

    // THEN: No snake_case keys in the response
    const keys = Object.keys(body);
    expect(keys).not.toContain('created_at');
    expect(keys).not.toContain('updated_at');
  });

  test('should persist the created client — GET /api/v1/clientes/:id returns it after creation', async ({ request }) => {
    // GIVEN: A client is created via POST
    const payload = createClientePayload({ nombre: 'Persist Verification SA' });
    const createResponse = await request.post(ENDPOINT, { data: payload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    try {
      // WHEN: GET /api/v1/clientes/:id is called with the new id
      const getResponse = await request.get(`${ENDPOINT}/${created.id}`);

      // THEN: The client is returned with the correct Nombre
      expect(getResponse.status()).toBe(200);
      const fetched = await getResponse.json();
      expect(fetched.nombre).toBe(payload.nombre);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/clientes — 400 Bad Request: validation failures (AC3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POST /api/v1/clientes — 400 Bad Request: validation failures', () => {
  test('should return HTTP 400 when "nombre" is missing', async ({ request }) => {
    // GIVEN: A payload without the required "nombre" field
    const payload = { nit: '900111000-1', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return HTTP 400 when "nit" is missing', async ({ request }) => {
    // GIVEN: A payload without the required "nit" field
    const payload = { nombre: 'Empresa Sin NIT', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return HTTP 400 when "telefono" is missing', async ({ request }) => {
    // GIVEN: A payload without "telefono"
    const payload = { nombre: 'Empresa Sin Telefono', nit: '900222000-1', ciudad: 'Cali' };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return HTTP 400 when "ciudad" is missing', async ({ request }) => {
    // GIVEN: A payload without "ciudad"
    const payload = { nombre: 'Empresa Sin Ciudad', nit: '900333000-1', telefono: '3001234567' };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return HTTP 400 when body is completely empty', async ({ request }) => {
    // GIVEN: An empty request body
    const payload = {};

    // WHEN: POST is called with an empty body
    const response = await request.post(ENDPOINT, { data: payload });

    // THEN: HTTP 400 Bad Request
    expect(response.status()).toBe(400);
  });

  test('should return Problem Details RFC 7807 format on 400 error', async ({ request }) => {
    // GIVEN: A payload missing "nombre"
    const payload = { nit: '900444000-1', telefono: '3001234567', ciudad: 'Bogotá' };

    // WHEN: POST is called
    const response = await request.post(ENDPOINT, { data: payload });
    const body = await response.json();

    // THEN: Response follows Problem Details RFC 7807 with status and errors
    expect(body.status).toBe(400);
    expect(body).toHaveProperty('errors');
    // The errors map should have an entry for "nombre" (or equivalent)
    const errorKeys = Object.keys(body.errors ?? {}).map((k) => k.toLowerCase());
    expect(errorKeys.some((k) => k.includes('nombre'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/clientes — 409 Conflict: duplicate NIT (AC4)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('POST /api/v1/clientes — 409 Conflict: duplicate NIT/RUC', () => {
  test('should return HTTP 409 when a client with the same NIT already exists', async ({ request }) => {
    // GIVEN: A client is created with a specific NIT
    const payload = createClientePayload({ nit: `DUP${Date.now().toString().slice(-6)}` });
    const firstResponse = await request.post(ENDPOINT, { data: payload });
    expect(firstResponse.status()).toBe(201);
    const created = await firstResponse.json();

    try {
      // WHEN: Another client is created with the same NIT
      const duplicatePayload = createClientePayload({ nit: payload.nit });
      const duplicateResponse = await request.post(ENDPOINT, { data: duplicatePayload });

      // THEN: HTTP 409 Conflict is returned
      expect(duplicateResponse.status()).toBe(409);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return Problem Details RFC 7807 format on 409 Conflict', async ({ request }) => {
    // GIVEN: A client with a specific NIT is already created
    const payload = createClientePayload({ nit: `PDC${Date.now().toString().slice(-6)}` });
    const firstResponse = await request.post(ENDPOINT, { data: payload });
    const created = await firstResponse.json();

    try {
      // WHEN: Duplicate NIT is submitted
      const duplicatePayload = createClientePayload({ nit: payload.nit });
      const duplicateResponse = await request.post(ENDPOINT, { data: duplicatePayload });
      const body = await duplicateResponse.json();

      // THEN: Problem Details with status 409 and user-friendly detail message
      expect(body.status).toBe(409);
      expect(body.title).toBeDefined();
      expect(body.detail).toBeTruthy();
    } finally {
      if (created?.id) await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return a user-friendly conflict detail message (no stack trace in 409 response)', async ({ request }) => {
    // GIVEN: A client with a specific NIT exists
    const payload = createClientePayload({ nit: `NST${Date.now().toString().slice(-6)}` });
    const firstResponse = await request.post(ENDPOINT, { data: payload });
    const created = await firstResponse.json();

    try {
      // WHEN: Duplicate NIT submitted
      const duplicateResponse = await request.post(ENDPOINT, { data: createClientePayload({ nit: payload.nit }) });
      const body = await duplicateResponse.json();

      // THEN: The detail message contains no stack trace indicators
      const responseText = JSON.stringify(body);
      expect(responseText).not.toContain('StackTrace');
      expect(responseText).not.toContain('at System.');
      expect(responseText).not.toContain('Exception');
      // AND: detail field mentions NIT/RUC in user-friendly terms
      expect(body.detail).toMatch(/NIT|RUC|nit|ruc/i);
    } finally {
      if (created?.id) await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});
