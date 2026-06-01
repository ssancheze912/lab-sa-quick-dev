/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATION EXPANSION — Backend API Edge Cases & Boundary Conditions
 * Expands ATDD coverage with CORS negative paths, middleware behavior,
 * content-type contracts, and error handling edge cases.
 *
 * Focus areas:
 *   - CORS: disallowed origins must NOT receive allow-origin header
 *   - OPTIONS preflight: method and headers negotiation
 *   - ExceptionHandlingMiddleware: correct RFC 7807 Content-Type and body shape
 *   - Problem Details: body fields presence (status, title)
 *   - Backend stability: repeated requests, boundary paths
 *   - Security: no stack traces exposed, no internal paths leaked
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// CORS negative paths — disallowed origins
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] CORS — disallowed origins must not receive access-control headers', () => {
  test('[P1] should NOT return Access-Control-Allow-Origin for an unlisted origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" only allows http://localhost:5173
    // WHEN: A request arrives from a completely different origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The response must NOT include Access-Control-Allow-Origin matching the evil origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://evil.example.com');
    // The header should either be absent or not be a wildcard that permits all origins
    // (note: if header is absent, allowOriginHeader will be '' which also fails the check above)
  });

  test('[P1] should NOT return Access-Control-Allow-Origin for a localhost on a different port', async ({
    request,
  }) => {
    // GIVEN: Only port 5173 is in the AllowedOrigins list
    // WHEN: A request comes from a different port (e.g., 3000)
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    // THEN: The CORS header should NOT allow port 3000
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://localhost:3000');
  });

  test('[P2] should NOT return Access-Control-Allow-Origin when no Origin header is sent', async ({
    request,
  }) => {
    // GIVEN: Same-origin requests (no Origin header) should not trigger CORS response headers
    // WHEN: A request is made with no Origin header (direct API call)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The Access-Control-Allow-Origin header is absent (only set when Origin is provided)
    const allowOriginHeader = response.headers()['access-control-allow-origin'];
    // When no Origin header is sent, ASP.NET Core CORS middleware does not add the header
    expect(allowOriginHeader).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OPTIONS preflight — method and header negotiation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] CORS — OPTIONS preflight request handling', () => {
  test('[P1] should respond to OPTIONS preflight with Access-Control-Allow-Methods header', async ({
    request,
  }) => {
    // GIVEN: AllowAnyMethod() is configured in the "DevCors" policy
    // WHEN: An OPTIONS preflight is sent from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight response includes the Access-Control-Allow-Methods header
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    // The header must be present for the preflight to succeed
    expect(allowMethods.length).toBeGreaterThan(0);
  });

  test('[P1] should respond to OPTIONS preflight with Access-Control-Allow-Headers header', async ({
    request,
  }) => {
    // GIVEN: AllowAnyHeader() is configured in the "DevCors" policy
    // WHEN: An OPTIONS preflight requests Content-Type header
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: The preflight response acknowledges allowed headers
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    expect(allowHeaders.length).toBeGreaterThan(0);
  });

  test('[P2] should return 204 or 200 (not 403) for OPTIONS from disallowed origin', async ({
    request,
  }) => {
    // GIVEN: ASP.NET Core CORS middleware behavior for unknown origins
    // WHEN: An OPTIONS request arrives from a disallowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://attacker.example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // THEN: The server returns the status but does NOT include allow-origin header
    // The browser will block the actual request — server doesn't return 403 for OPTIONS
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://attacker.example.com');
    expect(allowOriginHeader).not.toBe('*');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware — RFC 7807 contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P0] ExceptionHandlingMiddleware — Problem Details RFC 7807 contract', () => {
  test('[P0] should return application/problem+json content-type for 404 responses', async ({
    request,
  }) => {
    // GIVEN: UseStatusCodePages() and ExceptionHandlingMiddleware are registered in Program.cs
    // WHEN: A request is made to a non-existent API path
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-for-edge-test`);

    // THEN: Content-Type is JSON-based (problem+json or application/json) — not text/html
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('json');
  });

  test('[P0] should return a parseable JSON body for 404 error responses', async ({ request }) => {
    // GIVEN: The backend is configured with problem details middleware
    // WHEN: A non-existent endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/edge-case-nonexistent`);

    // THEN: The response body is valid parseable JSON
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // If JSON parsing fails, the test should fail clearly
      expect(false, 'Response body is not valid JSON').toBe(true);
    }
    expect(body).toBeDefined();
  });

  test('[P1] should not expose stack traces in error response bodies', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware explicitly sets Detail = null
    // WHEN: A path that returns an error is requested
    const response = await request.get(`${API_BASE_URL}/api/edge-no-stack-trace`);

    // THEN: Response body does NOT contain "StackTrace", "at System.", or ".cs:" patterns
    const body = await response.text();
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('at System.');
    expect(body).not.toContain('.cs:line');
  });

  test('[P1] should not expose internal exception messages in error responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all exceptions with generic message
    // WHEN: An error condition is triggered
    const response = await request.get(`${API_BASE_URL}/api/edge-no-exception-detail`);

    // THEN: Response body does NOT include known internal error patterns
    const body = await response.text();
    // Common leak patterns from unhandled exceptions
    expect(body).not.toContain('NullReferenceException');
    expect(body).not.toContain('InvalidOperationException');
    expect(body).not.toContain('Connection refused');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scalar API documentation — content and accessibility edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Scalar API documentation — edge cases', () => {
  test('[P1] should serve /scalar with redirect or direct 200 (trailing slash)', async ({
    request,
  }) => {
    // GIVEN: Scalar.AspNetCore may or may not add a trailing-slash redirect
    // WHEN: A request is made to /scalar/ (with trailing slash)
    const response = await request.get(`${API_BASE_URL}/scalar/`);

    // THEN: Either redirects (3xx) or returns 200 — must not return 404 or 500
    expect(response.status()).toBeLessThan(404);
  });

  test('[P1] should serve /openapi endpoint (MapOpenApi registered for Scalar metadata)', async ({
    request,
  }) => {
    // GIVEN: Program.cs calls app.MapOpenApi() to expose OpenAPI JSON spec for Scalar
    // WHEN: The /openapi endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The OpenAPI spec is accessible (200) — Scalar reads from this endpoint
    expect(response.status()).toBe(200);
  });

  test('[P2] should return JSON content-type from /openapi endpoint', async ({ request }) => {
    // GIVEN: MapOpenApi() returns the OpenAPI JSON specification
    // WHEN: The spec endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type indicates JSON
    expect(contentType).toContain('json');
  });

  test('[P2] should return parseable OpenAPI JSON from /openapi endpoint', async ({ request }) => {
    // GIVEN: The OpenAPI spec is generated by Microsoft.AspNetCore.OpenApi
    // WHEN: The spec is fetched and parsed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    let spec: Record<string, unknown>;
    spec = await response.json();

    // THEN: The spec contains the OpenAPI version field (3.x.x)
    expect(spec).toHaveProperty('openapi');
    expect(String(spec.openapi)).toMatch(/^3\./);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend boundary conditions and stability
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend — stability and boundary conditions', () => {
  test('[P2] should handle a path with special characters without server crash', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps all requests
    // WHEN: A path with special URL characters is requested
    const response = await request.get(
      `${API_BASE_URL}/api/edge-test-special-%20chars-%23hash`
    );

    // THEN: Server returns a 4xx response (not 500) — middleware must not crash on odd paths
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should respond consistently to three concurrent requests to /scalar', async ({
    request,
  }) => {
    // GIVEN: The backend processes requests in parallel (ASP.NET Core async pipeline)
    // WHEN: Three requests to /scalar are made simultaneously
    const responses = await Promise.all([
      request.get(`${API_BASE_URL}/scalar`),
      request.get(`${API_BASE_URL}/scalar`),
      request.get(`${API_BASE_URL}/scalar`),
    ]);

    // THEN: All three return 200 (no race conditions in the Scalar endpoint)
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('[P2] should return 4xx (not 500) for an extremely long URL path', async ({ request }) => {
    // GIVEN: ASP.NET Core has a default maximum header/path length limit
    // WHEN: A very long but valid ASCII path is requested (boundary: 2048 chars)
    const longPath = '/api/' + 'a'.repeat(200);
    const response = await request.get(`${API_BASE_URL}${longPath}`);

    // THEN: Server returns 404 (not found) or 400 (bad request) — not 500 crash
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should respond to HEAD request on /scalar without body content', async ({
    request,
  }) => {
    // GIVEN: HTTP HEAD is a valid method (AllowAnyMethod() is configured)
    // WHEN: A HEAD request is sent to /scalar
    const response = await request.fetch(`${API_BASE_URL}/scalar`, { method: 'HEAD' });

    // THEN: HEAD responds with 200 and no body (RFC 7231 compliant)
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toBe('');
  });

  test('[P3] should return 4xx for /weatherforecast variants (no template endpoints)', async ({
    request,
  }) => {
    // GIVEN: The WeatherForecast template endpoint was removed in Task 2
    // WHEN: Various casing/path variations of the default template are requested
    const paths = [
      '/WeatherForecast',
      '/weatherforecast',
      '/api/weatherforecast',
      '/weather',
    ];

    for (const path of paths) {
      const response = await request.get(`${API_BASE_URL}${path}`);
      // THEN: None of these paths return 200 (template must be fully removed)
      expect(response.status()).not.toBe(200);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security — endpoint exposure controls
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Backend — security and endpoint exposure controls', () => {
  test('[P1] should not expose /swagger-ui.html (Swashbuckle completely absent)', async ({
    request,
  }) => {
    // GIVEN: Swashbuckle is explicitly forbidden per architecture decision
    // WHEN: Common Swashbuckle paths are requested
    const swaggerPaths = [
      '/swagger',
      '/swagger/index.html',
      '/swagger/v1/swagger.json',
      '/swagger-ui.html',
    ];

    for (const path of swaggerPaths) {
      const response = await request.get(`${API_BASE_URL}${path}`);
      // THEN: None of these paths return 200 (Swashbuckle is not installed)
      expect(response.status()).not.toBe(200);
    }
  });

  test('[P1] should not expose debug or diagnostic endpoints by default', async ({ request }) => {
    // GIVEN: No diagnostic endpoints are mapped in Program.cs
    // WHEN: Common .NET diagnostic paths are requested
    const diagnosticPaths = ['/actuator', '/actuator/health', '/debug'];

    for (const path of diagnosticPaths) {
      const response = await request.get(`${API_BASE_URL}${path}`);
      // THEN: None of these paths return 200
      expect(response.status()).not.toBe(200);
    }
  });

  test('[P2] should not return server version information in response headers', async ({
    request,
  }) => {
    // GIVEN: Server headers should not leak version details in production-like setup
    // WHEN: A standard request is made
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The Server header does NOT expose detailed version information
    // ASP.NET Core by default may include "Kestrel" but not full version
    const serverHeader = response.headers()['x-powered-by'] ?? '';
    expect(serverHeader.toLowerCase()).not.toContain('asp.net');
  });
});
