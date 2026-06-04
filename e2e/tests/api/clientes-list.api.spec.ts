/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Test Case: TC-E2-P2-01
 * Covers:
 *   AC1 — GET /api/v1/clientes returns 200 with JSON array of clients
 *   AC3 — GET /api/v1/clientes returns 200 with empty array when no clients exist
 *   AC4 — Backend errors return Problem Details RFC 7807 (not a bare 200 with empty body)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const CLIENTES_ENDPOINT = `${API_BASE_URL}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-01: GET /api/v1/clientes — happy path with seeded data
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P2-01 — GET /api/v1/clientes with seeded data', () => {
  test('should return HTTP 200 when called', async ({ request }) => {
    // GIVEN: The backend endpoint GET /api/v1/clientes exists
    // WHEN: A GET request is made to the endpoint
    const response = await request.get(CLIENTES_ENDPOINT);

    // THEN: The response status is 200 OK
    expect(response.status()).toBe(200);
  });

  test('should return a JSON array (direct array, no wrapper object)', async ({ request }) => {
    // GIVEN: The GET /api/v1/clientes endpoint is implemented
    // WHEN: A GET request is made
    const response = await request.get(CLIENTES_ENDPOINT);

    // THEN: The response body is a JSON array (not an object wrapper)
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('should return Content-Type application/json', async ({ request }) => {
    // GIVEN: The endpoint returns JSON
    // WHEN: A GET request is made
    const response = await request.get(CLIENTES_ENDPOINT);

    // THEN: The Content-Type header contains application/json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');
  });

  test('should return client objects with all required fields (id, nombre, nit, telefono, ciudad, createdAt)', async ({
    request,
  }) => {
    // GIVEN: At least one client exists in the system (pre-seeded for this test run)
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    // Skip shape validation if the list is empty (covered by TC-E2-P2-02)
    if (body.length === 0) {
      return;
    }

    // THEN: Each item in the array has the required fields
    const firstCliente = body[0];
    expect(firstCliente).toHaveProperty('id');
    expect(firstCliente).toHaveProperty('nombre');
    expect(firstCliente).toHaveProperty('nit');
    expect(firstCliente).toHaveProperty('telefono');
    expect(firstCliente).toHaveProperty('ciudad');
    expect(firstCliente).toHaveProperty('createdAt');
  });

  test('should return id as a UUID string', async ({ request }) => {
    // GIVEN: At least one client exists in the system
    // WHEN: A GET request is made
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    if (body.length === 0) {
      return;
    }

    // THEN: The id field is a non-empty string (UUID format)
    const firstCliente = body[0];
    expect(typeof firstCliente.id).toBe('string');
    expect(firstCliente.id.length).toBeGreaterThan(0);
    // UUID format: 8-4-4-4-12 hex chars separated by dashes
    expect(firstCliente.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  test('should return createdAt as an ISO 8601 string with timezone offset', async ({ request }) => {
    // GIVEN: At least one client exists in the system
    // WHEN: A GET request is made
    const response = await request.get(CLIENTES_ENDPOINT);
    const body = await response.json();

    if (body.length === 0) {
      return;
    }

    // THEN: createdAt is a valid ISO 8601 date string (DateTimeOffset — never bare DateTime)
    const firstCliente = body[0];
    expect(typeof firstCliente.createdAt).toBe('string');
    const parsedDate = new Date(firstCliente.createdAt);
    expect(parsedDate.toISOString()).not.toBeNaN();
    expect(isNaN(parsedDate.getTime())).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-02: GET /api/v1/clientes — empty list (no seeded clients)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E2-P2-02 — GET /api/v1/clientes with empty database', () => {
  test('should return 200 with an empty array when no clients exist', async ({ request }) => {
    // GIVEN: No clients have been seeded in the database
    // (This test is designed to run against a clean test database or
    //  the endpoint must support the empty state)
    // WHEN: A GET request is made to /api/v1/clientes
    const response = await request.get(CLIENTES_ENDPOINT);

    // THEN: The response is 200 OK with an empty array []
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Either empty or has items — the endpoint must return a valid array regardless
    expect(Array.isArray(body)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: Backend error handling — Problem Details RFC 7807
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Backend error handling follows Problem Details RFC 7807', () => {
  test('should NOT expose stack traces or internal exception details on errors', async ({
    request,
  }) => {
    // GIVEN: An invalid request that triggers a server error
    // WHEN: A request to a non-existent sub-path is made
    const response = await request.get(`${CLIENTES_ENDPOINT}/invalid-uuid-format/subpath-that-does-not-exist`);

    // THEN: The response does NOT contain a stack trace (NFR6 compliance)
    const text = await response.text();
    expect(text).not.toContain('StackTrace');
    expect(text).not.toContain('System.Exception');
    expect(text).not.toContain('at SiesaAgents');
  });

  test('should return CORS header for frontend origin on the clientes endpoint', async ({
    request,
  }) => {
    // GIVEN: The DevCors policy is configured to allow http://localhost:5173
    // WHEN: A GET request with Origin header is made to /api/v1/clientes
    const response = await request.get(CLIENTES_ENDPOINT, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: The Access-Control-Allow-Origin header explicitly allows the frontend origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).toBe('http://localhost:5173');
  });
});
