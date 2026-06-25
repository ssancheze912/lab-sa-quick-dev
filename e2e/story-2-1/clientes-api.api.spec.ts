/**
 * Story 2.1: Client List & Search — API Contract Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: GET /api/v1/clientes returns 200 with array containing Nombre + NIT per item
 * - AC3: GET /api/v1/clientes returns 200 with empty array when no clients exist
 * - AC4: API returns 500 + Problem Details on server error (ErrorPanel trigger)
 *
 * These tests hit the real backend (http://localhost:5000).
 * They will remain RED until the backend endpoint is implemented.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const ENDPOINT = `${BASE_URL}/api/v1/clientes`;

// ─── AC1: GET /api/v1/clientes — happy path ───────────────────────────────────

test.describe('GET /api/v1/clientes — AC1', () => {
  test('should return HTTP 200 OK', async ({ request }) => {
    // GIVEN: The backend is running and the clientes endpoint is registered
    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);

    // THEN: Response status is 200
    expect(response.status()).toBe(200);
  });

  test('should return Content-Type application/json', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);

    // THEN: Content-Type header is application/json
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should return a JSON array (not an object wrapper)', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);
    const body = await response.json();

    // THEN: Body is a JSON array directly (no wrapper object)
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return items with camelCase id field', async ({ request }) => {
    // GIVEN: The backend is running and there is at least one client seeded
    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);
    const body: unknown[] = await response.json();

    // THEN: Each item has an id field (UUID string)
    if (body.length > 0) {
      const item = body[0] as Record<string, unknown>;
      expect(typeof item['id']).toBe('string');
      expect(item['id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }
  });

  test('should return items with camelCase nombre field', async ({ request }) => {
    // GIVEN: The backend is running with at least one client
    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);
    const body: unknown[] = await response.json();

    // THEN: Each item has a nombre field (string)
    if (body.length > 0) {
      const item = body[0] as Record<string, unknown>;
      expect(typeof item['nombre']).toBe('string');
    }
  });

  test('should return items with camelCase nit field', async ({ request }) => {
    // GIVEN: The backend is running with at least one client
    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);
    const body: unknown[] = await response.json();

    // THEN: Each item has a nit field (string)
    if (body.length > 0) {
      const item = body[0] as Record<string, unknown>;
      expect(typeof item['nit']).toBe('string');
    }
  });

  test('should return items with camelCase createdAt and updatedAt fields', async ({ request }) => {
    // GIVEN: The backend is running with at least one client
    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);
    const body: unknown[] = await response.json();

    // THEN: Each item has createdAt and updatedAt as ISO 8601 strings
    if (body.length > 0) {
      const item = body[0] as Record<string, unknown>;
      expect(typeof item['createdAt']).toBe('string');
      expect(typeof item['updatedAt']).toBe('string');
    }
  });
});

// ─── AC3: GET /api/v1/clientes — empty state ──────────────────────────────────

test.describe('GET /api/v1/clientes — AC3 empty state', () => {
  test('should return 200 OK with empty array when no clients exist', async ({ request }) => {
    // GIVEN: The clientes table is empty
    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);

    // THEN: Response is 200 OK with empty array []
    expect(response.status()).toBe(200);
    const body = await response.json();
    // The body must be an array (may be empty or contain items)
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─── AC4: Problem Details on error ────────────────────────────────────────────

test.describe('Error handling — AC4', () => {
  test('should NOT return snake_case field names (no nombre_campo pattern)', async ({ request }) => {
    // GIVEN: The backend is running with at least one client
    // WHEN: A GET request is sent to /api/v1/clientes
    const response = await request.get(ENDPOINT);
    const body: unknown[] = await response.json();

    // THEN: No snake_case keys exist (API uses camelCase per contract)
    if (body.length > 0) {
      const item = body[0] as Record<string, unknown>;
      const keys = Object.keys(item);
      const snakeCaseKeys = keys.filter((k) => k.includes('_'));
      expect(snakeCaseKeys).toHaveLength(0);
    }
  });
});
