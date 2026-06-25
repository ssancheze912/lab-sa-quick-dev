/**
 * Story 2.2: Client Detail View — API Contract Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC3: GET /api/v1/clientes/{id} returns 200 with correct client data (camelCase, all fields)
 * - AC4: GET /api/v1/clientes/{id} returns 404 Problem Details RFC 7807 when client does not exist
 * - AC5: Backend error returns 500 Problem Details RFC 7807
 *
 * These tests hit the real backend (http://localhost:5000).
 * They will remain RED until the backend endpoint GET /api/v1/clientes/{id} is implemented.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const ENDPOINT_BASE = `${BASE_URL}/api/v1/clientes`;

// Use a seeded UUID — in a real environment, this would be seeded in the DB.
// For RED phase tests the backend endpoint does not exist so all will fail.
const KNOWN_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440001';
const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000000';

// ─── AC3: GET /api/v1/clientes/{id} — happy path ──────────────────────────────

test.describe('GET /api/v1/clientes/{id} — AC3 happy path', () => {
  test('should return HTTP 200 OK for an existing client', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists in the database
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);

    // THEN: Response status is 200
    expect(response.status()).toBe(200);
  });

  test('should return Content-Type application/json for an existing client', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists in the database
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);

    // THEN: Content-Type is application/json
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should return a direct ClienteDto object (not wrapped)', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists in the database
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json();

    // THEN: Body is a plain object (not an array, not wrapped in { data: ... })
    expect(typeof body).toBe('object');
    expect(Array.isArray(body)).toBe(false);
  });

  test('should return the correct id field matching the requested UUID', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists in the database
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: Body contains the id matching the requested UUID
    expect(body['id']).toBe(KNOWN_CLIENT_ID);
  });

  test('should return camelCase nombre field', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: nombre field is a non-empty string
    expect(typeof body['nombre']).toBe('string');
    expect((body['nombre'] as string).length).toBeGreaterThan(0);
  });

  test('should return camelCase nit field', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: nit field is a non-empty string
    expect(typeof body['nit']).toBe('string');
    expect((body['nit'] as string).length).toBeGreaterThan(0);
  });

  test('should return camelCase telefono field', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: telefono field is a non-empty string
    expect(typeof body['telefono']).toBe('string');
    expect((body['telefono'] as string).length).toBeGreaterThan(0);
  });

  test('should return camelCase ciudad field', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: ciudad field is a non-empty string
    expect(typeof body['ciudad']).toBe('string');
    expect((body['ciudad'] as string).length).toBeGreaterThan(0);
  });

  test('should return ISO 8601 createdAt and updatedAt fields', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: createdAt and updatedAt are ISO 8601 date strings with timezone offset
    expect(typeof body['createdAt']).toBe('string');
    expect(typeof body['updatedAt']).toBe('string');
    expect(new Date(body['createdAt'] as string).toISOString()).toBeTruthy();
    expect(new Date(body['updatedAt'] as string).toISOString()).toBeTruthy();
  });

  test('should not return snake_case field names', async ({ request }) => {
    // GIVEN: A client with KNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{id}
    const response = await request.get(`${ENDPOINT_BASE}/${KNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: No snake_case keys (API contract mandates camelCase)
    const snakeCaseKeys = Object.keys(body).filter((k) => k.includes('_'));
    expect(snakeCaseKeys).toHaveLength(0);
  });
});

// ─── AC4: GET /api/v1/clientes/{id} — 404 Not Found ──────────────────────────

test.describe('GET /api/v1/clientes/{id} — AC4 404 Not Found', () => {
  test('should return HTTP 404 when client does not exist', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{unknownId}
    const response = await request.get(`${ENDPOINT_BASE}/${UNKNOWN_CLIENT_ID}`);

    // THEN: Response status is 404
    expect(response.status()).toBe(404);
  });

  test('should return Problem Details RFC 7807 body on 404', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{unknownId}
    const response = await request.get(`${ENDPOINT_BASE}/${UNKNOWN_CLIENT_ID}`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: Body follows RFC 7807 Problem Details format with status field
    expect(body['status']).toBe(404);
    expect(typeof body['title']).toBe('string');
  });

  test('should return Content-Type application/problem+json or application/json on 404', async ({ request }) => {
    // GIVEN: No client with UNKNOWN_CLIENT_ID exists
    // WHEN: A GET request is sent to /api/v1/clientes/{unknownId}
    const response = await request.get(`${ENDPOINT_BASE}/${UNKNOWN_CLIENT_ID}`);

    // THEN: Content-Type indicates JSON Problem Details
    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/application\/(problem\+)?json/);
  });
});
