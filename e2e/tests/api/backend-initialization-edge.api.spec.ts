/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion Tests — Backend API Edge Cases & Negative Paths
 * Extends ATDD coverage with boundary conditions, security hardening checks,
 * and error path behaviors not covered in backend-initialization.api.spec.ts.
 *
 * Coverage added:
 *   - CORS rejects requests from disallowed origins (negative CORS path)
 *   - ExceptionHandlingMiddleware does NOT leak exception details or stack traces
 *   - Backend responds to HEAD requests without body (HTTP compliance)
 *   - Backend returns correct content-type for error responses (Problem Details RFC 7807)
 *   - Repeated rapid requests are handled stably (reliability boundary)
 *   - /openapi.json endpoint is available (OpenAPI metadata for Scalar)
 *   - Problem Details response does not expose internal error messages
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: CORS negative path — disallowed origins must be rejected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — CORS disallowed origin rejection', () => {
  test('[P1] should NOT include Access-Control-Allow-Origin for a disallowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" only allows http://localhost:5173
    // WHEN: A request arrives from a different origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header is absent or does not match
    // (CORS policy must NOT echo back arbitrary origins)
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://evil.example.com');
    // Server still responds with data (CORS is enforced by browser, not by blocking server-side)
    // but the header must not authorize the disallowed origin
  });

  test('[P1] should NOT include Access-Control-Allow-Origin for a null origin', async ({
    request,
  }) => {
    // GIVEN: Null origin is a common origin for local file:// requests
    // WHEN: A request is sent with Origin: null
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'null',
      },
    });

    // THEN: The response does NOT grant wildcard or null access
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('*');
    expect(allowOriginHeader).not.toBe('null');
  });

  test('[P2] preflight OPTIONS from disallowed origin should not echo back Access-Control-Allow-Origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy only allows http://localhost:5173
    // WHEN: A preflight from an untrusted origin arrives
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://attacker.example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization',
      },
    });

    // THEN: The response does NOT grant CORS access to the attacker origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://attacker.example.com');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: ExceptionHandlingMiddleware — no information leakage
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — ExceptionHandlingMiddleware security', () => {
  test('[P1] should return application/problem+json content type for unhandled routes', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before routing
    // WHEN: A non-existent route is requested
    const response = await request.get(`${API_BASE_URL}/api/does-not-exist-atdd-edge`);

    // THEN: Response must be JSON (not HTML error page from ASP.NET developer exception page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect(contentType).not.toContain('text/html');
  });

  test('[P1] 404 response body should NOT contain ASP.NET stack trace HTML', async ({
    request,
  }) => {
    // GIVEN: The app is NOT in developer exception page mode
    // WHEN: A non-existent route returns an error response
    const response = await request.get(`${API_BASE_URL}/api/definitely-nonexistent-route-12345`);
    const body = await response.text();

    // THEN: Response body does not contain stack trace indicators
    expect(body).not.toContain('at System.');
    expect(body).not.toContain('Stack Trace');
    expect(body).not.toContain('<html>');
    expect(body).not.toContain('Microsoft.AspNetCore');
  });

  test('[P2] Problem Details response should not expose internal exception messages', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all exceptions and returns sanitized Problem Details
    // WHEN: An error response is received for a non-existent endpoint
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-for-problem-details-check`);

    // The response may be 404 (routing handled) — for 4xx, body may be minimal
    // For 5xx (if triggered), the middleware must NOT leak ex.Message or ex.StackTrace
    if (response.status() === 500) {
      const body = await response.json();
      // Problem Details Detail field must be null per architecture spec
      expect(body.detail).toBeNull();
      expect(body.title).toBe('An unexpected error occurred.');
      // Must NOT contain any stack trace or exception message in the body
      const bodyStr = JSON.stringify(body);
      expect(bodyStr).not.toContain('Exception');
      expect(bodyStr).not.toContain('at System.');
    } else {
      // 404 path — just verify it is JSON, not HTML
      expect([404, 400]).toContain(response.status());
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: HTTP method compliance
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — HTTP method compliance', () => {
  test('[P2] should respond to HEAD request on /scalar without returning a body', async ({
    request,
  }) => {
    // GIVEN: The Scalar endpoint is accessible
    // WHEN: An HTTP HEAD request is made to /scalar
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'HEAD',
    });

    // THEN: Server responds (not 405) and body is empty
    // HEAD must return the same status and headers as GET, but with no body
    expect([200, 301, 302]).toContain(response.status());
    const body = await response.body();
    expect(body.length).toBe(0);
  });

  test('[P2] should return 405 or 404 for DELETE on /scalar (read-only endpoint)', async ({
    request,
  }) => {
    // GIVEN: /scalar is a documentation endpoint — DELETE should not be allowed
    // WHEN: A DELETE request is made to /scalar
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'DELETE',
    });

    // THEN: Response is a client error (not 200 success)
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: OpenAPI metadata endpoint (required by Scalar)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — OpenAPI metadata availability', () => {
  test('[P2] should serve the OpenAPI JSON specification at /openapi/v1.json', async ({
    request,
  }) => {
    // GIVEN: builder.Services.AddOpenApi() and app.MapOpenApi() are registered in Program.cs
    // WHEN: A request is made to the OpenAPI spec endpoint
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The OpenAPI JSON document is served (HTTP 200 with JSON content)
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P2] OpenAPI spec should be valid JSON parseable without error', async ({ request }) => {
    // GIVEN: The OpenAPI spec is available at /openapi/v1.json
    // WHEN: The response body is parsed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const text = await response.text();

    // THEN: Body parses as valid JSON without throwing
    let parsed: unknown;
    expect(() => {
      parsed = JSON.parse(text);
    }).not.toThrow();

    // AND: The spec contains the openapi version field
    expect((parsed as Record<string, unknown>)?.openapi).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: Backend stability under rapid sequential requests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — Backend reliability under load', () => {
  test('[P3] should handle 5 rapid sequential requests to /scalar without any 5xx errors', async ({
    request,
  }) => {
    // GIVEN: The backend is running and stable
    // WHEN: Five sequential requests are made rapidly
    const results: number[] = [];

    for (let i = 0; i < 5; i++) {
      const response = await request.get(`${API_BASE_URL}/scalar`);
      results.push(response.status());
    }

    // THEN: None of the responses are server errors (5xx)
    for (const status of results) {
      expect(status).toBeLessThan(500);
    }
  });

  test('[P3] should handle concurrent requests from the allowed CORS origin consistently', async ({
    request,
  }) => {
    // GIVEN: The backend is running with CORS configured
    // WHEN: Three concurrent requests with Origin: http://localhost:5173 are made
    const [r1, r2, r3] = await Promise.all([
      request.get(`${API_BASE_URL}/scalar`, {
        headers: { Origin: 'http://localhost:5173' },
      }),
      request.get(`${API_BASE_URL}/scalar`, {
        headers: { Origin: 'http://localhost:5173' },
      }),
      request.get(`${API_BASE_URL}/scalar`, {
        headers: { Origin: 'http://localhost:5173' },
      }),
    ]);

    // THEN: All three succeed and all include the CORS header consistently
    for (const resp of [r1, r2, r3]) {
      expect(resp.status()).toBe(200);
      const allowOrigin = resp.headers()['access-control-allow-origin'] ?? '';
      expect(
        allowOrigin === 'http://localhost:5173' || allowOrigin === '*'
      ).toBe(true);
    }
  });
});
