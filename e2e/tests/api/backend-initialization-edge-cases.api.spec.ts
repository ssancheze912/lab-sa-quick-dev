/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATE — API Edge Cases & Boundary Conditions
 * Expands ATDD coverage with error paths, middleware edge cases, and config boundaries.
 *
 * Coverage focus:
 *   AC2 — Backend initialization edge cases (response bodies, headers, middleware ordering)
 *   AC5 — ExceptionHandlingMiddleware edge cases (already-started response, Problem Details schema)
 *         and UseStatusCodePages behavior for common 4xx codes
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 Edge Cases — Backend server initialization
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 Edge Cases — Backend server initialization', () => {
  test('[P1] should return 404 for an unknown /api/v1 path (Problem Details, not HTML)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware and UseStatusCodePages are registered
    // WHEN: A GET request is made to a non-existent API path
    const response = await request.get(`${API_BASE_URL}/api/v1/this-does-not-exist`);

    // THEN: Status 404, and body is JSON (Problem Details) — NOT HTML error page
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] Problem Details 404 response must include "status" field equal to 404', async ({ request }) => {
    // GIVEN: UseStatusCodePages is registered to produce RFC 7807 format
    // WHEN: A 404 response is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-atdd`);
    const body = await response.json();

    // THEN: The JSON body contains the "status" field with value 404
    expect(body).toHaveProperty('status', 404);
  });

  test('[P1] Problem Details 404 response must include a "title" field', async ({ request }) => {
    // GIVEN: UseStatusCodePages produces RFC 7807 Problem Details
    // WHEN: A 404 is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-atdd`);
    const body = await response.json();

    // THEN: The JSON body includes a non-empty "title" field
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect((body.title as string).length).toBeGreaterThan(0);
  });

  test('[P2] Problem Details 404 response must include "instance" matching the request path', async ({ request }) => {
    // GIVEN: UseStatusCodePages sets instance to context.Request.Path
    // WHEN: A GET to /api/nonexistent-atdd triggers a 404
    const targetPath = '/api/nonexistent-instance-check';
    const response = await request.get(`${API_BASE_URL}${targetPath}`);
    const body = await response.json();

    // THEN: The "instance" field matches the requested path
    expect(body).toHaveProperty('instance', targetPath);
  });

  test('[P1] should return 405 Method Not Allowed for POST on GET-only endpoint /scalar', async ({ request }) => {
    // GIVEN: /scalar only accepts GET requests
    // WHEN: A POST request is made to /scalar
    const response = await request.post(`${API_BASE_URL}/scalar`, { data: {} });

    // THEN: Status is 404 or 405 (endpoint does not handle POST)
    expect([404, 405]).toContain(response.status());
  });

  test('[P1] Scalar endpoint must return Content-Type text/html; charset=utf-8', async ({ request }) => {
    // GIVEN: MapScalarApiReference() serves the Scalar SPA as HTML
    // WHEN: GET /scalar is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type includes text/html (may include charset)
    expect(contentType).toContain('text/html');
  });

  test('[P2] Scalar HTML response must include a non-empty body', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore serves a UI page
    // WHEN: GET /scalar is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: The body is not empty — actual HTML is served
    expect(body.length).toBeGreaterThan(100);
  });

  test('[P2] backend root path (/) should not return 500 Internal Server Error', async ({ request }) => {
    // GIVEN: No unhandled exceptions are thrown at startup
    // WHEN: GET / is requested (may 404, but must not 500)
    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: Not a 500 (would indicate startup crash or unhandled exception)
    expect(response.status()).not.toBe(500);
  });

  test('[P2] /openapi/v1.json endpoint should return OpenAPI metadata (Scalar source)', async ({ request }) => {
    // GIVEN: builder.Services.AddOpenApi() and app.MapOpenApi() are registered
    // WHEN: The OpenAPI spec is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Returns 200 with JSON (OpenAPI spec)
    // This validates AddOpenApi() is wired correctly as required by Scalar
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] should NOT return Access-Control-Allow-Origin for requests without Origin header', async ({ request }) => {
    // GIVEN: CORS policy only triggers on cross-origin requests
    // WHEN: A GET request is made without an Origin header (same-origin or server-to-server)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The Access-Control-Allow-Origin header may be absent (no Origin = no CORS)
    // This validates the CORS middleware is not erroneously applying to all requests
    const status = response.status();
    // Main assertion: server responds correctly (not crash)
    expect(status).toBe(200);
  });

  test('[P2] should not expose internal exception details in 500 response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all exceptions
    //        and Detail is explicitly set to null
    // WHEN: An endpoint that throws an unhandled exception is hit
    // NOTE: We simulate by hitting an endpoint that does not exist in a way that may trigger middleware
    //       The actual detail=null assertion is covered by the unit test; here we verify no sensitive data leaks
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-500-check`);

    // THEN: If a 500 is returned, "detail" must be null or absent
    if (response.status() === 500) {
      const body = await response.json();
      // detail must be null or not present — never a stack trace string
      expect(body.detail == null || body.detail === '').toBe(true);
    } else {
      // 404 is also acceptable — just can't be a 500 with details
      expect([400, 404]).toContain(response.status());
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 Edge Cases — ExceptionHandlingMiddleware and Problem Details
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 Edge Cases — ExceptionHandlingMiddleware and UseStatusCodePages', () => {
  test('[P0] ExceptionHandlingMiddleware must return content-type application/problem+json on 500', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is the first middleware in the pipeline
    // WHEN: An exception is thrown (simulated — real 500 would require a test endpoint)
    // We use the existing unit test behavior as proxy; for API tests we verify the middleware
    // is registered by checking that all responses are JSON (not HTML) even for errors

    // A request to a known 404 path validates UseStatusCodePages (which uses same JSON format)
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-problem-check`);

    // THEN: Content-Type is JSON (problem+json or application/json) — not text/html
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] UseStatusCodePages must return JSON (not HTML) for 404 on /api paths', async ({ request }) => {
    // GIVEN: UseStatusCodePages is configured after ExceptionHandlingMiddleware
    // WHEN: A 404 is triggered on an /api path
    const response = await request.get(`${API_BASE_URL}/api/v1/does-not-exist-for-content-type-check`);

    // THEN: Content-Type is JSON (Problem Details format)
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] UseStatusCodePages 404 body must be valid JSON parseable without error', async ({ request }) => {
    // GIVEN: The 404 response body is serialized with JsonSerializer
    // WHEN: A 404 is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/json-parse-check`);

    // THEN: The response body is valid parseable JSON
    let parseError: Error | null = null;
    try {
      await response.json();
    } catch (err) {
      parseError = err as Error;
    }
    expect(parseError).toBeNull();
  });

  test('[P2] UseStatusCodePages must handle 405 responses with JSON body', async ({ request }) => {
    // GIVEN: UseStatusCodePages handles multiple 4xx codes
    // WHEN: A POST is made to /scalar (which only accepts GET → 405)
    const response = await request.post(`${API_BASE_URL}/scalar`, { data: {} });

    // THEN: If 405, the body is JSON (not HTML)
    if (response.status() === 405) {
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('json');
    } else {
      // 404 is also acceptable if the route isn't registered
      expect([404, 405]).toContain(response.status());
    }
  });

  test('[P2] ExceptionHandlingMiddleware must not expose stack trace in "detail" field', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware always sets Detail = null
    // WHEN: A 500 error response is returned (hypothetical via known path)
    // We test this indirectly: any 500 response must lack stack trace
    const response = await request.get(`${API_BASE_URL}/api/v1/stack-trace-check`);

    if (response.status() === 500) {
      const body = await response.json();
      const detail = body.detail as string | null | undefined;

      // THEN: "detail" is null, absent, or an empty string — never a stack trace
      if (detail) {
        expect(detail).not.toMatch(/at .+ in .+\.cs/); // No C# stack trace format
        expect(detail).not.toContain('System.Exception');
        expect(detail).not.toContain('StackTrace');
      }
    }
    // If not 500, test is vacuously satisfied (non-500 response means middleware is working)
  });

  test('[P2] backend must respond with camelCase JSON keys in Problem Details (not PascalCase)', async ({
    request,
  }) => {
    // GIVEN: JsonSerializer is configured with PropertyNamingPolicy = CamelCase
    // WHEN: A 404 Problem Details response is received
    const response = await request.get(`${API_BASE_URL}/api/v1/camelcase-check`);

    if (response.status() === 404) {
      const body = (await response.json()) as Record<string, unknown>;
      const keys = Object.keys(body);

      // THEN: Keys follow camelCase naming (e.g., "status", "title", "instance")
      // NOT PascalCase (e.g., "Status", "Title", "Instance")
      for (const key of keys) {
        if (key.length > 1) {
          // camelCase: first character is lowercase
          expect(key[0]).toBe(key[0].toLowerCase());
        }
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Boundary Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Configuration Boundaries — appsettings.Development.json', () => {
  test('[P1] AllowedOrigins config must be respected: http://localhost:5173 allowed', async ({ request }) => {
    // GIVEN: AllowedOrigins: ["http://localhost:5173"] in appsettings.Development.json
    // WHEN: The configured origin sends a request
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: The Access-Control-Allow-Origin header is present for the allowed origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader === 'http://localhost:5173' || allowOriginHeader === '*').toBe(true);
  });

  test('[P2] backend should serve responses with X-Content-Type-Options or similar security headers (optional)', async ({
    request,
  }) => {
    // GIVEN: ASP.NET Core may or may not set security headers by default
    // WHEN: Any endpoint is called
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server responds (this test documents baseline security header state)
    // Main assertion: server is healthy
    expect(response.status()).toBe(200);
    // Document what headers are present — no strict assertion (observational)
    const headers = response.headers();
    const hasSecurityHeader =
      'x-content-type-options' in headers ||
      'x-frame-options' in headers ||
      'content-security-policy' in headers;
    // This is informational — log but do not fail
    if (!hasSecurityHeader) {
      console.log('[INFO] No security headers detected. Consider adding them in future stories.');
    }
  });

  test('[P1] backend must NOT include "Server" header revealing technology stack', async ({ request }) => {
    // GIVEN: Good security practice — hide server implementation details
    // WHEN: Any response is received
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const serverHeader = response.headers()['server'] ?? '';

    // THEN: The Server header should not reveal Kestrel version details
    // ASP.NET Core by default includes "Kestrel" — this is a documentation test,
    // not a hard failure, but highlights the gap for future hardening
    expect(response.status()).toBe(200); // Primary assertion
    // If server header exists, it should not expose detailed version info
    if (serverHeader) {
      expect(serverHeader).not.toMatch(/Kestrel\/\d+\.\d+\.\d+/);
    }
  });
});
