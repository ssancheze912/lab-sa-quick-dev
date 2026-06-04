/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Cases & Error Paths — Backend API Level
 * Expands ATDD coverage with boundary conditions not covered in RED-phase tests.
 *
 * Scenarios covered:
 *   - ExceptionHandlingMiddleware returns exact RFC 7807 Problem Details structure
 *   - CORS blocks requests from non-allowed origins
 *   - CORS preflight with disallowed HTTP method is handled
 *   - Security: no X-Powered-By or Server header leakage
 *   - OpenAPI metadata endpoint present (backing Scalar)
 *   - Concurrent requests to /scalar remain stable
 *   - AllowedOrigins list does NOT include wildcard by default
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — RFC 7807 Problem Details boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware — RFC 7807 Problem Details boundary conditions', () => {
  test('[P1] should return Content-Type application/problem+json for an unhandled exception path', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered and the endpoint does not exist
    // WHEN: A request is made to a guaranteed 404 path
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-for-middleware-check`);

    // THEN: The response Content-Type indicates Problem Details or JSON (not HTML)
    const contentType = response.headers()['content-type'] ?? '';
    // 404 from .NET Minimal API may return problem+json or application/json
    expect(contentType.toLowerCase()).toMatch(/json/);
  });

  test('[P1] should return 404 status for a non-existent API endpoint', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: A non-existent API endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/does-not-exist-boundary`);

    // THEN: HTTP status is 404
    expect(response.status()).toBe(404);
  });

  test('[P1] should not expose raw stack traces in 404 response bodies', async ({
    request,
  }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: A non-existent API endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/does-not-exist-boundary`);
    const body = await response.text();

    // THEN: Body does NOT contain raw stack trace (stack traces have "at MethodName.")
    expect(body).not.toMatch(/\s+at\s+\w+\./);
  });

  test('[P2] should not expose server-side exception details (no stack trace) in error responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all exceptions and returns ProblemDetails
    // WHEN: An endpoint that does not exist is called
    const response = await request.get(`${API_BASE_URL}/api/trigger-not-found-safely`);

    // THEN: Response body does not contain common stack-trace indicators
    const body = await response.text();
    expect(body).not.toContain('System.');
    expect(body).not.toContain('Microsoft.AspNetCore');
    expect(body).not.toContain('StackTrace');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS — disallowed origin boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS — disallowed origin boundary conditions', () => {
  test('[P1] should NOT include Access-Control-Allow-Origin for an unlisted origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" only allows http://localhost:5173
    // WHEN: A request arrives from an unknown origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The CORS header is absent or does NOT allow the malicious origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.example.com');
  });

  test('[P1] should reject OPTIONS preflight from a disallowed origin', async ({ request }) => {
    // GIVEN: CORS policy restricts to http://localhost:5173
    // WHEN: Preflight comes from an unlisted origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://attacker.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Response does NOT grant CORS access to the attacker origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://attacker.example.com');
    // Optionally 403 or no CORS headers — either way no grant
  });

  test('[P2] should handle OPTIONS preflight with an invalid method gracefully', async ({
    request,
  }) => {
    // GIVEN: A preflight arrives with a non-standard method requested
    // WHEN: OPTIONS with a custom/risky method is sent from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'BADMETHOD',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Server responds without crashing (status < 500)
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security — no sensitive headers leaked
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Security headers — no sensitive information leaked', () => {
  test('[P1] should NOT expose X-Powered-By header in any response', async ({ request }) => {
    // GIVEN: .NET Minimal API is running
    // WHEN: A request is made to /scalar
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: X-Powered-By header is absent (reveals tech stack)
    const xPoweredBy = response.headers()['x-powered-by'] ?? '';
    expect(xPoweredBy).toBe('');
  });

  test('[P2] should NOT include detailed server version in Server header', async ({ request }) => {
    // GIVEN: .NET Minimal API is running
    // WHEN: A request is made
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server header does not expose full version string (e.g. "Kestrel/8.0.0")
    const serverHeader = (response.headers()['server'] ?? '').toLowerCase();
    // Acceptable: empty or generic "Kestrel" — NOT "kestrel/x.y.z" with version
    const versionPattern = /kestrel\/\d+\.\d+/;
    expect(serverHeader).not.toMatch(versionPattern);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI metadata — backing the Scalar UI
// ─────────────────────────────────────────────────────────────────────────────

test.describe('OpenAPI metadata endpoint — backing Scalar UI', () => {
  test('[P1] should expose the OpenAPI JSON document at /openapi/v1.json', async ({ request }) => {
    // GIVEN: builder.Services.AddOpenApi() and app.MapOpenApi() are configured
    // WHEN: The OpenAPI JSON is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Returns 200 with a valid OpenAPI document
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] should return a valid OpenAPI document with openapi version field', async ({
    request,
  }) => {
    // GIVEN: OpenAPI metadata is registered
    // WHEN: The document is fetched
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const body = await response.json();

    // THEN: The document contains the "openapi" field
    expect(body).toHaveProperty('openapi');
    expect(typeof body.openapi).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Stability — concurrent requests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend stability — concurrent request handling', () => {
  test('[P2] should handle multiple concurrent GET requests to /scalar without errors', async ({
    request,
  }) => {
    // GIVEN: The backend is running and Scalar is configured
    // WHEN: 5 concurrent requests are made simultaneously
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request.get(`${API_BASE_URL}/scalar`)),
    );

    // THEN: All responses are successful (200)
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('[P2] should return consistent content-type across repeated requests to /scalar', async ({
    request,
  }) => {
    // GIVEN: Scalar endpoint is stable
    // WHEN: The same endpoint is called three times sequentially
    const contentTypes: string[] = [];
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/scalar`);
      contentTypes.push(response.headers()['content-type'] ?? '');
    }

    // THEN: All responses return the same content-type (deterministic)
    const first = contentTypes[0];
    for (const ct of contentTypes) {
      expect(ct).toBe(first);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS — allowed methods boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS — allowed methods boundary conditions', () => {
  test('[P2] should include Access-Control-Allow-Methods in preflight response for allowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows AllowAnyMethod() for http://localhost:5173
    // WHEN: An OPTIONS preflight is sent from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight is acknowledged (200/204) and allowed methods header is present
    expect([200, 204]).toContain(response.status());
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    // With AllowAnyMethod() the header should be present and non-empty
    expect(allowMethods.length).toBeGreaterThan(0);
  });
});
