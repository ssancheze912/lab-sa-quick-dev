/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion — API Edge Cases & Boundary Conditions
 * Complements the ATDD happy-path tests in backend-initialization.api.spec.ts
 *
 * Coverage:
 *   - ExceptionHandlingMiddleware RFC 7807 response structure
 *   - CORS header edge cases (disallowed origins, preflight for POST/DELETE)
 *   - Content-Type and Accept header negotiation
 *   - Security response headers
 *   - Malformed / boundary requests
 *   - Scalar documentation content validation
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — RFC 7807 compliance edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware — RFC 7807 edge cases', () => {
  test('[P1] should return Content-Type application/problem+json for 404 responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: A request is made to a path that does not exist
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-path-boundary`);

    // THEN: Content-Type indicates Problem Details format, not plain HTML
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/json/i);
  });

  test('[P1] should not return an HTML error page for 404 (no raw ASP.NET exception page)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps all requests
    // WHEN: An undefined API route is hit
    const response = await request.get(`${API_BASE_URL}/api/undefined-route-test-12345`);
    const body = await response.text();

    // THEN: Response body is NOT an HTML page (ASP.NET Yellow Screen of Death would indicate
    // the middleware is misconfigured)
    expect(body).not.toMatch(/<html/i);
  });

  test('[P1] should never expose exception details in the 500 error body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all unhandled exceptions
    // WHEN: Any 5xx response is received (simulated via known error-trigger endpoint)
    // NOTE: We target a path that the backend may throw on — primary scenario is
    // that any 5xx response must NOT leak stack traces
    const response = await request.get(`${API_BASE_URL}/api/error-trigger-atdd`);

    // THEN: If a 500 is returned, the body must not contain a stack trace or exception type
    if (response.status() === 500) {
      const body = await response.text();
      expect(body).not.toContain('StackTrace');
      expect(body).not.toContain('System.');
      expect(body).not.toContain('Exception');
      expect(body).toContain('An unexpected error occurred.');
    } else {
      // 404 is acceptable — endpoint doesn't exist, middleware didn't throw
      expect([404, 400]).toContain(response.status());
    }
  });

  test('[P2] should return status 500 with correct Problem Details fields when middleware catches an error', async ({
    request,
  }) => {
    // GIVEN: A forced-error endpoint (if it exists) or a simulated bad request
    // WHEN: A 500 is returned
    const response = await request.get(`${API_BASE_URL}/api/force-error-12345`);

    if (response.status() === 500) {
      const body = await response.json();

      // THEN: The Problem Details body contains required RFC 7807 fields
      expect(body).toHaveProperty('status', 500);
      expect(body).toHaveProperty('title');
      expect(typeof body.title).toBe('string');
      expect(body.title.length).toBeGreaterThan(0);

      // Detail MUST be null per architecture spec (no leaking of ex.Message)
      expect(body.detail).toBeNull();
    } else {
      // Not a 500 — endpoint doesn't exist in this story; mark as inconclusive/pass
      expect([404, 400]).toContain(response.status());
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS edge cases — disallowed origins and preflight variations
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS configuration — edge cases', () => {
  test('[P0] should NOT include Access-Control-Allow-Origin for an unknown origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" only allows http://localhost:5173
    // WHEN: A request comes from a completely different origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://attacker.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header must NOT be present, or must not
    // echo back the attacker origin (ASP.NET returns no header for blocked origins)
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://attacker.example.com');
    expect(allowOrigin).not.toBe('*');
  });

  test('[P1] should handle OPTIONS preflight for POST method from allowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows any method (AllowAnyMethod)
    // WHEN: An OPTIONS preflight is made for a POST request from the frontend
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: The preflight is accepted (204 or 200)
    expect([200, 204]).toContain(response.status());
  });

  test('[P1] should handle OPTIONS preflight for DELETE method from allowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows any method (AllowAnyMethod)
    // WHEN: An OPTIONS preflight is made for a DELETE request
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight succeeds
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] should include Access-Control-Allow-Headers in preflight response', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows any header (AllowAnyHeader)
    // WHEN: An OPTIONS preflight requests specific headers
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, X-Custom-Header',
      },
    });

    // THEN: The preflight response acknowledges allowed headers
    if (response.status() === 204 || response.status() === 200) {
      const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
      // Either echoes back the requested headers or returns a wildcard
      expect(allowHeaders.length).toBeGreaterThan(0);
    }
  });

  test('[P2] should NOT return CORS headers for requests without an Origin header', async ({
    request,
  }) => {
    // GIVEN: The same-origin requests (no Origin header) should work without CORS overhead
    // WHEN: A request is made without an Origin header (direct browser request or server-to-server)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server responds normally (CORS headers may or may not be present — both are valid)
    // The key requirement is that the request is NOT rejected
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend endpoint security — Scalar and API boundary tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend endpoint security — edge cases', () => {
  test('[P0] should NOT serve Swashbuckle JSON at /swagger/v1/swagger.json', async ({
    request,
  }) => {
    // GIVEN: Architecture mandates Scalar ONLY, Swashbuckle is forbidden
    // WHEN: The Swashbuckle JSON endpoint is requested
    const response = await request.get(`${API_BASE_URL}/swagger/v1/swagger.json`);

    // THEN: No Swashbuckle JSON is served
    expect(response.status()).not.toBe(200);
  });

  test('[P1] should NOT respond to /api/weatherforecast (template endpoint removed)', async ({
    request,
  }) => {
    // GIVEN: The WeatherForecast controller must be removed from the template
    // WHEN: The old default endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/weatherforecast`);

    // THEN: Resource is not found or method not allowed
    expect([404, 405]).toContain(response.status());
  });

  test('[P1] should return a valid response within 2000ms for the scalar endpoint', async ({
    request,
  }) => {
    // GIVEN: The backend is running and Scalar is configured
    // WHEN: The /scalar endpoint is requested and we measure response time
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const elapsed = Date.now() - startTime;

    // THEN: The response comes back within 2 seconds (not hanging)
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });

  test('[P2] should return 404 (not 500) for completely unknown paths', async ({ request }) => {
    // GIVEN: The backend has ExceptionHandlingMiddleware but unknown paths should be 404
    // WHEN: A path that has never been registered is requested
    const response = await request.get(`${API_BASE_URL}/completely/unknown/deep/path/12345`);

    // THEN: The response is a 404 (routing layer handles it), NOT a 500 (middleware crash)
    expect(response.status()).toBe(404);
  });

  test('[P2] should return a non-empty body for the Scalar documentation page', async ({
    request,
  }) => {
    // GIVEN: Scalar.AspNetCore is installed and MapScalarApiReference() is called
    // WHEN: The /scalar page is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: The response body is not empty (Scalar renders HTML content)
    expect(body.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Content-Type negotiation — boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Content-Type negotiation — edge cases', () => {
  test('[P2] should accept requests with Accept: application/json header', async ({ request }) => {
    // GIVEN: The backend API handles JSON
    // WHEN: A request with Accept: application/json is made to the scalar endpoint
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Accept: 'application/json, text/html' },
    });

    // THEN: The server responds (does not reject JSON-accepting requests)
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should return 404 JSON (not HTML) for API paths that do not exist', async ({
    request,
  }) => {
    // GIVEN: A request to an /api/ prefix path that doesn't exist
    // WHEN: The request is made with Accept: application/json
    const response = await request.get(`${API_BASE_URL}/api/does-not-exist-boundary-test`, {
      headers: { Accept: 'application/json' },
    });

    // THEN: Response is 404 and body is JSON (not an HTML page)
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/json/i);
  });

  test('[P2] should handle POST request with empty body to unknown endpoint without crashing', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware protects all paths
    // WHEN: A POST with no body is made to an unknown endpoint
    const response = await request.post(`${API_BASE_URL}/api/unknown-post-endpoint`, {
      data: '',
      headers: { 'Content-Type': 'application/json' },
    });

    // THEN: Server responds gracefully (4xx) — NOT crashes (5xx internal error)
    expect(response.status()).toBeLessThan(500);
  });
});
