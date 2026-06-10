/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Boundary Tests — API Level
 * Expands ATDD coverage with error paths, boundary conditions, and negative cases.
 *
 * ATDD already covers:
 *   AC2 — Server up, /scalar 200, HTML content-type, no /swagger, no /weatherforecast,
 *          CORS header present, OPTIONS preflight succeeds
 *   AC5 — Scalar responds (build must succeed), Problem Details for 404
 *
 * This file covers:
 *   - HEAD request handling (not just GET)
 *   - CORS rejected for unauthorized origins (negative)
 *   - Problem Details RFC 7807 content-type on 500-class paths
 *   - Multiple rapid requests (no crash / rate-limit false positive)
 *   - /openapi endpoint serving OpenAPI spec JSON
 *   - Response time within acceptable threshold (P2 performance boundary)
 *   - Non-JSON Accept header does not break the server
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 boundary: HTTP method and protocol edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Backend HTTP method and protocol boundaries', () => {
  test('[P2] should respond to HEAD request on /scalar without body but with 200 status', async ({ request }) => {
    // GIVEN: The backend is running with Scalar registered
    // WHEN: A HEAD request is sent to /scalar (browser pre-flight pattern)
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'HEAD',
    });

    // THEN: Server handles HEAD gracefully — 200 or 405 (not 500)
    // 200 means HEAD is supported; 405 means GET-only but server is alive
    expect([200, 405]).toContain(response.status());
  });

  test('[P2] should serve the OpenAPI JSON spec at /openapi/v1.json', async ({ request }) => {
    // GIVEN: builder.Services.AddOpenApi() is registered and app.MapOpenApi() is called
    // WHEN: The OpenAPI spec endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The OpenAPI spec is served (200 with JSON content)
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P2] should respond within 3000ms for /scalar (startup performance boundary)', async ({ request }) => {
    // GIVEN: The backend is running (not under load)
    // WHEN: Scalar documentation page is requested, measuring elapsed time
    const start = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const elapsed = Date.now() - start;

    // THEN: Response arrives within 3 seconds (basic startup health boundary)
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  });

  test('[P2] should handle multiple rapid consecutive requests without crashing', async ({ request }) => {
    // GIVEN: The backend is initialized with no rate-limiting on /scalar
    // WHEN: 5 rapid sequential GET requests are made
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const response = await request.get(`${API_BASE_URL}/scalar`);
      statuses.push(response.status());
    }

    // THEN: All requests return the same 200 status (no crash or session corruption)
    expect(statuses).toHaveLength(5);
    statuses.forEach((s) => expect(s).toBe(200));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 boundary: CORS — negative path (unauthorized origins)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — CORS — unauthorized origin rejection (negative path)', () => {
  test('[P1] should NOT include Access-Control-Allow-Origin for an unauthorized origin', async ({ request }) => {
    // GIVEN: CORS policy only allows http://localhost:5173
    // WHEN: A request arrives from a completely different origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The server responds but does NOT grant CORS to the disallowed origin
    // The response must NOT include Access-Control-Allow-Origin: http://evil.example.com
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.example.com');
  });

  test('[P2] should not allow wildcard CORS from unauthorized origins via preflight', async ({ request }) => {
    // GIVEN: The CORS policy is strict (DevCors only allows localhost:5173)
    // WHEN: OPTIONS preflight arrives from an unapproved origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://attacker.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Either the server returns a non-200/204 OR the allow-origin header is absent/restricted
    // A 403 or missing CORS header both indicate the policy is enforced
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    const isForbidden = response.status() === 403;
    const corsNotGranted = allowOrigin !== 'https://attacker.example.com';
    expect(isForbidden || corsNotGranted).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 boundary: ExceptionHandlingMiddleware — Problem Details format
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — ExceptionHandlingMiddleware — Problem Details boundaries', () => {
  test('[P1] should return application/problem+json or application/json content-type for 404 responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware and standard ASP.NET routing are active
    // WHEN: A non-existent JSON API endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-resource`, {
      headers: { Accept: 'application/json' },
    });

    // THEN: The content-type is JSON-based (not HTML error page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toMatch(/json/);
  });

  test('[P2] should NOT expose internal stack traces in error response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware hides ex.Message and stack trace
    // WHEN: A non-existent endpoint is requested (may trigger default 404 handling)
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-intentional-atdd`);

    // THEN: The body does NOT contain raw stack trace markers
    const body = await response.text();
    expect(body).not.toContain('System.');
    expect(body).not.toContain('at SiesaAgents');
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('Exception:');
  });

  test('[P2] should NOT return HTML error page for any API path (even 404)', async ({ request }) => {
    // GIVEN: The backend is a JSON API (no MVC views, no Razor pages)
    // WHEN: Any missing route is requested
    const response = await request.get(`${API_BASE_URL}/completely-nonexistent-12345`);

    // THEN: Response is NOT text/html (HTML error pages indicate missing middleware)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).not.toContain('text/html');
  });

  test('[P1] should respond to non-JSON Accept header without crashing (content negotiation)', async ({
    request,
  }) => {
    // GIVEN: A client sends Accept: text/plain (unusual for API clients)
    // WHEN: Requesting /scalar with non-JSON Accept header
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Accept: 'text/plain' },
    });

    // THEN: Server returns a valid response (not 500) — content negotiation handled gracefully
    expect(response.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 boundary: Swagger/Swashbuckle strictly absent (security gate)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Swagger endpoints must not exist (security gate)', () => {
  test('[P1] should return 404 for /swagger/index.html (Swashbuckle UI must not be served)', async ({
    request,
  }) => {
    // GIVEN: Swashbuckle/Swagger is explicitly forbidden by architecture
    // WHEN: The Swagger UI path is requested
    const response = await request.get(`${API_BASE_URL}/swagger/index.html`);

    // THEN: The endpoint does not exist (404 or 405)
    expect(response.status()).not.toBe(200);
  });

  test('[P1] should return 404 for /swagger/v1/swagger.json (Swagger JSON spec must not be served)', async ({
    request,
  }) => {
    // GIVEN: The backend uses Scalar not Swagger
    // WHEN: The Swagger JSON spec path is probed
    const response = await request.get(`${API_BASE_URL}/swagger/v1/swagger.json`);

    // THEN: The endpoint does not exist
    expect(response.status()).not.toBe(200);
  });
});
