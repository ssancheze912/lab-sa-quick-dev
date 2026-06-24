/**
 * API Edge-Case Tests — Story 2.4: PUT /api/v1/clientes/{id} contract
 * Expands coverage beyond the ATDD baseline in edit-client.api.spec.ts.
 *
 * ATDD baseline covers (NOT duplicated here):
 *   - 200 OK: updated fields in camelCase, same id, updatedAt updated, no snake_case, persistence
 *   - 400 Bad Request: each missing field individually, empty body, Problem Details RFC 7807
 *   - 404 Not Found: non-existent id, Problem Details, malformed UUID id
 *   - 409 Conflict: duplicate NIT from another client, Problem Details, no stack trace, idempotent NIT
 *
 * Edge cases added here:
 *   - Field length boundary: Nombre > 200 chars → 400
 *   - Field length boundary: NIT > 50 chars → 400
 *   - Field length boundary: Teléfono > 30 chars → 400
 *   - Field length boundary: Ciudad > 100 chars → 400
 *   - Whitespace-only Nombre rejected → 400
 *   - Whitespace-only NIT rejected → 400
 *   - PUT returns 200 with createdAt preserved (not overwritten)
 *   - PUT extra unknown fields in body: request still succeeds (extra fields ignored)
 *   - Response body has no extra undocumented fields beyond the 7-field contract
 *   - Concurrent PUTs to same id: second PUT does not corrupt the first result
 *   - OPTIONS request to PUT endpoint: non-500 response
 *   - DELETE request after successful PUT returns 200 (clean cleanup)
 *
 * Requirements: Backend running on http://localhost:5000 with EF Core migration applied.
 */

