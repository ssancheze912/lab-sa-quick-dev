import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

/**
 * ATDD — Story 2.1: Client List & Search — API Integration Tests
 *
 * Tests are in RED phase — they validate the REST contract for GET /api/v1/clientes
 * BEFORE the endpoint exists.
 *
 * Coverage:
 *   API-C-07  P1  — GET /api/v1/clientes returns a JSON array where each item
 *                   contains at minimum: id (UUID), nombre, nit fields
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
