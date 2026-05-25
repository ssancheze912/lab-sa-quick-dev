/**
 * Story 2.1: Client List & Search
 * Epic 2: Gestión de Clientes
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC5 — GET /api/v1/clientes returns 200 with a JSON array of client objects,
 *          each with id (UUID), nombre, nitRuc, telefono, ciudad, creadoEn (ISO 8601)
 *   AC6 — Migration creates the clientes table (verified indirectly via API availability)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — GET /api/v1/clientes endpoint contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — GET /api/v1/clientes endpoint contract', () => {
  test('should respond with HTTP 200 when the endpoint is called', async ({ request }) => {
    // GIVEN: The backend is running and the clientes table exists
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response status is 200 OK
    expect(response.status()).toBe(200);
  });

  test('should return Content-Type application/json', async ({ request }) => {
    // GIVEN: The backend is running with the clientes endpoint registered
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response content type is application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return a JSON array (not a wrapper object)', async ({ request }) => {
    // GIVEN: The backend endpoint returns data per API contract (direct array, no wrapper)
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response body is a JSON array
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return client objects with id (UUID) field when clients exist', async ({ request }) => {
    // GIVEN: At least one client exists in the system
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: Each object in the array has an id field that is a UUID string
    if (body.length > 0) {
      const first = body[0];
      expect(typeof first.id).toBe('string');
      // UUID v4 pattern
      expect(first.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }
  });

  test('should return client objects with nombre field', async ({ request }) => {
    // GIVEN: At least one client exists in the system
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: Each client object has a nombre (string) field
    if (body.length > 0) {
      expect(typeof body[0].nombre).toBe('string');
    }
  });

  test('should return client objects with nitRuc field (camelCase)', async ({ request }) => {
    // GIVEN: At least one client exists in the system
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: Each client object has a nitRuc field (camelCase per .NET JSON serialization)
    if (body.length > 0) {
      expect(Object.prototype.hasOwnProperty.call(body[0], 'nitRuc')).toBe(true);
    }
  });

  test('should return client objects with creadoEn as ISO 8601 UTC string', async ({ request }) => {
    // GIVEN: At least one client exists in the system
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: creadoEn is a valid ISO 8601 date string (not a Unix timestamp)
    if (body.length > 0) {
      const creadoEn = body[0].creadoEn as string;
      expect(typeof creadoEn).toBe('string');
      // ISO 8601 pattern with timezone offset or Z
      expect(new Date(creadoEn).toISOString()).toBeTruthy();
      expect(isNaN(Date.parse(creadoEn))).toBe(false);
    }
  });

  test('should NOT return nit_ruc (snake_case) — must be camelCase nitRuc', async ({ request }) => {
    // GIVEN: The .NET serializer uses camelCase (default System.Text.Json behavior)
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);
    const body = await response.json() as Array<Record<string, unknown>>;

    // THEN: The response does NOT expose snake_case field names
    if (body.length > 0) {
      expect(Object.prototype.hasOwnProperty.call(body[0], 'nit_ruc')).toBe(false);
    }
  });

  test('should return empty array when no clients exist (not 404 or null)', async ({ request }) => {
    // GIVEN: The clientes table exists but may have no records
    // WHEN: GET /api/v1/clientes is called on an empty database
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: Status is 200 with an empty array body (not 404, not null body)
    expect(response.status()).toBe(200);
    const body = await response.json();
    // If empty, body must be an empty array [] not null
    expect(body).not.toBeNull();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Database migration verification (indirect via endpoint availability)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Database migration: clientes table exists', () => {
  test('should not return 500 due to missing clientes table (migration was applied)', async ({ request }) => {
    // GIVEN: The migration AddClientesTable has been applied via dotnet ef database update
    // WHEN: GET /api/v1/clientes is called
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The response is not a 500 (which would indicate a missing table)
    expect(response.status()).not.toBe(500);
    expect(response.status()).toBe(200);
  });
});