import { test, expect } from '@playwright/test';
import { createClientePayload } from '../../support/factories/cliente.factory';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// Field length boundary conditions — validate max-length enforcement
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — field max-length boundary conditions', () => {
  test('[P1] should return HTTP 400 when "nombre" exceeds 200 characters', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with a 201-character Nombre
      const longNombre = 'A'.repeat(201);
      const payload = { ...createPayload, nombre: longNombre };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('[P1] should return HTTP 400 when "nit" exceeds 50 characters', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with a 51-character NIT
      const longNit = '9'.repeat(51);
      const payload = { ...createPayload, nit: longNit };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('[P2] should return HTTP 400 when "telefono" exceeds 30 characters', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with a 31-character telefono
      const longTel = '3'.repeat(31);
      const payload = { ...createPayload, telefono: longTel };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('[P2] should return HTTP 400 when "ciudad" exceeds 100 characters', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with a 101-character ciudad
      const longCiudad = 'B'.repeat(101);
      const payload = { ...createPayload, ciudad: longCiudad };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('[P2] should return HTTP 200 when "nombre" is exactly 200 characters (boundary — valid)', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with exactly 200-character Nombre
      const exactNombre = 'C'.repeat(200);
      const payload = { ...createPayload, nombre: exactNombre };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 200 OK (200 chars is exactly at the limit — should be accepted)
      expect(response.status()).toBe(200);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Whitespace-only field values — should be rejected as empty
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — whitespace-only field values rejected', () => {
  test('[P1] should return HTTP 400 when "nombre" is whitespace-only', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with whitespace-only Nombre
      const payload = { ...createPayload, nombre: '   ' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request (FluentValidation: NotEmpty() rejects whitespace)
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('[P1] should return HTTP 400 when "nit" is whitespace-only', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called with whitespace-only NIT
      const payload = { ...createPayload, nit: '   ' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });

      // THEN: HTTP 400 Bad Request
      expect(response.status()).toBe(400);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createdAt is preserved — PUT must not overwrite createdAt timestamp
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — createdAt field is immutable', () => {
  test('[P1] should return the same createdAt value as the original POST response', async ({ request }) => {
    // GIVEN: A client is created
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    const originalCreatedAt = created.createdAt;

    try {
      // Add a small delay so timestamps could potentially differ
      await new Promise((r) => setTimeout(r, 50));

      // WHEN: PUT is called with updated values
      const updatePayload = { ...createPayload, nombre: 'CreatedAt Check SA' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });
      expect(response.status()).toBe(200);
      const body = await response.json();

      // THEN: createdAt is unchanged after the update
      expect(body.createdAt).toBe(originalCreatedAt);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Extra unknown fields in request body — should be ignored (not cause 400/500)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — extra fields in request body are ignored', () => {
  test('[P2] should return HTTP 200 when request body includes unknown extra fields', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT body includes extra unexpected fields (createdAt, unexpectedField)
      const payloadWithExtras = {
        ...createPayload,
        nombre: 'Extra Fields SA',
        createdAt: '2000-01-01T00:00:00Z', // should be ignored
        unexpectedField: 'should be silently dropped',
      };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payloadWithExtras });

      // THEN: HTTP 200 OK (extra fields silently ignored; backend only reads known fields)
      expect(response.status()).toBe(200);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response body contract — no extra undocumented fields
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — response body contains exactly the documented 7 fields', () => {
  test('[P2] should return a response body with exactly: id, nombre, nit, telefono, ciudad, createdAt, updatedAt', async ({ request }) => {
    // GIVEN: A valid client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT is called
      const updatePayload = { ...createPayload, nombre: 'Contract Check SA' };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: updatePayload });
      const body = await response.json();
      const keys = Object.keys(body).sort();

      // THEN: Response has exactly the 7 documented fields
      expect(keys).toEqual(['ciudad', 'createdAt', 'id', 'nit', 'nombre', 'telefono', 'updatedAt']);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Concurrent PUTs to the same id — last write wins, no corruption
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — concurrent updates do not corrupt data', () => {
  test('[P2] should return HTTP 200 for each concurrent PUT request to the same id', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: Two concurrent PUT requests are made to the same endpoint
      const [response1, response2] = await Promise.all([
        request.put(`${ENDPOINT}/${created.id}`, { data: { ...createPayload, nombre: 'Concurrent A SA' } }),
        request.put(`${ENDPOINT}/${created.id}`, { data: { ...createPayload, nombre: 'Concurrent B SA' } }),
      ]);

      // THEN: Both return HTTP 200 (no deadlock or 500 errors)
      expect(response1.status()).toBe(200);
      expect(response2.status()).toBe(200);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('[P2] should return a valid JSON body after concurrent PUTs (no corruption)', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: Two concurrent PUTs
      const [r1, r2] = await Promise.all([
        request.put(`${ENDPOINT}/${created.id}`, { data: { ...createPayload, nombre: 'Concurrent X SA' } }),
        request.put(`${ENDPOINT}/${created.id}`, { data: { ...createPayload, nombre: 'Concurrent Y SA' } }),
      ]);

      const body1 = await r1.json();
      const body2 = await r2.json();

      // THEN: Both responses contain a valid id and a nombre field (one of the two submitted values)
      expect(body1.id).toBe(created.id);
      expect(body2.id).toBe(created.id);
      expect(['Concurrent X SA', 'Concurrent Y SA']).toContain(body1.nombre);
      expect(['Concurrent X SA', 'Concurrent Y SA']).toContain(body2.nombre);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HTTP method safety — OPTIONS and unsupported verbs
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — HTTP method safety', () => {
  test('[P2] OPTIONS request to the endpoint returns a non-500 response', async ({ request }) => {
    // GIVEN: A known client id (non-existent is acceptable here — checking method handling)
    const nonExistentId = '00000000-0000-0000-0000-999999999999';

    // WHEN: OPTIONS is sent
    const response = await request.fetch(`${ENDPOINT}/${nonExistentId}`, { method: 'OPTIONS' });

    // THEN: Not a 500 error (endpoint handles OPTIONS gracefully)
    expect(response.status()).not.toBe(500);
  });

  test('[P2] PATCH request to the update endpoint returns 404 or 405 (not 500)', async ({ request }) => {
    // GIVEN: A non-existent id
    const nonExistentId = '00000000-0000-0000-0000-888888888888';
    const payload = createClientePayload();

    // WHEN: PATCH is sent (not a registered method for this endpoint)
    const response = await request.fetch(`${ENDPOINT}/${nonExistentId}`, {
      method: 'PATCH',
      data: payload,
    });

    // THEN: 404 or 405 (Method Not Allowed) — not 500 Internal Server Error
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Problem Details 400 — errors object contains the correct field key
// ─────────────────────────────────────────────────────────────────────────────

test.describe('PUT /api/v1/clientes/{id} — 400 Problem Details errors field granularity', () => {
  test('[P1] should include "nit" key in errors object when "nit" is missing in the update', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT body is missing "nit"
      const payload = { nombre: createPayload.nombre, telefono: createPayload.telefono, ciudad: createPayload.ciudad };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });
      const body = await response.json();

      // THEN: errors object has a key for "nit" (case-insensitive match)
      expect(response.status()).toBe(400);
      const errorKeys = Object.keys(body.errors ?? {}).map((k) => k.toLowerCase());
      expect(errorKeys.some((k) => k.includes('nit'))).toBe(true);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('[P1] should include "ciudad" key in errors object when "ciudad" is missing in the update', async ({ request }) => {
    // GIVEN: A client exists
    const createPayload = createClientePayload();
    const createResponse = await request.post(ENDPOINT, { data: createPayload });
    const created = await createResponse.json();

    try {
      // WHEN: PUT body is missing "ciudad"
      const payload = { nombre: createPayload.nombre, nit: createPayload.nit, telefono: createPayload.telefono };
      const response = await request.put(`${ENDPOINT}/${created.id}`, { data: payload });
      const body = await response.json();

      // THEN: errors object has a key for "ciudad"
      expect(response.status()).toBe(400);
      const errorKeys = Object.keys(body.errors ?? {}).map((k) => k.toLowerCase());
      expect(errorKeys.some((k) => k.includes('ciudad'))).toBe(true);
    } finally {
      await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });
});
