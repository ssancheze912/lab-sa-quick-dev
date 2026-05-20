import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * ATDD — Story 2.1 + Story 2.2: Client API Integration Tests
 *
 * Tests are in RED phase — they validate the REST contract for:
 *   GET /api/v1/clientes         (Story 2.1)
 *   GET /api/v1/clientes/:id     (Story 2.2)
 * BEFORE the endpoints exist.
 *
 * Coverage:
 *   API-C-07  P1  — GET /api/v1/clientes returns a JSON array where each item
 *                   contains at minimum: id (UUID), nombre, nit fields
 *   API-C-08  P1  — GET /api/v1/clientes/:id with valid ID returns 200 + full ClienteDto
 *                   (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
 *   API-C-09  P1  — GET /api/v1/clientes/:id with non-existent ID returns 404 + Problem Details
 *                   (RFC 7807 — no stackTrace key exposed — NFR6)
 */

test.describe('Story 2.1 — API: GET /api/v1/clientes', () => {

  // ---------------------------------------------------------------------------
  // API-C-07 (P1 · AC1)
  // Given the backend is running and the clientes table exists
  // When a GET /api/v1/clientes request is made
  // Then the response is 200 OK with a JSON array
  //   AND each element contains id (UUID v4), nombre, and nit fields
  // ---------------------------------------------------------------------------
  test('API-C-07 — GET /api/v1/clientes devuelve un array; cada item contiene id, nombre y nit', async ({ request }) => {
    // WHEN — performing a direct GET to the clientes endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN — response is 200 OK
    expect(response.status()).toBe(200);

    // AND — body is a JSON array (not a wrapper object)
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    // AND — if there are results, each item satisfies the contract
    if (body.length > 0) {
      const item = body[0];

      // id must be a UUID v4 string
      expect(typeof item.id).toBe('string');
      expect(item.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      // nombre and nit must be non-empty strings
      expect(typeof item.nombre).toBe('string');
      expect(item.nombre.length).toBeGreaterThan(0);
      expect(typeof item.nit).toBe('string');
      expect(item.nit.length).toBeGreaterThan(0);

      // createdAt must be ISO 8601 with timezone (DateTimeOffset — not plain DateTime)
      expect(typeof item.createdAt).toBe('string');
      expect(item.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
      );

      // Response must be a direct array, NOT a wrapper object { data: [...] }
      expect((body as Record<string, unknown>).data).toBeUndefined();
    }
  });

  // ---------------------------------------------------------------------------
  // Additional contract guard (P1 · AC1)
  // Given the backend is running
  // When GET /api/v1/clientes is called
  // Then Content-Type is application/json (not application/problem+json)
  // AND the response body is not a Problem Details object
  // ---------------------------------------------------------------------------
  test('API-C-07b — GET /api/v1/clientes devuelve Content-Type application/json en condiciones normales', async ({ request }) => {
    // WHEN — making the request
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN — status is 200 (not 404 meaning route not registered, not 500)
    expect(response.status()).toBe(200);

    // AND — Content-Type is JSON
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
    expect(contentType).not.toContain('problem+json');

    // AND — body is not a Problem Details object
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect((body as Record<string, unknown>).title).toBeUndefined();
    expect((body as Record<string, unknown>).status).toBeUndefined();
  });
});

// =============================================================================
// Story 2.2 — API: GET /api/v1/clientes/:id
// =============================================================================

test.describe('Story 2.2 — API: GET /api/v1/clientes/:id', () => {

  // ---------------------------------------------------------------------------
  // API-C-08 (P1 · AC2)
  // Given the backend is running and a client exists
  // When GET /api/v1/clientes/:id is called with a valid UUID that exists
  // Then the response is 200 OK with the full ClienteDto
  //   AND the body contains: id, nombre, nit, telefono, ciudad, createdAt, updatedAt
  // ---------------------------------------------------------------------------
  test('API-C-08 — GET /api/v1/clientes/:id con ID válido devuelve 200 y ClienteDto completo', async ({ request }) => {
    // GIVEN — create a client to fetch
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, {
      data: {
        nombre: 'Empresa API-C-08 Test',
        nit: '901234567-1',
        telefono: '3012345678',
        ciudad: 'Cali',
      },
    });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    const clienteId: string = created.id;

    try {
      // WHEN — GET /api/v1/clientes/:id with the valid UUID
      const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${clienteId}`);

      // THEN — response is 200 OK
      expect(response.status()).toBe(200);

      // AND — Content-Type is application/json (not problem+json)
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('application/json');
      expect(contentType).not.toContain('problem+json');

      // AND — body is a single object (not an array)
      const body = await response.json();
      expect(typeof body).toBe('object');
      expect(Array.isArray(body)).toBe(false);

      // AND — id matches the requested UUID
      expect(body.id).toBe(clienteId);

      // AND — nombre is a non-empty string
      expect(typeof body.nombre).toBe('string');
      expect(body.nombre.length).toBeGreaterThan(0);

      // AND — nit is a non-empty string
      expect(typeof body.nit).toBe('string');
      expect(body.nit.length).toBeGreaterThan(0);

      // AND — telefono is present (string or null — optional field)
      expect(Object.prototype.hasOwnProperty.call(body, 'telefono')).toBe(true);

      // AND — ciudad is present (string or null — optional field)
      expect(Object.prototype.hasOwnProperty.call(body, 'ciudad')).toBe(true);

      // AND — createdAt is ISO 8601 with timezone (DateTimeOffset, not plain DateTime)
      expect(typeof body.createdAt).toBe('string');
      expect(body.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
      );

      // AND — updatedAt is ISO 8601 with timezone
      expect(typeof body.updatedAt).toBe('string');
      expect(body.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
      );

      // AND — response is a direct object, NOT a wrapper { data: {...} }
      expect(body.data).toBeUndefined();
    } finally {
      // CLEANUP — delete the created client regardless of test outcome
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${clienteId}`).catch(() => null);
    }
  });

  // ---------------------------------------------------------------------------
  // API-C-09 (P1 · AC3 · NFR6)
  // Given the backend is running
  // When GET /api/v1/clientes/:id is called with a UUID that does not exist
  // Then the response is 404 Not Found
  //   AND the body is a Problem Details object (RFC 7807)
  //   AND the body does NOT contain a stackTrace key (NFR6 — no internal details leaked)
  // ---------------------------------------------------------------------------
  test('API-C-09 — GET /api/v1/clientes/:id con ID inexistente devuelve 404 con Problem Details sin stackTrace', async ({ request }) => {
    // GIVEN — a UUID that is guaranteed not to exist in the system
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // WHEN — GET /api/v1/clientes/:id with the non-existent UUID
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN — response is 404 Not Found
    expect(response.status()).toBe(404);

    // AND — Content-Type is application/problem+json (RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('problem+json');

    // AND — body is a Problem Details object with required RFC 7807 fields
    const body = await response.json();
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);

    // AND — status field is 404
    expect(body.status).toBe(404);

    // AND — title is present (non-empty string describing the error)
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);

    // AND — stackTrace key MUST NOT be present (NFR6 — no internal details leaked)
    expect(body.stackTrace).toBeUndefined();
    expect(body.StackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
  });
});
