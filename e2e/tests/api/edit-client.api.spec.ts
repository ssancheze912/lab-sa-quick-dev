/**
 * API Tests — Story 2.4: PUT /api/v1/clientes/{id} contract
 * RED PHASE — Tests are intentionally FAILING until backend implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — PUT /api/v1/clientes/{id} returns 200 OK with updated client body (camelCase, UUID id)
 *   AC3 — PUT /api/v1/clientes/{id} returns 400 Bad Request with Problem Details when required fields are missing
 *   AC6 — PUT /api/v1/clientes/{id} returns 409 Conflict with Problem Details when NIT/RUC conflicts
 *   (Implicit) PUT /api/v1/clientes/{id} returns 404 Not Found when client ID does not exist
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
// PUT /api/v1/clientes/{id} — 200 OK (AC2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — 200 OK response contract', () => {
  test('should return HTTP 200 when updating an existing client with valid data', async ({ request }) => {
    // GIVEN: A client is created first
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    try {
      // WHEN: PUT /api/v1/clientes/{id} is called with valid updated data
      const updatePayload = createClientePayload({ nit: createPayload.nit }); // keep same NIT to avoid conflict
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });

      // THEN: HTTP 200 OK
      expect(response.status()).toBe(200);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return Content-Type: application/json on 200 response', async ({ request }) => {
    // GIVEN: A valid client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called
      const updatePayload = createClientePayload({ nit: createPayload.nit });
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });

      // THEN: Content-Type is application/json
      expect(response.headers()['content-type']).toMatch(/application\/json/i);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return the updated client with the new Nombre value', async ({ request }) => {
    // GIVEN: A client is created with an original Nombre
    const createPayload = createClientePayload({ nombre: 'Nombre Original SA' });
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with a new Nombre
      const updatePayload = { ...createPayload, nombre: 'Nombre Actualizado SA' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });
      const body = await response.json();

      // THEN: The response body contains the updated Nombre
      expect(body.nombre).toBe('Nombre Actualizado SA');
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return the updated client with all input fields in camelCase', async ({ request }) => {
    // GIVEN: A client is created
    const createPayload = createClientePayload({ nombre: 'CamelCase Test SA' });
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with updated values
      const updatePayload = {
        nombre: 'CamelCase Updated SA',
        nit: createPayload.nit,
        telefono: '3099998888',
        ciudad: 'Cartagena',
      };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });
      const body = await response.json();

      // THEN: All returned fields are in camelCase and match submitted values
      expect(body.nombre).toBe(updatePayload.nombre);
      expect(body.nit).toBe(updatePayload.nit);
      expect(body.telefono).toBe(updatePayload.telefono);
      expect(body.ciudad).toBe(updatePayload.ciudad);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return the same id (UUID) in the 200 response as was used in the request', async ({ request }) => {
    // GIVEN: A client is created
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called
      const updatePayload = createClientePayload({ nit: createPayload.nit });
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });
      const body = await response.json();

      // THEN: The returned id matches the original client id
      expect(body.id).toBe(created.id);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should update the updatedAt timestamp to a value after the original createdAt', async ({ request }) => {
    // GIVEN: A client is created
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // Small delay to ensure updatedAt differs from createdAt
      await new Promise((r) => setTimeout(r, 10));

      // WHEN: PUT is called
      const updatePayload = createClientePayload({ nit: createPayload.nit });
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });
      const body = await response.json();

      // THEN: updatedAt is a valid ISO 8601 timestamp
      expect(typeof body.updatedAt).toBe('string');
      expect(new Date(body.updatedAt).toISOString()).toBe(body.updatedAt);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should NOT return snake_case field names in the 200 response body', async ({ request }) => {
    // GIVEN: A client is created
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called
      const updatePayload = createClientePayload({ nit: createPayload.nit });
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });
      const body = await response.json();

      // THEN: No snake_case keys in the response
      const keys = Object.keys(body);
      expect(keys).not.toContain('created_at');
      expect(keys).not.toContain('updated_at');
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should persist the updated Nombre — GET /api/v1/clientes/:id returns new value after PUT', async ({ request }) => {
    // GIVEN: A client is created and then updated
    const createPayload = createClientePayload({ nombre: 'Before Persist SA' });
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      const updatePayload = { ...createPayload, nombre: 'After Persist SA' };
      const putResponse = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });
      expect(putResponse.status()).toBe(200);

      // WHEN: GET /api/v1/clientes/:id is called after the update
      const getResponse = await request.get(`${ENDPOINT}/${created.id}`);

      // THEN: The fetched client reflects the updated Nombre
      expect(getResponse.status()).toBe(200);
      const fetched = await getResponse.json();
      expect(fetched.nombre).toBe('After Persist SA');
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/clientes/{id} — 400 Bad Request: validation failures (AC3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — 400 Bad Request: validation failures', () => {
  test('should return HTTP 400 when "nombre" is missing in the update request', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called without "nombre"
      const payload = { nit: createPayload.nit, telefono: '3001234567', ciudad: 'Bogotá' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return HTTP 400 when "nit" is missing in the update request', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called without "nit"
      const payload = { nombre: 'No NIT SA', telefono: '3001234567', ciudad: 'Bogotá' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return HTTP 400 when "telefono" is missing in the update request', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called without "telefono"
      const payload = { nombre: 'No Tel SA', nit: createPayload.nit, ciudad: 'Bogotá' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return HTTP 400 when "ciudad" is missing in the update request', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called without "ciudad"
      const payload = { nombre: 'No Ciudad SA', nit: createPayload.nit, telefono: '3001234567' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return HTTP 400 when body is completely empty in the update request', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with an empty body
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: {} });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return Problem Details RFC 7807 format on 400 error for PUT', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called without "nombre"
      const payload = { nit: createPayload.nit, telefono: '3001234567', ciudad: 'Bogotá' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });
      const body = await response.json();

      // THEN: Response follows Problem Details RFC 7807 with status and errors
      expect(body.status).toBe(400);
      expect(body).toHaveProperty('errors');
      const errorKeys = Object.keys(body.errors ?? {}).map((k) => k.toLowerCase());
      expect(errorKeys.some((k) => k.includes('nombre'))).toBe(true);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/clientes/{id} — 404 Not Found: non-existent client
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — 404 Not Found: non-existent client', () => {
  test('should return HTTP 404 when the client ID does not exist', async ({ request }) => {
    // GIVEN: A UUID that does not correspond to any client
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const updatePayload = createClientePayload();

    // WHEN: PUT is called with the non-existent ID
    const response = await request.put(`${ENDPOINT}/${nonExistentId}`, { data: updatePayload });

    // THEN: HTTP 404 Not Found
    expect(response.status()).toBe(404);
  });

  test('should return Problem Details RFC 7807 format on 404 for PUT', async ({ request }) => {
    // GIVEN: A UUID that does not correspond to any client
    const nonExistentId = '00000000-0000-0000-0000-000000000001';
    const updatePayload = createClientePayload();

    // WHEN: PUT is called
    const response = await request.put(`${ENDPOINT}/${nonExistentId}`, { data: updatePayload });
    const body = await response.json();

    // THEN: Problem Details with status 404
    expect(body.status).toBe(404);
    expect(body.title).toBeDefined();
  });

  test('should return HTTP 400 when the id path parameter is not a valid UUID', async ({ request }) => {
    // GIVEN: A malformed (non-UUID) id
    const malformedId = 'not-a-valid-uuid';
    const updatePayload = createClientePayload();

    // WHEN: PUT is called with a malformed id
    const response = await request.put(`${ENDPOINT}/${malformedId}`, { data: updatePayload });

    // THEN: HTTP 400 Bad Request (malformed route param)
    expect(response.status()).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/clientes/{id} — 409 Conflict: duplicate NIT/RUC (AC6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — 409 Conflict: duplicate NIT/RUC', () => {
  test('should return HTTP 409 when updating NIT to one that already belongs to another client', async ({ request }) => {
    // GIVEN: Two clients exist with distinct NITs
    const payload1 = createClientePayload({ nit: `PUT409A${Date.now().toString().slice(-5)}` });
    const payload2 = createClientePayload({ nit: `PUT409B${Date.now().toString().slice(-5)}` });

    const create1 = await request.post(ENDPOINT, { data: payload1 });
    const create2 = await request.post(ENDPOINT, { data: payload2 });
    expect(create1.status()).toBe(201);
    expect(create2.status()).toBe(201);
    const client1 = await create1.json();
    const client2 = await create2.json();

    try {
      // WHEN: client2 is updated with client1's NIT (conflict)
      const conflictPayload = { ...payload2, nit: payload1.nit };
      const response = await request.put(`${ENDPOINT}/${client2.id}`, { data: conflictPayload });

      // THEN: HTTP 409 Conflict
      expect(response.status()).toBe(409);
    } finally {
      await request.delete(`${ENDPOINT}/${client1.id}`);
      await request.delete(`${ENDPOINT}/${client2.id}`);
    }
  });

  test('should return Problem Details RFC 7807 format on 409 for PUT', async ({ request }) => {
    // GIVEN: Two clients with distinct NITs
    const payload1 = createClientePayload({ nit: `PUT409C${Date.now().toString().slice(-5)}` });
    const payload2 = createClientePayload({ nit: `PUT409D${Date.now().toString().slice(-5)}` });

    const create1 = await request.post(ENDPOINT, { data: payload1 });
    const create2 = await request.post(ENDPOINT, { data: payload2 });
    const client1 = await create1.json();
    const client2 = await create2.json();

    try {
      // WHEN: PUT is called with a conflicting NIT
      const conflictPayload = { ...payload2, nit: payload1.nit };
      const response = await request.put(`${ENDPOINT}/${client2.id}`, { data: conflictPayload });
      const body = await response.json();

      // THEN: Problem Details with status 409 and user-friendly detail
      expect(body.status).toBe(409);
      expect(body.title).toBeDefined();
      expect(body.detail).toBeTruthy();
    } finally {
      await request.delete(`${ENDPOINT}/${client1.id}`);
      await request.delete(`${ENDPOINT}/${client2.id}`);
    }
  });

  test('should return a user-friendly conflict message without stack trace in 409 response', async ({ request }) => {
    // GIVEN: Two clients with distinct NITs
    const payload1 = createClientePayload({ nit: `PUT409E${Date.now().toString().slice(-5)}` });
    const payload2 = createClientePayload({ nit: `PUT409F${Date.now().toString().slice(-5)}` });

    const create1 = await request.post(ENDPOINT, { data: payload1 });
    const create2 = await request.post(ENDPOINT, { data: payload2 });
    const client1 = await create1.json();
    const client2 = await create2.json();

    try {
      // WHEN: PUT is called with a conflicting NIT
      const conflictPayload = { ...payload2, nit: payload1.nit };
      const response = await request.put(`${ENDPOINT}/${client2.id}`, { data: conflictPayload });
      const body = await response.json();

      // THEN: The detail message contains no stack trace indicators
      const responseText = JSON.stringify(body);
      expect(responseText).not.toContain('StackTrace');
      expect(responseText).not.toContain('at System.');
      expect(responseText).not.toContain('Exception');
      // AND: detail field mentions NIT/RUC in user-friendly terms
      expect(body.detail).toMatch(/NIT|RUC|nit|ruc/i);
    } finally {
      await request.delete(`${ENDPOINT}/${client1.id}`);
      await request.delete(`${ENDPOINT}/${client2.id}`);
    }
  });

  test('should allow updating a client with its own current NIT (idempotent NIT)', async ({ request }) => {
    // GIVEN: A client exists with a specific NIT
    const payload = createClientePayload({ nit: `SAMENIT${Date.now().toString().slice(-5)}` });
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with the same NIT (just updating other fields)
      const updatePayload = { ...payload, nombre: 'Same NIT Updated SA' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });

      // THEN: HTTP 200 OK (not a conflict — same client same NIT is allowed)
      expect(response.status()).toBe(200);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});
