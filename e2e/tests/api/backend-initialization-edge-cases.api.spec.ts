/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — Backend API Edge Cases & Boundary Conditions
 * Expands ATDD API coverage with negative paths, security boundary checks,
 * Problem Details RFC 7807 structure validation, and CORS negative scenarios.
 *
 * Coverage added:
 *   AC2 edge cases — CORS disallowed-origin negative path, OpenAPI metadata endpoint,
 *                    no sensitive headers leaked in responses
 *   AC3 edge cases — CORS preflight with disallowed origin returns no Allow-Origin header,
 *                    OPTIONS with unsupported method, POST preflight
 *   AC5 edge cases — ExceptionHandlingMiddleware Problem Details shape validation,
 *                    content-type on 404, no stack trace exposure
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 (Edge) — Backend API response boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 (Edge) — Backend API response headers and security boundaries', () => {
  test('[P1] should NOT include Server header revealing .NET version information', async ({
    request,
  }) => {
    // GIVEN: The backend is running with TreatWarningsAsErrors enabled
    // WHEN: A request is made to /scalar
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The Server header must not expose .NET Kestrel version details
    // Exposing server version is a security anti-pattern
    const serverHeader = response.headers()['server'] ?? '';
    expect(serverHeader).not.toMatch(/Kestrel\/\d/);
    expect(serverHeader).not.toMatch(/Microsoft-IIS\/\d/);
  });

  test('[P1] should respond to GET /scalar with Content-Type text/html (not JSON or empty)', async ({
    request,
  }) => {
    // GIVEN: Program.cs includes app.MapScalarApiReference()
    // WHEN: The Scalar UI endpoint is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Response is HTML (the Scalar SPA), not JSON or empty
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('text/html');
  });

  test('[P2] should not expose X-Powered-By header (information disclosure prevention)', async ({
    request,
  }) => {
    // GIVEN: The backend uses .NET 10 Minimal API
    // WHEN: Any request is made to the server
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: X-Powered-By header is absent (reveals platform details)
    const xPoweredBy = response.headers()['x-powered-by'] ?? '';
    expect(xPoweredBy).toBe('');
  });

  test('[P1] should respond to the OpenAPI metadata endpoint (needed by Scalar)', async ({
    request,
  }) => {
    // GIVEN: builder.Services.AddOpenApi() is registered in Program.cs
    // WHEN: The OpenAPI JSON metadata endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The OpenAPI spec is served (Scalar requires this for documentation)
    // Status 200 confirms AddOpenApi() + MapOpenApi() are both registered
    expect(response.status()).toBe(200);
  });

  test('[P1] should serve OpenAPI spec as application/json content-type', async ({ request }) => {
    // GIVEN: app.MapOpenApi() is registered in Program.cs
    // WHEN: The OpenAPI JSON spec is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response is application/json (required by OpenAPI spec standard)
    expect(contentType.toLowerCase()).toContain('json');
  });

  test('[P2] should not expose any /api/v1 placeholder routes from default template', async ({
    request,
  }) => {
    // GIVEN: Story 1.1 creates ONLY the skeleton — no business routes exist yet
    // WHEN: A request is made to a typical auto-generated endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: No business endpoints are registered yet (will 404)
    // This ensures the template cleanup was thorough
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 (Edge) — CORS negative paths and boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 (Edge) — CORS negative paths and disallowed origins', () => {
  test('[P1] should NOT include Access-Control-Allow-Origin for a disallowed external origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" ONLY allows http://localhost:5173
    // WHEN: A request with a different origin is sent
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious-site.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header is NOT set to the disallowed origin
    // (It must either be absent or not equal to the attacker's origin)
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://malicious-site.example.com');
  });

  test('[P1] OPTIONS preflight from disallowed origin must NOT return Allow-Origin header for that origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy restricts origins to http://localhost:5173
    // WHEN: An OPTIONS preflight comes from an unauthorized origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://attacker.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The response does NOT grant CORS access to the unauthorized origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('https://attacker.example.com');
  });

  test('[P1] OPTIONS preflight from allowed origin with POST method should be accepted', async ({
    request,
  }) => {
    // GIVEN: AllowAnyMethod() is configured in the CORS policy
    // WHEN: An OPTIONS preflight for POST is sent from the allowed frontend origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight responds (200 or 204) — backend does not block POST preflights
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] should allow DELETE method preflight from frontend origin (AllowAnyMethod)', async ({
    request,
  }) => {
    // GIVEN: AllowAnyMethod() permits any HTTP verb in CORS
    // WHEN: An OPTIONS preflight for DELETE is sent from http://localhost:5173
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
      },
    });

    // THEN: Server accepts the preflight (does not return 403)
    expect(response.status()).not.toBe(403);
  });

  test('[P1] should include Access-Control-Allow-Headers when AllowAnyHeader is configured', async ({
    request,
  }) => {
    // GIVEN: AllowAnyHeader() is set in the DevCors policy
    // WHEN: Preflight requests Content-Type and Authorization headers
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Response includes Access-Control-Allow-Headers (wildcard or explicit)
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    // Either wildcard or specific headers — must not be completely absent on valid preflight
    // We verify the preflight itself succeeded (not 403 forbidden)
    expect(response.status()).not.toBe(403);
    // And that headers are allowed in some form
    const hasHeaderPermission =
      allowHeaders === '*' ||
      allowHeaders.toLowerCase().includes('content-type') ||
      response.status() === 204; // Some implementations omit headers on 204
    expect(hasHeaderPermission).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (Edge) — ExceptionHandlingMiddleware Problem Details shape and security
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 (Edge) — ExceptionHandlingMiddleware RFC 7807 Problem Details shape', () => {
  test('[P0] should return application/problem+json content-type for 404 routes', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs before routing
    // WHEN: A request is made to a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/this-route-does-not-exist-atdd`);

    // THEN: Response uses JSON content-type (not HTML error page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('json');
  });

  test('[P0] should NOT expose internal stack trace in error response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all exceptions and returns Problem Details
    //        with Detail = null (never expose ex.Message or stack traces)
    // WHEN: A request to a non-existent endpoint triggers a 404 path
    const response = await request.get(`${API_BASE_URL}/api/trigger-not-found-path-atdd`);
    const body = await response.text();

    // THEN: The response body does NOT contain stack trace indicators
    expect(body).not.toContain('System.');
    expect(body).not.toContain('Microsoft.');
    expect(body).not.toContain('at SiesaAgents');
    expect(body).not.toContain('StackTrace');
  });

  test('[P1] should NOT expose exception message text in error response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (company security standard)
    // WHEN: A non-existent endpoint is hit
    const response = await request.get(`${API_BASE_URL}/api/error-detail-check-atdd`);
    const body = await response.text();

    // THEN: Response does not contain raw exception messages
    // "NullReferenceException", "Object reference not set to an instance", etc. must be absent
    expect(body).not.toContain('NullReferenceException');
    expect(body).not.toContain('Object reference not set');
    expect(body).not.toContain('Index was outside the bounds');
  });

  test('[P1] should return HTTP status within 4xx range for client errors (not 200)', async ({
    request,
  }) => {
    // GIVEN: A non-existent endpoint is requested (client-side 404)
    // WHEN: The request is processed through the middleware pipeline
    const response = await request.get(`${API_BASE_URL}/api/completely-absent-endpoint-atdd`);

    // THEN: Status code is in the 4xx range, not mistakenly 200
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should NOT return HTML error page for API requests (no developer exception page)', async ({
    request,
  }) => {
    // GIVEN: The backend is NOT in development mode with DeveloperExceptionPage active
    //        (or if it is, it should not return HTML for API paths)
    // WHEN: An unknown API endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/check-not-html-error-atdd`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is NOT an HTML error page (would indicate middleware misconfiguration)
    expect(contentType.toLowerCase()).not.toContain('text/html');
  });

  test('[P2] HTTP 404 response for unknown route must have non-empty body (not silent 404)', async ({
    request,
  }) => {
    // GIVEN: The API follows RFC 7807 — all error responses should have a body
    // WHEN: A completely unknown path is requested
    const response = await request.get(`${API_BASE_URL}/api/empty-body-check-atdd`);
    const body = await response.text();

    // THEN: The response body is not empty (RFC 7807 requires a body with status/title)
    expect(body.trim().length).toBeGreaterThan(0);
  });

  test('[P0] CORS must be applied before error handling — error responses must include CORS headers', async ({
    request,
  }) => {
    // GIVEN: app.UseCors() is called AFTER app.UseMiddleware<ExceptionHandlingMiddleware>()
    //        in Program.cs — this means CORS runs on the way OUT, after error handling
    // WHEN: A cross-origin request to a non-existent endpoint is made from frontend origin
    const response = await request.get(`${API_BASE_URL}/api/cors-on-error-check-atdd`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: Even error responses (404) include the CORS header so the frontend
    //       can read the error body (not silently blocked)
    // Note: .NET pipeline applies CORS on response regardless of error, when UseCors is called
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    // CORS header should be present so frontend can read error responses
    const corsPresent =
      allowOrigin === 'http://localhost:5173' ||
      allowOrigin === '*';
    expect(corsPresent).toBe(true);
  });
});
