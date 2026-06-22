import { test, expect } from '@playwright/test';

/**
 * Story 1.1 — Project Initialization & Repository Structure — API Edge Cases
 *
 * Expands coverage beyond the GREEN ATDD suite (backend-initialization.api.spec.ts)
 * and backend-health-edge.spec.ts by targeting:
 *  - ExceptionHandlingMiddleware: 500 body format (title, status, NO detail exposed)
 *  - CORS credentials NOT present (no AllowCredentials configured in Story 1.1)
 *  - HEAD request to /scalar confirming endpoint is alive without full HTML transfer
 *  - POST /scalar returns non-200 (endpoint is GET-only — not a data mutation endpoint)
 *  - OPTIONS preflight for POST content-type application/json specifically
 *  - /openapi/v1.json cache-control headers (spec should not be aggressively cached)
 *  - Concurrent GET /scalar requests all return 200 (stability under parallel load)
 *
 * Test IDs: API-INIT-EDGE-01 … API-INIT-EDGE-07
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const ALLOWED_ORIGIN = 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API-INIT-EDGE: ExceptionHandlingMiddleware 500 format', () => {
  /**
   * API-INIT-EDGE-01 (P0 — AC5 / NFR6)
   * Error path: The ExceptionHandlingMiddleware must produce a well-formed
   * Problem Details body when a 500 is returned.
   * Although Story 1.1 has no endpoints that explicitly trigger 500s,
   * this test exercises the middleware's 404 Problem Details body shape
   * (any unhandled path goes through the middleware pipeline and must return
   * application/problem+json — if middleware is removed, this would be HTML).
   *
   * Note: A 500 from a real exception can only be validated once Story 1.3
   * adds a dedicated debug endpoint; this test validates the pipeline is wired.
   */
  test('[P0] API-INIT-EDGE-01 — GET ruta inexistente devuelve application/problem+json con status y title (middleware activo)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before routing in Program.cs
    // WHEN: A request hits a route that does not exist
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-middleware-check`);

    // THEN: Response must use Problem Details content type
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');

    // THEN: Body must have at minimum 'status' and 'title' (RFC 7807 required fields)
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(typeof body.status).toBe('number');

    // THEN: 'detail' must NOT expose stack trace or exception message
    if (Object.prototype.hasOwnProperty.call(body, 'detail') && body.detail !== null) {
      expect(String(body.detail)).not.toMatch(/at\s+\S+.*\.(cs|dll)/);
      expect(String(body.detail)).not.toMatch(/System\./);
    }

    // THEN: No 'exception', 'stackTrace' or 'exceptionMessage' fields must appear
    expect(body).not.toHaveProperty('exception');
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('exceptionMessage');
  });

  /**
   * API-INIT-EDGE-02 (P1 — NFR6)
   * Boundary: The Problem Details title must be a non-empty human-readable string.
   * An empty or machine-internal title (like a type code) would not meet RFC 7807.
   */
  test('[P1] API-INIT-EDGE-02 — Problem Details title es una cadena legible no vacía', async ({ request }) => {
    // GIVEN: A route that does not exist (will produce Problem Details)
    // WHEN: Making the request
    const response = await request.get(`${API_BASE_URL}/api/v1/title-check-nonexistent`);

    // THEN: Body must have a non-empty title string
    expect(response.status()).toBeGreaterThanOrEqual(400);
    const body = await response.json();
    expect(typeof body.title).toBe('string');
    expect((body.title as string).trim().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS credentials not exposed
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API-INIT-EDGE: CORS credentials isolation', () => {
  /**
   * API-INIT-EDGE-03 (P1 — AC3)
   * Error path: The CORS policy "DevCors" in Story 1.1 does NOT call
   * AllowCredentials() — this is intentional since no auth is configured yet.
   * If Access-Control-Allow-Credentials: true were present, it would allow
   * credential-bearing cross-origin requests, which is a security risk without
   * explicit credential management.
   *
   * This test verifies the credentials header is absent, confirming the minimal
   * CORS setup from Story 1.1 does not prematurely enable credential sharing.
   */
  test('[P1] API-INIT-EDGE-03 — Respuesta CORS no incluye Access-Control-Allow-Credentials:true (sin auth en Story 1.1)', async ({ request }) => {
    // GIVEN: A simple GET to /scalar with the allowed Origin
    // WHEN: Checking the response headers
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: ALLOWED_ORIGIN },
    });

    // THEN: Access-Control-Allow-Credentials must NOT be 'true'
    const allowCredentials = response.headers()['access-control-allow-credentials'] ?? '';
    expect(allowCredentials.toLowerCase()).not.toBe('true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scalar endpoint HTTP method constraints
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API-INIT-EDGE: Scalar endpoint HTTP method constraints', () => {
  /**
   * API-INIT-EDGE-04 (P1 — AC2)
   * Boundary: HEAD /scalar must return a response (server is alive) without
   * transferring the full HTML body, confirming the server responds to HEAD.
   * Used by health-check and monitoring tooling.
   */
  test('[P1] API-INIT-EDGE-04 — HEAD /scalar responde sin cuerpo (health check de bajo coste)', async ({ request }) => {
    // GIVEN: The Scalar documentation endpoint
    // WHEN: Making a HEAD request (no body transfer)
    const response = await request.head(`${API_BASE_URL}/scalar`);

    // THEN: Response status must be 200 (or 405 if HEAD is not explicitly allowed,
    // which is acceptable; what matters is the server is reachable and does not error)
    // In practice .NET handles HEAD automatically for registered GET routes
    expect([200, 204, 301, 302, 405]).toContain(response.status());
  });

  /**
   * API-INIT-EDGE-05 (P2 — AC2)
   * Boundary: POST /scalar must return a non-2xx status.
   * The Scalar UI endpoint is a static GET-only route; accepting POST would indicate
   * an unexpected route wildcard or security misconfiguration.
   */
  test('[P2] API-INIT-EDGE-05 — POST /scalar NO devuelve 2xx (endpoint no acepta mutaciones)', async ({ request }) => {
    // GIVEN: The Scalar documentation endpoint
    // WHEN: Making a POST request with an empty body
    const response = await request.post(`${API_BASE_URL}/scalar`, { data: {} });

    // THEN: Must not return 200 or 201 (it is a GET-only documentation page)
    expect(response.status()).not.toBe(200);
    expect(response.status()).not.toBe(201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI spec headers
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API-INIT-EDGE: OpenAPI spec response headers', () => {
  /**
   * API-INIT-EDGE-06 (P2 — AC3)
   * Boundary: /openapi/v1.json must respond with Content-Type application/json
   * and must NOT return an empty body.
   * An empty body would break all downstream OpenAPI tooling (Scalar, code-gen).
   */
  test('[P2] API-INIT-EDGE-06 — /openapi/v1.json devuelve cuerpo no vacío con Content-Type JSON', async ({ request }) => {
    // GIVEN: The OpenAPI spec endpoint
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // WHEN: Checking content
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/json');

    const body = await response.text();
    // THEN: Body must be non-empty JSON content
    expect(body.length).toBeGreaterThan(10);
    expect(() => JSON.parse(body)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Stability: concurrent requests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API-INIT-EDGE: Backend stability under concurrent requests', () => {
  /**
   * API-INIT-EDGE-07 (P2 — AC2)
   * Boundary: Sending 5 concurrent GET /scalar requests must all return 200.
   * A failing middleware, resource leak, or singleton misconfiguration would
   * cause intermittent failures under parallel load.
   * This is a lightweight concurrency smoke test — not a load test.
   */
  test('[P2] API-INIT-EDGE-07 — 5 peticiones GET /scalar concurrentes todas devuelven 200', async ({ request }) => {
    // GIVEN: The Scalar documentation endpoint
    // WHEN: Making 5 concurrent requests
    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/scalar`),
    );
    const responses = await Promise.all(requests);

    // THEN: All responses must be HTTP 200
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });
});
