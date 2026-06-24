/**
 * API Tests — Story 3.2: GET /api/v1/contactos/{id} contract
 * RED PHASE — Tests are intentionally FAILING until backend implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — GET /api/v1/contactos/{id} returns correct HTTP contract (status, headers, body shape)
 *   AC3 — GET /api/v1/contactos/{id} returns 404 Problem Details when contact does not exist (NFR6)
 *
 * Uses Playwright's APIRequestContext (no browser). Requires:
 *   - Backend running on http://localhost:5000
 *   - EF Core migration applied (contactos table exists)
 *   - No authentication required (MVP has no auth layer)
 *
 * Note: Tests seed data via POST /api/v1/contactos and clean up after themselves.
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ENDPOINT = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/contactos/{id} — happy path contract (AC2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/contactos/{id} — HTTP contract (happy path, AC2)', () => {
  test('should return HTTP 200 when the contact exists', async ({ request }) => {
    // GIVEN: A contact is seeded in the database
    const payload = {
      nombre: 'GetById Test Contacto',
      cargo: 'Analista',
      telefono: `310${Date.now().toString().slice(-7)}`,
      email: `getbyid_${Date.now()}@test.com`,
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos/{id} is called with the seeded ID
      const response = await request.get(`${ENDPOINT}/${createdId}`);

      // THEN: HTTP status is 200
      expect(response.status()).toBe(200);
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('should return Content-Type: application/json for an existing contact', async ({ request }) => {
    // GIVEN: A contact exists
    const payload = {
      nombre: 'ContentType Test Contacto',
      cargo: 'Coordinador',
      telefono: `311${Date.now().toString().slice(-7)}`,
      email: `contenttype_${Date.now()}@test.com`,
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos/{id} is called
      const response = await request.get(`${ENDPOINT}/${createdId}`);

      // THEN: Content-Type header is application/json
      expect(response.headers()['content-type']).toMatch(/application\/json/i);
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('should return a single JSON object (not an array) for an existing contact', async ({ request }) => {
    // GIVEN: A contact exists
    const payload = {
      nombre: 'Single Object Contacto',
      cargo: 'Jefe de Área',
      telefono: `312${Date.now().toString().slice(-7)}`,
      email: `singleobj_${Date.now()}@test.com`,
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos/{id} is called
      const response = await request.get(`${ENDPOINT}/${createdId}`);
      const body = await response.json();

      // THEN: Response is a JSON object, NOT an array
      expect(Array.isArray(body)).toBe(false);
      expect(typeof body).toBe('object');
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('should return required camelCase fields: id, nombre, cargo, telefono, email, clienteId, createdAt, updatedAt', async ({ request }) => {
    // GIVEN: A contact is seeded with all required fields
    const payload = {
      nombre: 'Fields Validation Contacto',
      cargo: 'Director Comercial',
      telefono: `313${Date.now().toString().slice(-7)}`,
      email: `fields_${Date.now()}@test.com`,
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos/{id} is called
      const response = await request.get(`${ENDPOINT}/${createdId}`);
      const body = await response.json() as Record<string, unknown>;

      // THEN: All required camelCase fields are present
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('nombre');
      expect(body).toHaveProperty('cargo');
      expect(body).toHaveProperty('telefono');
      expect(body).toHaveProperty('email');
      expect(body).toHaveProperty('clienteId');
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('should return the correct field values matching the seeded contact data', async ({ request }) => {
    // GIVEN: A contact is seeded with specific values
    const payload = {
      nombre: 'Valores Exactos Contacto',
      cargo: 'Subgerente',
      telefono: `314${Date.now().toString().slice(-7)}`,
      email: `valores_${Date.now()}@test.com`,
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const created = createResponse.ok() ? await createResponse.json() : null;

    try {
      // WHEN: GET /api/v1/contactos/{id} is called
      const response = await request.get(`${ENDPOINT}/${created?.id}`);
      const body = await response.json() as Record<string, unknown>;

      // THEN: Field values match exactly what was seeded
      expect(body.nombre).toBe(payload.nombre);
      expect(body.cargo).toBe(payload.cargo);
      expect(body.telefono).toBe(payload.telefono);
      expect(body.email).toBe(payload.email);
    } finally {
      if (created?.id) await request.delete(`${ENDPOINT}/${created.id}`);
    }
  });

  test('should return id as a UUID string (not numeric)', async ({ request }) => {
    // GIVEN: A contact is seeded
    const payload = {
      nombre: 'UUID Shape Contacto',
      cargo: 'Técnico',
      telefono: `315${Date.now().toString().slice(-7)}`,
      email: `uuidshape_${Date.now()}@test.com`,
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos/{id} is called
      const response = await request.get(`${ENDPOINT}/${createdId}`);
      const body = await response.json() as Record<string, unknown>;

      // THEN: id matches UUID format
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(String(body.id)).toMatch(uuidPattern);
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('should return createdAt and updatedAt as ISO 8601 timestamp strings', async ({ request }) => {
    // GIVEN: A contact is seeded
    const payload = {
      nombre: 'Timestamps Contacto',
      cargo: 'Asesor',
      telefono: `316${Date.now().toString().slice(-7)}`,
      email: `timestamps_${Date.now()}@test.com`,
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos/{id} is called
      const response = await request.get(`${ENDPOINT}/${createdId}`);
      const body = await response.json() as Record<string, unknown>;

      // THEN: Timestamps are ISO 8601 strings
      expect(typeof body.createdAt).toBe('string');
      expect(typeof body.updatedAt).toBe('string');
      expect(new Date(String(body.createdAt)).toISOString()).toBe(body.createdAt);
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('should NOT return snake_case field names (must be camelCase)', async ({ request }) => {
    // GIVEN: A contact is seeded
    const payload = {
      nombre: 'CamelCase Only Contacto',
      cargo: 'Auxiliar',
      telefono: `317${Date.now().toString().slice(-7)}`,
      email: `camelcase_${Date.now()}@test.com`,
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos/{id} is called
      const response = await request.get(`${ENDPOINT}/${createdId}`);
      const body = await response.json() as Record<string, unknown>;

      // THEN: No snake_case keys exist
      const keys = Object.keys(body);
      expect(keys).not.toContain('created_at');
      expect(keys).not.toContain('updated_at');
      expect(keys).not.toContain('cliente_id');
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });

  test('should return clienteId as null when the contact has no associated client', async ({ request }) => {
    // GIVEN: A contact is seeded without a clienteId
    const payload = {
      nombre: 'Sin Cliente Contacto',
      cargo: 'Vendedor',
      telefono: `318${Date.now().toString().slice(-7)}`,
      email: `sincliente_${Date.now()}@test.com`,
    };
    const createResponse = await request.post(ENDPOINT, { data: payload });
    const createdId: string | undefined = createResponse.ok()
      ? (await createResponse.json()).id
      : undefined;

    try {
      // WHEN: GET /api/v1/contactos/{id} is called
      const response = await request.get(`${ENDPOINT}/${createdId}`);
      const body = await response.json() as Record<string, unknown>;

      // THEN: clienteId is null
      expect(body.clienteId).toBeNull();
    } finally {
      if (createdId) await request.delete(`${ENDPOINT}/${createdId}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/contactos/{id} — 404 not found (AC3, NFR6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/contactos/{id} — 404 Not Found contract (AC3, NFR6)', () => {
  test('should return HTTP 404 when the contact does not exist', async ({ request }) => {
    // GIVEN: A UUID that does not correspond to any contact
    const nonExistentId = '99999999-9999-9999-9999-999999999999';

    // WHEN: GET /api/v1/contactos/{id} is called with a non-existent ID
    const response = await request.get(`${ENDPOINT}/${nonExistentId}`);

    // THEN: HTTP status is 404 (Not Found)
    expect(response.status()).toBe(404);
  });

  test('should return RFC 7807 Problem Details body on 404 (not-found)', async ({ request }) => {
    // GIVEN: A non-existent contact ID
    const nonExistentId = '88888888-8888-8888-8888-888888888888';

    // WHEN: GET /api/v1/contactos/{id} is called
    const response = await request.get(`${ENDPOINT}/${nonExistentId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: Response body follows RFC 7807 Problem Details format
    expect(body).toHaveProperty('status', 404);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
  });

  test('should include a descriptive detail message in the 404 Problem Details body', async ({ request }) => {
    // GIVEN: A non-existent contact ID
    const nonExistentId = '77777777-7777-7777-7777-777777777777';

    // WHEN: GET /api/v1/contactos/{id} is called
    const response = await request.get(`${ENDPOINT}/${nonExistentId}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: A detail field describing the missing resource is present
    expect(body).toHaveProperty('detail');
    expect(String(body.detail)).toMatch(/77777777-7777-7777-7777-777777777777/);
  });

  test('should NOT return HTTP 500 for a non-existent contact ID (must be 404 — NotFoundException)', async ({ request }) => {
    // GIVEN: A non-existent contact ID
    const nonExistentId = '66666666-6666-6666-6666-666666666666';

    // WHEN: GET /api/v1/contactos/{id} is called
    const response = await request.get(`${ENDPOINT}/${nonExistentId}`);

    // THEN: Status is 404, not 500 (ExceptionHandlingMiddleware must handle NotFoundException correctly)
    expect(response.status()).not.toBe(500);
    expect(response.status()).toBe(404);
  });

  test('should NOT expose a stack trace in the 404 response body (NFR6)', async ({ request }) => {
    // GIVEN: A non-existent contact ID
    const nonExistentId = '55555555-5555-5555-5555-555555555555';

    // WHEN: GET /api/v1/contactos/{id} is called
    const response = await request.get(`${ENDPOINT}/${nonExistentId}`);
    const body = await response.json() as Record<string, unknown>;
    const bodyStr = JSON.stringify(body);

    // THEN: No stack trace fields or content in the response
    expect(bodyStr).not.toMatch(/StackTrace/i);
    expect(bodyStr).not.toMatch(/at System\./);
    expect(bodyStr).not.toMatch(/\.cs:line/);
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('exceptionDetails');
  });

  test('should NOT return HTTP 200 for a non-existent contact ID', async ({ request }) => {
    // GIVEN: A non-existent contact ID
    const nonExistentId = '44444444-4444-4444-4444-444444444444';

    // WHEN: GET /api/v1/contactos/{id} is called
    const response = await request.get(`${ENDPOINT}/${nonExistentId}`);

    // THEN: Status is NOT 200 (must not silently return empty/wrong data)
    expect(response.status()).not.toBe(200);
  });
});
