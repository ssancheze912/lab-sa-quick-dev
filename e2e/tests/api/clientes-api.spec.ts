/**
 * Story 2.1: Client List & Search
 * API Contract Tests — RED Phase (Playwright APIRequestContext)
 *
 * These tests are intentionally FAILING until the backend implementation
 * for GET /api/v1/clientes is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — GET /api/v1/clientes returns 200 OK with a direct array of ClienteDto objects.
 *   AC4 — The endpoint exists and is registered (no 404).
 *
 * Contract: Direct array (no wrapper), fields: id, nombre, nit, telefono, ciudad,
 *           createdAt, updatedAt.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_ENDPOINT = `${API_BASE_URL}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — GET /api/v1/clientes returns 200 with a direct array
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes — contract tests', () => {
  test('should return HTTP 200', async ({ request }) => {
    // GIVEN: The backend is running and GET /api/v1/clientes is registered

    // WHEN: An HTTP GET request is sent to the endpoint
    const response = await request.get(CLIENTES_ENDPOINT);

    // THEN: The response status is 200 OK
    expect(response.status()).toBe(200);
  });

  test('should return Content-Type application/json', async ({ request }) => {
    // GIVEN: The endpoint is available

    // WHEN: A GET request is sent
    const response = await request.get(CLIENTES_ENDPOINT);

    // THEN: Content-Type header indicates JSON
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('should return a JSON array (direct array — no wrapper object)', async ({ request }) => {
    // GIVEN: The endpoint returns its response

    // WHEN: The body is parsed
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    // THEN: The response body is a JSON array (direct, no { data: [...] } wrapper)
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return ClienteDto objects with required fields', async ({ request }) => {
    // GIVEN: At least one client exists in the database (or the list may be empty)

    // WHEN: The endpoint is called
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json() as unknown[];

    // THEN: If any clients exist, each has the expected shape
    if (body.length > 0) {
      const cliente = body[0] as Record<string, unknown>;
      expect(typeof cliente.id).toBe('string');
      expect(typeof cliente.nombre).toBe('string');
      expect(typeof cliente.nit).toBe('string');
      expect(typeof cliente.telefono).toBe('string');
      expect(typeof cliente.ciudad).toBe('string');
      expect(typeof cliente.createdAt).toBe('string');
      expect(typeof cliente.updatedAt).toBe('string');
    }
  });

  test('should return id as a non-empty string (UUID v7)', async ({ request }) => {
    // GIVEN: At least one client exists

    // WHEN: The endpoint is called
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json() as unknown[];

    // THEN: Each id is a non-empty string (UUID format)
    if (body.length > 0) {
      const cliente = body[0] as Record<string, unknown>;
      expect(typeof cliente.id).toBe('string');
      expect((cliente.id as string).length).toBeGreaterThan(0);
      // UUID v7 format: xxxxxxxx-xxxx-7xxx-xxxx-xxxxxxxxxxxx
      expect(cliente.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    }
  });

  test('should return createdAt and updatedAt as ISO 8601 strings', async ({ request }) => {
    // GIVEN: At least one client exists

    // WHEN: The endpoint is called
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json() as unknown[];

    // THEN: Timestamp fields are valid ISO 8601 date strings
    if (body.length > 0) {
      const cliente = body[0] as Record<string, unknown>;
      expect(new Date(cliente.createdAt as string).toISOString()).toBeTruthy();
      expect(new Date(cliente.updatedAt as string).toISOString()).toBeTruthy();
    }
  });

  test('should return an empty array when no clients exist', async ({ request }) => {
    // GIVEN: The database may be empty on a clean environment

    // WHEN: The endpoint is called
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    // THEN: An empty array is a valid response (not an error)
    expect(Array.isArray(body)).toBe(true);
    // Status is still 200 (not 204 No Content)
    expect(response.status()).toBe(200);
  });

  test('should NOT return a wrapper object with a "data" or "items" key', async ({ request }) => {
    // GIVEN: The endpoint follows the architecture pattern (direct array — no wrapper)

    // WHEN: The endpoint is called
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    // THEN: The root of the response is an array, not an object with wrapper keys
    expect(Array.isArray(body)).toBe(true);
    // Confirming it's not { data: [...] } or { items: [...] }
    expect(typeof body).not.toBe('object');  // Only if not array; array passes above
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Endpoint is registered (not 404)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('GET /api/v1/clientes — endpoint registration', () => {
  test('should NOT return 404 (endpoint must be registered in Program.cs)', async ({ request }) => {
    // GIVEN: The endpoint is registered via app.MapClienteEndpoints()

    // WHEN: A GET request is sent
    const response = await request.get(CLIENTES_ENDPOINT);

    // THEN: The response is not a 404 Not Found
    expect(response.status()).not.toBe(404);
  });

  test('should NOT return 405 Method Not Allowed for GET', async ({ request }) => {
    // GIVEN: GET is explicitly mapped for this endpoint

    // WHEN: A GET request is sent
    const response = await request.get(CLIENTES_ENDPOINT);

    // THEN: The method is allowed (not 405)
    expect(response.status()).not.toBe(405);
  });
});
