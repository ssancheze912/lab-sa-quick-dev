/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case API Tests — Automation Expansion
 * Expands ATDD API coverage with boundary conditions, error paths, and
 * negative scenarios not covered by backend-initialization.api.spec.ts.
 *
 * Acceptance Criteria expanded:
 *   AC2 — Scalar serves valid HTML; no OpenAPI JSON exposed; /weatherforecast removed
 *   AC4 — Content-Type enforcement; health endpoint response shape boundary
 *   AC5 — ExceptionHandlingMiddleware: different 4xx/5xx codes; no leaked internals
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Scalar API documentation boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Scalar API documentation boundary conditions', () => {
  test('[P0] /scalar must NOT expose OpenAPI JSON spec (no openapi.json endpoint)', async ({
    request,
  }) => {
    // GIVEN: The project was created with --no-openapi flag and no Swashbuckle installed
    // WHEN: Requesting the default OpenAPI JSON path
    const response = await request.get(`${API_BASE_URL}/openapi.json`);

    // THEN: OpenAPI JSON endpoint does NOT exist (404, not 200)
    expect(response.status()).not.toBe(200);
  });

  test('[P1] /swagger/v1/swagger.json must not exist (Swashbuckle forbidden)', async ({
    request,
  }) => {
    // GIVEN: Swagger/Swashbuckle is explicitly forbidden per architecture rules
    // WHEN: Requesting the Swashbuckle default JSON endpoint
    const response = await request.get(`${API_BASE_URL}/swagger/v1/swagger.json`);

    // THEN: Endpoint does not exist
    expect(response.status()).not.toBe(200);
  });

  test('[P1] /swagger must NOT return 200 (endpoint completely absent)', async ({ request }) => {
    // GIVEN: app.UseSwagger() and app.UseSwaggerUI() are never called
    // WHEN: Requesting /swagger directly
    const response = await request.get(`${API_BASE_URL}/swagger`);

    // THEN: Server does not serve Swagger UI (404 or redirect to non-swagger page)
    expect(response.status(), '/swagger must not return 200 — Swagger is forbidden').not.toBe(200);
  });

  test('[P1] Scalar page must include Scalar-related content (not blank page)', async ({
    request,
  }) => {
    // GIVEN: Scalar.AspNetCore renders its API explorer page
    // WHEN: Requesting /scalar and reading the HTML body
    const response = await request.get(`${API_BASE_URL}/scalar`);
    expect(response.status()).toBe(200);

    const body = await response.text();

    // THEN: Body contains Scalar-identifying content (not a blank/minimal HTML page)
    // Scalar injects either its bundle or its configuration JSON
    const hasScalarContent =
      body.toLowerCase().includes('scalar') ||
      body.toLowerCase().includes('api-reference') ||
      body.includes('<script');

    expect(hasScalarContent, 'Scalar page must include recognizable Scalar content').toBe(true);
  });

  test('[P2] GET /api/v1/health must respond within 2 seconds (latency boundary)', async ({
    request,
  }) => {
    // GIVEN: The health endpoint is a simple in-memory response (no database)
    // WHEN: Timing a GET request to /api/v1/health
    const start = Date.now();
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);
    const elapsed = Date.now() - start;

    // THEN: Response arrives within 2000ms (2 seconds)
    expect(response.status()).toBe(200);
    expect(elapsed, `Health endpoint should respond within 2000ms but took ${elapsed}ms`).toBeLessThan(
      2000
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Health endpoint content and CORS detailed validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — Health endpoint content validation and CORS detailed checks', () => {
  test('[P0] /api/v1/health response body must be parseable JSON (not empty)', async ({
    request,
  }) => {
    // GIVEN: The health endpoint always returns a JSON body
    // WHEN: Requesting /api/v1/health
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: Body is valid JSON with at least one field
    const body = await response.json();
    expect(body).toBeTruthy();
    expect(typeof body).toBe('object');
    expect(Object.keys(body).length).toBeGreaterThan(0);
  });

  test('[P0] status value in /api/v1/health must be the string "healthy" (exact case)', async ({
    request,
  }) => {
    // GIVEN: HealthEndpoints.cs returns Results.Ok(new { status = "healthy" })
    // WHEN: Requesting /api/v1/health
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);
    const body = await response.json();

    // THEN: status is exactly "healthy" (lowercase, not "Healthy", not "ok", not true)
    expect(body.status).toBe('healthy');
  });

  test('[P1] CORS must allow GET method from frontend origin', async ({ request }) => {
    // GIVEN: AllowAnyMethod() is configured in CORS policy
    // WHEN: A GET request from the frontend origin is made
    const response = await request.get(`${API_BASE_URL}/api/v1/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: Response is 200 (not blocked by CORS)
    expect(response.status()).toBe(200);
  });

  test('[P1] CORS must allow POST method from frontend origin', async ({ request }) => {
    // GIVEN: AllowAnyMethod() includes POST in CORS policy
    // WHEN: A POST request from the frontend origin is made (even to an endpoint that may return 404/405)
    const response = await request.fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:5173',
        'Content-Type': 'application/json',
      },
      data: '{}',
    });

    // THEN: CORS header is present (the endpoint may return 405, but not a CORS block)
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    // CORS header should be present regardless of method (AllowAnyMethod)
    // Status could be 405 or 404, but CORS itself should not block
    expect(
      allowOriginHeader === 'http://localhost:5173' || allowOriginHeader === '*',
      `CORS should allow POST from frontend origin. Got header: "${allowOriginHeader}"`
    ).toBe(true);
  });

  test('[P1] CORS preflight must include Access-Control-Allow-Headers', async ({ request }) => {
    // GIVEN: AllowAnyHeader() is configured in CORS policy
    // WHEN: OPTIONS preflight includes Access-Control-Request-Headers
    const response = await request.fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Preflight succeeds and includes Access-Control-Allow-Headers
    expect([200, 204]).toContain(response.status());
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    expect(allowHeaders.length, 'CORS preflight must include Access-Control-Allow-Headers').toBeGreaterThan(0);
  });

  test('[P2] health endpoint must NOT include sensitive server information in headers', async ({
    request,
  }) => {
    // GIVEN: Production-hardened APIs should not expose server details
    // WHEN: Requesting /api/v1/health
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: Server header does not expose detailed ASP.NET Core version info
    // Acceptable: header absent, or "Microsoft-IIS", not "Kestrel/x.y.z" with exact version
    const serverHeader = (response.headers()['server'] ?? '').toLowerCase();
    const hasVersionLeak = /kestrel\/\d+\.\d+\.\d+/.test(serverHeader);
    expect(
      hasVersionLeak,
      `Server header must not expose Kestrel version string. Got: "${serverHeader}"`
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — ExceptionHandlingMiddleware: error code mapping edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — ExceptionHandlingMiddleware error handling edge cases', () => {
  test('[P0] Multiple unknown paths must all return JSON 404 (not vary by path length)', async ({
    request,
  }) => {
    // GIVEN: MapFallback intercepts all unmatched routes
    // WHEN: Multiple distinct non-existent paths are requested
    const paths = [
      '/api/v1/does-not-exist',
      '/api/v2/also-missing',
      '/totally/different/path',
    ];

    for (const reqPath of paths) {
      const response = await request.get(`${API_BASE_URL}${reqPath}`);

      // THEN: Each returns 404 with JSON content-type
      expect(response.status(), `${reqPath} should return 404`).toBe(404);
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType, `${reqPath} must return JSON content-type`).toContain('json');
    }
  });

  test('[P1] 404 Problem Details body must NOT contain the path in a sensitive way', async ({
    request,
  }) => {
    // GIVEN: Problem Details may include instance but must not expose system details
    // WHEN: Requesting a non-existent endpoint
    const testPath = '/api/v1/nonexistent-edge-check';
    const response = await request.get(`${API_BASE_URL}${testPath}`);
    const body = await response.json();

    // THEN: No C# exception type names or stack trace fragments in the body
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain('System.Exception');
    expect(bodyStr).not.toContain('at SiesaAgents');
    expect(bodyStr).not.toContain('Application.dll');
  });

  test('[P1] RFC 7807 response must include traceId extension field for observability', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware adds traceId to extensions per implementation
    // WHEN: Requesting a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/trace-id-check`);
    const body = await response.json();

    // THEN: traceId is present in the Problem Details response
    expect(body).toHaveProperty('traceId');
    expect(body.traceId).toBeTruthy();
  });

  test('[P2] Concurrent requests to /api/v1/health must all return 200 (no race conditions)', async ({
    request,
  }) => {
    // GIVEN: The health endpoint has no shared mutable state
    // WHEN: 5 concurrent requests are made simultaneously
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request.get(`${API_BASE_URL}/api/v1/health`)
      )
    );

    // THEN: All 5 requests return 200
    for (const response of results) {
      expect(response.status(), 'All concurrent health requests must return 200').toBe(200);
    }
  });
});
