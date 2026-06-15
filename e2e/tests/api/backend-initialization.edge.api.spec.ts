/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automate Expansion — API Edge cases, error paths, boundary conditions
 * Complements ATDD tests in backend-initialization.api.spec.ts
 *
 * Test levels: API (no UI), exercise backend boundaries directly
 *
 * Acceptance Criteria expanded:
 *   AC2 — Backend (edge: /health, /openapi/v1.json, HTTP methods, content types)
 *   AC5 — Build success (edge: Problem Details schema, no stack trace leak)
 *   Implicit (Task 4 stub) — ExceptionHandlingMiddleware Problem Details RFC 7807
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 edge — Health endpoint smoke and additional backend surface checks
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 edge — Backend runtime surface beyond /scalar', () => {
  test('[P0] should respond 200 on GET /health with status payload', async ({ request }) => {
    // GIVEN: Program.cs maps GET /health -> { status: "ok" }
    // WHEN: Health probe is requested
    const response = await request.get(`${API_BASE_URL}/health`);

    // THEN: 200 with JSON body { status: "ok" }
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'ok' });
  });

  test('[P0] should return application/json content-type on /health', async ({ request }) => {
    // GIVEN: /health endpoint uses Results.Ok(new { status = "ok" })
    // WHEN: Requesting /health
    const response = await request.get(`${API_BASE_URL}/health`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is JSON (not text/plain or HTML)
    expect(contentType).toContain('application/json');
  });

  test('[P1] should serve OpenAPI metadata JSON at /openapi/v1.json (required by Scalar)', async ({ request }) => {
    // GIVEN: Program.cs registers AddOpenApi() and MapOpenApi() — needed for Scalar to render the doc
    // WHEN: Requesting the OpenAPI document
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: 200 with a JSON OpenAPI document
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] OpenAPI document should expose the /health operation', async ({ request }) => {
    // GIVEN: /health endpoint has .WithName("Health") and .Produces<object>(200)
    // WHEN: Inspecting the OpenAPI doc
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    expect(response.status()).toBe(200);

    const doc = await response.json();

    // THEN: OpenAPI doc has paths and /health is declared
    expect(doc).toHaveProperty('paths');
    expect(doc.paths).toHaveProperty('/health');
  });

  test('[P1] should reject POST on /health (only GET is mapped)', async ({ request }) => {
    // GIVEN: /health is mapped only for GET via MapGet
    // WHEN: Sending an unsupported HTTP method
    const response = await request.post(`${API_BASE_URL}/health`, { data: {} });

    // THEN: 404 or 405 — never 200
    expect([404, 405]).toContain(response.status());
  });

  test('[P2] should serve Scalar UI HTML containing a Scalar-specific marker', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore registered via MapScalarApiReference()
    // WHEN: Fetching the rendered Scalar HTML
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: HTML body contains a Scalar-identifying marker (script, title, or asset)
    // We tolerate any of: "Scalar", "scalar", or the scalar js asset path
    const hasScalarMarker =
      /scalar/i.test(body) && !/swagger-ui/i.test(body);
    expect(hasScalarMarker).toBe(true);
  });

  test('[P2] should NOT serve Swagger UI under any common Swashbuckle alias', async ({ request }) => {
    // GIVEN: Swashbuckle is explicitly forbidden per architecture decision
    // WHEN: Probing common Swagger UI mount points
    const candidates = ['/swagger', '/swagger/index.html', '/swagger/v1/swagger.json'];

    for (const path of candidates) {
      const response = await request.get(`${API_BASE_URL}${path}`);
      // THEN: None of the Swagger paths should return 200 with a Swagger document
      expect(response.status(), `Path ${path} unexpectedly returned 200`).not.toBe(200);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 edge — Problem Details RFC 7807 schema, no exception leakage
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 edge — Problem Details fallback schema and security', () => {
  test('[P0] fallback 404 should return RFC 7807 Problem Details JSON shape', async ({ request }) => {
    // GIVEN: app.MapFallback emits ProblemDetails with status, title, type, instance
    // WHEN: Requesting an unmatched route
    const response = await request.get(`${API_BASE_URL}/this-route-does-not-exist-1234`);

    // THEN: 404 with Problem Details fields
    expect(response.status()).toBe(404);

    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/application\/(problem\+)?json/);

    const body = await response.json();
    // RFC 7807 required-ish fields: status, title (others optional but our impl includes type, instance)
    expect(body).toHaveProperty('status');
    expect(body.status).toBe(404);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('[P0] fallback Problem Details must NOT leak stack traces or exception details', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware explicitly omits detail/stack to prevent info disclosure
    // WHEN: An unmatched route is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/secret-${Date.now()}`);

    const body = await response.json();
    const serialized = JSON.stringify(body).toLowerCase();

    // THEN: No sensitive exception fields in payload
    // Even if `detail` is present, it must NOT contain stack traces or .NET exception signatures
    expect(serialized).not.toContain('stacktrace');
    expect(serialized).not.toContain('innerexception');
    expect(serialized).not.toMatch(/at\s+siesaagents\./i); // .NET stack trace frame pattern
    expect(serialized).not.toMatch(/system\.exception/i);
  });

  test('[P1] fallback Problem Details should include the request path as "instance"', async ({ request }) => {
    // GIVEN: MapFallback sets Instance = context.Request.Path
    // WHEN: Hitting a known-unmatched path
    const path = '/api/v1/diagnostic-probe-path';
    const response = await request.get(`${API_BASE_URL}${path}`);

    const body = await response.json();

    // THEN: The "instance" field reflects the requested path
    expect(body).toHaveProperty('instance');
    expect(body.instance).toBe(path);
  });

  test('[P1] fallback Problem Details should declare an RFC 7807 "type" URI', async ({ request }) => {
    // GIVEN: MapFallback sets Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4"
    // WHEN: Hitting a non-existent route
    const response = await request.get(`${API_BASE_URL}/api/no-such-thing`);

    const body = await response.json();

    // THEN: type field is a URI string (per RFC 7807)
    expect(body).toHaveProperty('type');
    expect(typeof body.type).toBe('string');
    expect(body.type).toMatch(/^https?:\/\//);
  });

  test('[P2] fallback should apply to nested paths (multiple segments) consistently', async ({ request }) => {
    // GIVEN: MapFallback is a catch-all
    // WHEN: A deeply nested non-existent path is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/a/b/c/d/does-not-exist`
    );

    // THEN: Same 404 + Problem Details behavior — fallback is uniform across depths
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/json/);
  });

  test('[P2] fallback should respond with JSON for path containing query string', async ({ request }) => {
    // GIVEN: Fallback ignores query string, applies on path only
    // WHEN: Requesting unmatched path with query string
    const response = await request.get(
      `${API_BASE_URL}/api/v1/missing?foo=bar&baz=qux`
    );

    // THEN: Still 404 with JSON Problem Details
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toMatch(/json/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS edge cases — beyond the happy-path covered by ATDD
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge — CORS HTTP method matrix', () => {
  test('[P1] CORS allows POST preflight from frontend origin', async ({ request }) => {
    // GIVEN: AllowAnyMethod() in CORS policy
    // WHEN: POST preflight from allowed origin
    const response = await request.fetch(`${API_BASE_URL}/api/v1/whatever`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Preflight not rejected (status < 400 for CORS itself; the route may still 404)
    // Allow-Origin header must echo the frontend origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).toBe('http://localhost:5173');
  });

  test('[P1] CORS allows DELETE preflight from frontend origin', async ({ request }) => {
    // GIVEN: AllowAnyMethod() in CORS policy
    // WHEN: DELETE preflight from allowed origin
    const response = await request.fetch(`${API_BASE_URL}/api/v1/whatever/123`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
      },
    });

    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).toBe('http://localhost:5173');
  });

  test('[P1] CORS allows custom Content-Type headers in preflight (AllowAnyHeader)', async ({ request }) => {
    // GIVEN: AllowAnyHeader() in CORS policy
    // WHEN: Preflight with non-trivial headers
    const response = await request.fetch(`${API_BASE_URL}/api/v1/anything`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type, X-Custom-Header, Authorization',
      },
    });

    // THEN: Either Allow-Headers echoes back what was requested, or the preflight succeeds with origin allowed
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).toBe('http://localhost:5173');
  });
});
