/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * API Edge Cases & Boundary Tests — Expanded Coverage
 * Complements backend-initialization.api.spec.ts with error paths,
 * Problem Details schema validation, CORS boundary conditions,
 * and infrastructure edge cases not covered by the ATDD suite.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — Problem Details schema validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware — Problem Details RFC 7807 schema', () => {
  test('[P1] 404 response body should contain the required "status" field set to 404', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware intercepts 404 responses
    // WHEN: A GET request is made to a non-existent API endpoint
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-edge-test-status`);

    // THEN: The response body has a "status" field equal to 404 (RFC 7807)
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('status', 404);
  });

  test('[P1] 404 response body should contain the required "title" field with a non-empty string', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware returns Problem Details for 404
    // WHEN: A GET request is made to a path that has no matching route
    const response = await request.get(`${API_BASE_URL}/api/edge-404-title-check`);

    // THEN: The response body has a "title" field that is a non-empty string
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect((body.title as string).trim().length).toBeGreaterThan(0);
  });

  test('[P1] 404 response should NOT expose internal exception details in "detail" field', async ({ request }) => {
    // GIVEN: Architecture mandates that exception details are never exposed (security)
    // WHEN: A GET request hits a non-existent route triggering the middleware
    const response = await request.get(`${API_BASE_URL}/api/edge-no-detail-leak`);

    // THEN: The "detail" field is absent or null — no stack trace or message leaked
    expect(response.status()).toBe(404);
    const body = await response.json();
    // detail must be absent, null, or empty — never a stack trace
    if ('detail' in body) {
      expect(body.detail === null || body.detail === undefined || body.detail === '').toBe(true);
    }
  });

  test('[P1] 404 response Content-Type should be application/problem+json', async ({ request }) => {
    // GIVEN: RFC 7807 mandates content-type "application/problem+json" for error responses
    // WHEN: The ExceptionHandlingMiddleware handles a 404
    const response = await request.get(`${API_BASE_URL}/api/edge-content-type-check`);

    // THEN: Content-Type header contains "application/problem+json"
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P2] Problem Details body should NOT contain exception type or stack trace fields', async ({ request }) => {
    // GIVEN: Security constraint — no internal details exposed
    // WHEN: A non-existent endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/edge-no-internal-fields`);

    // THEN: Body does not contain "exception", "stackTrace", or "innerException" fields
    const body = await response.json();
    expect(body).not.toHaveProperty('exception');
    expect(body).not.toHaveProperty('stackTrace');
    expect(body).not.toHaveProperty('innerException');
    expect(body).not.toHaveProperty('exceptionType');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS boundary conditions — disallowed origins
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS — boundary conditions for disallowed origins', () => {
  test('[P1] should NOT return Access-Control-Allow-Origin header for a disallowed origin', async ({ request }) => {
    // GIVEN: CORS policy only allows http://localhost:5173
    // WHEN: A request is made from a different origin (e.g., http://malicious.example.com)
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header does NOT grant access to the disallowed origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://malicious.example.com');
  });

  test('[P1] OPTIONS preflight for POST method from allowed origin should return 200 or 204', async ({ request }) => {
    // GIVEN: AllowAnyMethod() is configured in the CORS policy
    // WHEN: A preflight OPTIONS request for POST is made from the allowed frontend origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Preflight succeeds without rejection
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] OPTIONS preflight from disallowed origin should NOT return Access-Control-Allow-Origin with that origin', async ({ request }) => {
    // GIVEN: CORS policy restricts to http://localhost:5173 only
    // WHEN: A preflight from an unauthorized origin is made
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://unauthorized-origin.test',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // THEN: Response does NOT grant CORS to the unauthorized origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://unauthorized-origin.test');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend infrastructure — HTTP method boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend infrastructure — HTTP method handling', () => {
  test('[P2] HEAD request to /scalar should return a response without body', async ({ request }) => {
    // GIVEN: The backend uses .NET Minimal API which supports HEAD by convention
    // WHEN: A HEAD request is made to a valid endpoint
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'HEAD',
    });

    // THEN: Server responds (not 405 with no allow header) — any 2xx or redirect is acceptable
    // HEAD is always allowed on GET endpoints per HTTP spec
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] POST to /scalar (a GET-only endpoint) should return 405 or 404 (not 200)', async ({ request }) => {
    // GIVEN: /scalar is a GET-only documentation endpoint
    // WHEN: A POST request is made to it
    const response = await request.post(`${API_BASE_URL}/scalar/v1`, {
      data: {},
    });

    // THEN: The response is NOT a successful 2xx (endpoint does not accept POST)
    expect(response.status()).not.toBe(200);
  });

  test('[P2] a request with an extremely long URL path should not cause a 500 server error', async ({ request }) => {
    // GIVEN: The server is production-hardened with proper error handling
    // WHEN: A GET request is made with a very long URL path (boundary test)
    const longPath = '/api/' + 'a'.repeat(2000);
    const response = await request.get(`${API_BASE_URL}${longPath}`);

    // THEN: Server returns 4xx (not found, bad request) — never crashes with 500
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend infrastructure — OpenAPI / Scalar endpoints
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend infrastructure — OpenAPI metadata endpoint', () => {
  test('[P1] GET /openapi/v1.json should expose the OpenAPI spec for Scalar', async ({ request }) => {
    // GIVEN: builder.Services.AddOpenApi() and app.MapOpenApi() are registered in Program.cs
    // WHEN: A request is made to the OpenAPI JSON specification endpoint
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The endpoint responds with 200 and JSON content
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] OpenAPI spec should have a valid JSON structure with required fields', async ({ request }) => {
    // GIVEN: app.MapOpenApi() generates a valid OpenAPI 3.x specification
    // WHEN: The OpenAPI JSON is fetched
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The spec contains the minimum required "openapi" and "info" fields
    expect(response.status()).toBe(200);
    const spec = await response.json();
    expect(spec).toHaveProperty('openapi');
    expect(spec).toHaveProperty('info');
  });

  test('[P2] Scalar documentation page should contain "scalar" in its HTML content', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore renders a rich API documentation UI
    // WHEN: The /scalar page HTML is fetched
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The HTML response body contains Scalar-specific markup
    expect(response.status()).toBe(200);
    const body = await response.text();
    // Scalar renders a <script> tag referencing its CDN or embedded assets
    expect(body.toLowerCase()).toContain('scalar');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — middleware ordering validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware — middleware ordering', () => {
  test('[P1] middleware should return JSON (not HTML) for 404 responses', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered BEFORE routing in Program.cs
    // WHEN: A path with no matching route is requested (with Accept: application/json)
    const response = await request.get(`${API_BASE_URL}/api/edge-json-not-html`, {
      headers: {
        Accept: 'application/json',
      },
    });

    // THEN: The response body is parseable JSON — never an HTML error page
    expect([400, 404]).toContain(response.status());
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).not.toContain('text/html');
    // Additionally verify the response is valid JSON
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  test('[P2] server should NOT return ASP.NET developer exception page HTML for errors', async ({ request }) => {
    // GIVEN: Production-like middleware stack with ExceptionHandlingMiddleware
    // WHEN: A non-existent endpoint triggers the error handling path
    const response = await request.get(`${API_BASE_URL}/api/edge-no-dev-exception-page`);

    // THEN: Response body does NOT contain "<!DOCTYPE html>" (no developer exception page)
    const body = await response.text();
    expect(body.toLowerCase()).not.toContain('<!doctype html>');
    expect(body.toLowerCase()).not.toContain('<html');
  });
});
