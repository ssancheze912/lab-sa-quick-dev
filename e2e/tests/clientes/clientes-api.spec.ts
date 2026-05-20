import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * ATDD — Story 2.1 & 2.2: Client API Integration Tests
 *
 * Coverage:
 *   API-C-07  P1  — GET /api/v1/clientes returns a JSON array where each item
 *                   contains at minimum: id (UUID), nombre, nit fields
 *   API-C-08  P1  — GET /api/v1/clientes/:id with valid ID returns 200 and full client object
 *   API-C-09  P1  — GET /api/v1/clientes/:id with non-existent ID returns 404 Problem Details
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

test.describe('Story 2.2 — API: GET /api/v1/clientes/:id', () => {
  const createdIds: string[] = [];

  test.afterEach(async ({ request }) => {
    for (const id of createdIds) {
      await request.delete(`${API_BASE_URL}/api/v1/clientes/${id}`).catch(() => null);
    }
    createdIds.length = 0;
  });

  // ---------------------------------------------------------------------------
  // API-C-08 (P1)
  // Given a valid clienteId that exists in the system
  // When GET /api/v1/clientes/:id is called
  // Then the response is 200 OK with full client object
  // ---------------------------------------------------------------------------
  test('API-C-08 — GET /api/v1/clientes/:id con ID válido devuelve 200 y el objeto completo del cliente', async ({ request }) => {
    // GIVEN — a client is created
    const payload = {
      nombre: 'Empresa API-C-08 Test',
      nit: `900${Date.now().toString().slice(-9)}`,
      telefono: '+57 1 234 5678',
      ciudad: 'Bogotá',
    };
    const createResponse = await request.post(`${API_BASE_URL}/api/v1/clientes`, { data: payload });
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    createdIds.push(created.id);

    // WHEN — GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${created.id}`);

    // THEN — response is 200 OK
    expect(response.status()).toBe(200);

    // AND — body contains all required fields
    const body = await response.json();
    expect(body.id).toBe(created.id);
    expect(body.nombre).toBe(payload.nombre);
    expect(body.nit).toBe(payload.nit);
    expect(body.telefono).toBe(payload.telefono);
    expect(body.ciudad).toBe(payload.ciudad);

    // AND — createdAt is ISO 8601 with timezone (DateTimeOffset)
    expect(typeof body.createdAt).toBe('string');
    expect(body.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
    );
  });

  // ---------------------------------------------------------------------------
  // API-C-09 (P1)
  // Given a clienteId that does NOT exist in the system
  // When GET /api/v1/clientes/:id is called
  // Then the response is 404 with Problem Details (no stack trace — NFR6)
  // ---------------------------------------------------------------------------
  test('API-C-09 — GET /api/v1/clientes/:id con ID inexistente devuelve 404 Problem Details sin stack trace', async ({ request }) => {
    // GIVEN — a UUID that does not exist in the system
    const nonExistentId = '00000000-0000-4000-8000-000000000000';

    // WHEN — GET /api/v1/clientes/:id is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes/${nonExistentId}`);

    // THEN — response is 404
    expect(response.status()).toBe(404);

    // AND — body is Problem Details (RFC 7807)
    const body = await response.json();
    expect(body.status).toBe(404);
    expect(typeof body.title).toBe('string');

    // AND — no stack trace is exposed (NFR6)
    expect(body.stackTrace).toBeUndefined();
    expect(body.exception).toBeUndefined();
    expect(body.detail).not.toMatch(/at SiesaAgents/i);
  });
});
