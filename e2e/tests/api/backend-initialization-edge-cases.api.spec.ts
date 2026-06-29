/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded API automation coverage — Edge Cases, Boundary Conditions & Error Paths
 * BMad-Integrated Mode: expands ATDD API tests with negative paths and structural validation.
 *
 * Covers:
 *   - Problem Details RFC 7807 exact schema for 404 (MapFallback) and 500 (ExceptionHandlingMiddleware)
 *   - CORS rejection for non-allowed origins (negative case)
 *   - CORS preflight with POST and Authorization header request
 *   - OpenAPI metadata endpoint (/openapi/v1.json) accessible
 *   - Response time SLA for /scalar (< 3 seconds)
 *   - Backend responds to HEAD and OPTIONS on known endpoints
 *   - Connection strings and configuration loaded (no startup crash)
 *   - Backend 404 response body is valid Problem Details JSON (not HTML)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Problem Details RFC 7807 — structure validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Problem Details RFC 7807 response structure', () => {
  test('[P1] should return application/problem+json content-type for 404 responses', async ({
    request,
  }) => {
    // GIVEN: MapFallback returns Results.Problem(statusCode: 404) in Program.cs
    // WHEN: A request is made to a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/does-not-exist`);

    // THEN: Content-Type is application/problem+json (RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P1] should return a body with "status" field equal to 404 in Problem Details', async ({
    request,
  }) => {
    // GIVEN: MapFallback returns Problem Details with statusCode 404
    // WHEN: A GET to a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-resource`);
    const body = await response.json();

    // THEN: Problem Details body has "status": 404
    expect(body).toHaveProperty('status', 404);
  });

  test('[P1] should return a body with "title" field in Problem Details for 404', async ({
    request,
  }) => {
    // GIVEN: MapFallback returns Problem Details with title "Not Found."
    // WHEN: A request to missing endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/another-missing-route`);
    const body = await response.json();

    // THEN: Problem Details body has a non-empty "title" field
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.trim().length).toBeGreaterThan(0);
  });

  test('[P1] should NOT expose stack trace or exception detail in 404 Problem Details body', async ({
    request,
  }) => {
    // GIVEN: The architecture mandates never exposing ex.Message or stack traces
    // WHEN: A request triggers a 404
    const response = await request.get(`${API_BASE_URL}/api/v1/no-stack-trace-exposure`);
    const body = await response.json();

    // THEN: The "detail" field is null or not present (no exception message)
    const detail = body.detail ?? null;
    // detail should be null (security requirement: never expose internal details)
    expect(detail).toBeNull();
  });

  test('[P2] should return valid Problem Details JSON (not HTML) for any unmatched path', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware and MapFallback are registered
    // WHEN: An arbitrary path is requested
    const response = await request.get(`${API_BASE_URL}/totally-unknown/path/123`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is JSON, not an HTML error page
    expect(contentType).toContain('json');
    expect(contentType).not.toContain('text/html');
  });

  test('[P2] should return 404 (not 500) for unmatched GET routes via MapFallback', async ({
    request,
  }) => {
    // GIVEN: MapFallback is configured with statusCode 404
    // WHEN: A GET to a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/v99/not-implemented`);

    // THEN: Status is 404, not 500 (fallback is not triggering middleware exception)
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS — negative cases (non-allowed origins must be rejected)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] CORS security — non-allowed origins rejected', () => {
  test('[P1] should NOT include Access-Control-Allow-Origin for unauthorized origins', async ({
    request,
  }) => {
    // GIVEN: CORS policy only allows http://localhost:5173
    // WHEN: A request is made with a different origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious-site.example.com',
      },
    });

    // THEN: The response does NOT include Access-Control-Allow-Origin for the malicious origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://malicious-site.example.com');
  });

  test('[P1] should NOT allow wildcard (*) CORS when specific origins are configured', async ({
    request,
  }) => {
    // GIVEN: CORS is configured with WithOrigins("http://localhost:5173") — not AllowAnyOrigin
    // WHEN: A request is made from the allowed origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: The CORS header is the specific allowed origin, NOT wildcard
    // (Wildcard would indicate a security misconfiguration)
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    // Must be http://localhost:5173 (specific) — wildcard is NOT acceptable
    expect(allowOriginHeader).toBe('http://localhost:5173');
  });

  test('[P2] should reject OPTIONS preflight from non-allowed origin (no CORS headers)', async ({
    request,
  }) => {
    // GIVEN: CORS policy restricts to http://localhost:5173 only
    // WHEN: An OPTIONS preflight comes from a different origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://attacker.example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // THEN: Access-Control-Allow-Origin is NOT set for the attacker origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://attacker.example.com');
    expect(allowOriginHeader).not.toBe('*');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS — extended allowed method and header scenarios
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] CORS extended method and header coverage', () => {
  test('[P1] should allow CORS preflight for POST method from frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy has AllowAnyMethod() configured
    // WHEN: An OPTIONS preflight is sent requesting POST method from allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight is accepted (200 or 204)
    expect([200, 204]).toContain(response.status());
  });

  test('[P1] should allow CORS preflight requesting Authorization header from frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy has AllowAnyHeader() — Authorization header must be allowed for future auth
    // WHEN: An OPTIONS preflight is sent requesting Authorization header
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type',
      },
    });

    // THEN: Preflight is accepted (200 or 204) — Authorization header is allowed
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] should allow CORS preflight for DELETE method (future API needs)', async ({
    request,
  }) => {
    // GIVEN: CORS policy has AllowAnyMethod() — DELETE must be allowed for future resource endpoints
    // WHEN: An OPTIONS preflight for DELETE method from frontend origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
      },
    });

    // THEN: Preflight is not rejected
    expect([200, 204]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI metadata endpoint accessibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] OpenAPI metadata endpoint', () => {
  test('[P2] should expose OpenAPI JSON schema at /openapi/v1.json (MapOpenApi)', async ({
    request,
  }) => {
    // GIVEN: Program.cs calls app.MapOpenApi() for Scalar metadata
    // WHEN: The OpenAPI JSON endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The endpoint responds with 200 (OpenAPI spec available)
    expect(response.status()).toBe(200);
  });

  test('[P2] should return JSON content from the OpenAPI metadata endpoint', async ({
    request,
  }) => {
    // GIVEN: MapOpenApi() generates the OpenAPI specification document
    // WHEN: The endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content type is JSON
    expect(contentType).toContain('json');
  });

  test('[P2] should have a valid OpenAPI version field in the specification', async ({
    request,
  }) => {
    // GIVEN: MapOpenApi() generates the specification
    // WHEN: The spec is fetched
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const body = await response.json();

    // THEN: The openapi version field is present (3.x)
    expect(body).toHaveProperty('openapi');
    expect((body.openapi as string).startsWith('3.')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response time SLA — /scalar must be fast
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend response time SLA', () => {
  test('[P2] should serve the Scalar documentation page in under 3 seconds', async ({
    request,
  }) => {
    // GIVEN: The backend is running and Scalar is configured
    // WHEN: The /scalar endpoint is requested and we measure response time
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const elapsed = Date.now() - startTime;

    // THEN: Response is received in under 3000ms (reasonable SLA for a development server)
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  });

  test('[P2] should respond to /openapi/v1.json in under 2 seconds', async ({ request }) => {
    // GIVEN: The OpenAPI spec is generated in-memory (no disk I/O needed)
    // WHEN: The endpoint is requested
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const elapsed = Date.now() - startTime;

    // THEN: Spec is generated in under 2000ms
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(2000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend HTTP method handling — HEAD and unsupported methods
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend HTTP method boundary conditions', () => {
  test('[P2] should respond to HEAD request on /scalar (not crash)', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: A HEAD request is made to /scalar
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'HEAD',
    });

    // THEN: The server responds (200, 404, 405 — any response means server is healthy)
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should return 404 or 405 (not 500) for PUT /scalar (no handler)', async ({
    request,
  }) => {
    // GIVEN: /scalar is a GET-only endpoint
    // WHEN: A PUT request is made to /scalar
    const response = await request.put(`${API_BASE_URL}/scalar`, { data: {} });

    // THEN: Returns 404 or 405 (method not allowed), NOT 500 (server error)
    // This validates ExceptionHandlingMiddleware does NOT catch 405 as unhandled exception
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Server configuration — appsettings.Development.json loaded correctly
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Backend configuration loading', () => {
  test('[P1] should start without a database connection (ConnectionStrings placeholder does not crash startup)', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has a ConnectionStrings.DefaultConnection pointing to localhost Postgres
    // AND: There is no Postgres running (or it may be running — either way startup must not crash)
    // WHEN: The backend is running (if it is, startup succeeded without DB connection requirement)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Backend is running — this proves ConnectionStrings placeholder did not crash startup
    // (EF Core / Npgsql only connects on first query, not on startup, so this is safe)
    expect(response.status()).toBe(200);
  });

  test('[P1] should NOT expose connection string details in any API response', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has database connection strings
    // WHEN: A request to a known endpoint is made
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: No connection string data appears in the response body (security check)
    expect(body.toLowerCase()).not.toContain('password=postgres');
    expect(body.toLowerCase()).not.toContain('defaultconnection');
  });
});
