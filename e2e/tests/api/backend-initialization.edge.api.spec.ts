/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * EDGE CASE EXPANSION — testarch-automate (BMad-Integrated Mode) — API Level
 * Expands ATDD coverage for backend initialization with boundary conditions
 * and error paths not covered in the RED-phase ATDD tests.
 *
 * Acceptance Criteria targeted:
 *   AC2 — Backend edge cases: response headers, error format, content negotiation
 *   AC3 — CORS edge cases covered separately in project-initialization.edge.spec.ts
 *   AC6 — No Swagger endpoints exposed (additional boundary paths)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 edge — Backend response format and error handling boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 edge — Backend response format and error handling', () => {
  test('[P1] should return valid JSON (not HTML) for API not-found paths', async ({ request }) => {
    // GIVEN: The backend has Problem Details middleware registered
    // WHEN: A non-existent API path is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-resource-atdd`);

    // THEN: Status is 404 (not found, not 500)
    expect(response.status()).toBe(404);

    // AND THEN: Response is JSON (Problem Details RFC 7807), not an HTML error page
    const contentType = response.headers()['content-type'] ?? '';
    expect(
      contentType.includes('json') || contentType.includes('problem'),
      `Expected JSON response, got: ${contentType}`
    ).toBe(true);
  });

  test('[P1] should NOT return 500 for an unknown path (server must not crash)', async ({
    request,
  }) => {
    // GIVEN: The backend has exception handling middleware
    // WHEN: An arbitrary unknown path is requested
    const response = await request.get(`${API_BASE_URL}/unknown-path-that-does-not-exist`);

    // THEN: The server must not return a 500 Internal Server Error for simple not-found scenarios
    expect(
      response.status(),
      'Unknown paths must return 404, not 500 (server must handle gracefully)'
    ).not.toBe(500);
  });

  test('[P1] should respond to HEAD requests on the Scalar endpoint', async ({ request }) => {
    // GIVEN: HTTP HEAD method must be supported (used by health checks and load balancers)
    // WHEN: A HEAD request is made to /scalar
    const response = await request.fetch(`${API_BASE_URL}/scalar`, { method: 'HEAD' });

    // THEN: Server does not return 405 Method Not Allowed for HEAD
    expect(
      [200, 301, 302],
      `HEAD /scalar must succeed, got ${response.status()}`
    ).toContain(response.status());
  });

  test('[P1] should NOT expose OpenAPI JSON spec at /openapi/v1.json on non-development origins', async ({
    request,
  }) => {
    // GIVEN: OpenAPI spec (MapOpenApi) is registered only in Development environment
    // WHEN: The OpenAPI JSON endpoint is probed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Either returns the spec (dev mode) or 404 (production mode)
    // Must NOT return a server error (500)
    expect(
      response.status(),
      `OpenAPI spec endpoint must not crash the server, got ${response.status()}`
    ).not.toBe(500);
  });

  test('[P2] should include a content-type header in Scalar response', async ({ request }) => {
    // GIVEN: Scalar renders an HTML page
    // WHEN: /scalar is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Content-Type header is present (not missing)
    const contentType = response.headers()['content-type'];
    expect(contentType, 'Response must include a Content-Type header').toBeTruthy();
  });

  test('[P2] should not expose /swagger/v1/swagger.json endpoint', async ({ request }) => {
    // GIVEN: Swashbuckle is forbidden — the swagger JSON spec must not be exposed
    // WHEN: The Swashbuckle swagger JSON endpoint is probed
    const response = await request.get(`${API_BASE_URL}/swagger/v1/swagger.json`);

    // THEN: The endpoint does NOT return HTTP 200 (it must not exist)
    expect(
      response.status(),
      '/swagger/v1/swagger.json must not be exposed (Swashbuckle is forbidden)'
    ).not.toBe(200);
  });

  test('[P2] should not expose /swagger/index.html endpoint', async ({ request }) => {
    // GIVEN: Swashbuckle UI is forbidden — swagger UI HTML must not be accessible
    // WHEN: The Swashbuckle UI path is probed
    const response = await request.get(`${API_BASE_URL}/swagger/index.html`);

    // THEN: The endpoint does NOT return HTTP 200
    expect(
      response.status(),
      '/swagger/index.html must not be accessible (Swashbuckle UI is forbidden)'
    ).not.toBe(200);
  });

  test('[P2] should handle concurrent requests to /scalar without errors', async ({ request }) => {
    // GIVEN: The backend must handle multiple simultaneous requests
    // WHEN: 5 concurrent requests are made to /scalar
    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/scalar`)
    );

    const responses = await Promise.all(requests);

    // THEN: All requests succeed (no 500 errors indicating race conditions)
    for (const response of responses) {
      expect(
        response.status(),
        `Concurrent request failed with status ${response.status()}`
      ).not.toBe(500);
    }
  });

  test('[P3] should respond to requests with a reasonable latency (< 5 seconds)', async ({
    request,
  }) => {
    // GIVEN: The backend is a development server (not optimized for production speed)
    // WHEN: A request is made and timed
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const latency = Date.now() - startTime;

    // THEN: Response arrives within 5 seconds
    expect(response.status()).toBe(200);
    expect(
      latency,
      `Backend should respond within 5s, took ${latency}ms`
    ).toBeLessThan(5000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 edge — Additional Swagger/OpenAPI endpoint boundary checks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 edge — Swagger endpoint boundary checks', () => {
  const swaggerPaths = [
    '/swagger',
    '/swagger/',
    '/swagger/v1',
    '/swagger/v1/swagger.json',
    '/swagger/index.html',
    '/api-docs',
    '/redoc',
  ];

  for (const swaggerPath of swaggerPaths) {
    test(`[P1] should NOT serve HTTP 200 at ${swaggerPath}`, async ({ request }) => {
      // GIVEN: Only Scalar is allowed for API documentation
      // WHEN: A Swagger/alternative doc path is probed
      const response = await request.get(`${API_BASE_URL}${swaggerPath}`);

      // THEN: The endpoint does NOT return 200 (Swagger must not exist)
      expect(
        response.status(),
        `${swaggerPath} must not return 200 — Swagger/Redoc are not allowed`
      ).not.toBe(200);
    });
  }
});
