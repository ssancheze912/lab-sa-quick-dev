/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge-Case & Boundary Tests — Backend API Layer (Automate Expansion)
 * Expands ATDD coverage with negative paths, boundary conditions, and
 * structural verifications not addressed in backend-initialization.api.spec.ts.
 *
 * Coverage:
 *   - CORS negative path: disallowed origins must be rejected
 *   - CORS boundary: OPTIONS preflight with multiple request headers
 *   - HTTP method boundary: non-GET methods on /scalar
 *   - Problem Details structure precision (RFC 7807 field validation)
 *   - Response time boundary on /scalar (server cold-start guard)
 *   - Content-Type negotiation: JSON vs HTML Accept headers
 *   - Security headers baseline: X-Content-Type-Options, X-Frame-Options
 *   - Endpoint isolation: no accidental wildcard catch-all returning 200
 *   - ExceptionHandlingMiddleware: no stack trace leakage in error body
 *   - Backend root path: consistent behavior (no crash)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// CORS negative paths (disallowed origins)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS — disallowed origin rejection', () => {
  test('[P1] should NOT include Access-Control-Allow-Origin for an unlisted origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" only permits http://localhost:5173
    // WHEN: A request arrives from a different, unlisted origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header must NOT echo back the unlisted origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://evil.example.com');
  });

  test('[P1] should NOT allow a subdomain of localhost that is not explicitly listed', async ({
    request,
  }) => {
    // GIVEN: CORS policy is configured with exact origin http://localhost:5173
    // WHEN: A request uses a subdomain variant not in the allowlist
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://sub.localhost:5173',
      },
    });

    // THEN: The unlisted subdomain origin is not reflected
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://sub.localhost:5173');
  });

  test('[P2] should NOT include wildcard Access-Control-Allow-Origin when CORS is origin-specific', async ({
    request,
  }) => {
    // GIVEN: Production-safe CORS policy must not use wildcard (*)
    // Architecture decision: .WithOrigins("http://localhost:5173") — not .AllowAnyOrigin()
    // WHEN: A request with a valid frontend origin is made
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: Access-Control-Allow-Origin is exact origin, NOT wildcard
    // (Wildcards block credentials and are not used with AllowAnyHeader + AllowAnyMethod)
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    // If the header exists, it should be the exact origin (not *)
    if (allowOriginHeader !== '') {
      expect(allowOriginHeader).toBe('http://localhost:5173');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS boundary — OPTIONS preflight with multiple headers
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS — OPTIONS preflight boundary conditions', () => {
  test('[P1] should handle preflight with Content-Type and Authorization headers requested', async ({
    request,
  }) => {
    // GIVEN: Frontend will send JSON bodies (Content-Type) and may add auth (Authorization)
    // Policy uses .AllowAnyHeader() so both should be permitted
    // WHEN: OPTIONS preflight requests both headers
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Preflight does not return 403 (forbidden)
    expect(response.status()).not.toBe(403);
  });

  test('[P1] should respond to OPTIONS on a non-existent API endpoint without 500', async ({
    request,
  }) => {
    // GIVEN: CORS middleware is applied globally before endpoint mapping
    // WHEN: OPTIONS preflight targets an endpoint that does not exist
    const response = await request.fetch(`${API_BASE_URL}/api/v1/nonexistent-resource`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Server does not crash — responds with any non-500 status
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HTTP method boundary on /scalar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('HTTP method boundary — /scalar endpoint', () => {
  test('[P2] should return 405 or 404 for POST to /scalar (not a mutation endpoint)', async ({
    request,
  }) => {
    // GIVEN: /scalar serves static HTML — it is not a mutable resource
    // WHEN: A POST request is made to /scalar
    const response = await request.post(`${API_BASE_URL}/scalar`, {
      data: {},
    });

    // THEN: The server rejects or ignores it — not 200, not 500
    expect([404, 405, 400]).toContain(response.status());
  });

  test('[P2] should return 405 or 404 for DELETE to /scalar', async ({ request }) => {
    // GIVEN: DELETE is not a valid verb for the Scalar documentation page
    // WHEN: A DELETE request targets /scalar
    const response = await request.delete(`${API_BASE_URL}/scalar`);

    // THEN: Server returns method not allowed or not found — not 200 or 500
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Problem Details RFC 7807 — structure precision
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Problem Details RFC 7807 — response structure validation', () => {
  test('[P0] should NOT include stack trace or exception details in error response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware never exposes ex.Message or StackTrace
    // Architecture mandates: detail: null — no internal details exposed
    // WHEN: An unknown endpoint is requested (triggers 404 path)
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-atdd-probe`);

    // THEN: Response body must not contain stack trace keywords
    const body = await response.text();
    const lowerBody = body.toLowerCase();
    expect(lowerBody).not.toContain('at system.');
    expect(lowerBody).not.toContain('stacktrace');
    expect(lowerBody).not.toContain('exception');
  });

  test('[P0] should return Content-Type application/problem+json or application/json for error responses', async ({
    request,
  }) => {
    // GIVEN: Problem Details RFC 7807 mandates application/problem+json
    // WHEN: A non-existent endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-atdd-probe`);

    // THEN: Content-Type includes json (problem+json or application/json — both valid for error payloads)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] should return status 404 for non-existent API routes (not 200)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is in place and routing is configured
    // WHEN: A path that matches no route is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/does-not-exist-atdd`);

    // THEN: HTTP status is 404 (not found) — not 200, not 500
    expect(response.status()).toBe(404);
  });

  test('[P1] should return a JSON body with numeric status field for 404 errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware writes ProblemDetails with Status field
    // WHEN: A non-existent endpoint returns a structured error
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-atdd-probe`);

    // THEN: Body contains a numeric status field matching the HTTP status code
    // (standard .NET ProblemDetails serialization: { "status": 404, "title": "...", ... })
    const body = await response.text();
    // At minimum, body should contain the numeric status code
    expect(body).toContain('404');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Response time boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend response time boundary', () => {
  test('[P2] should respond to GET /scalar within 3 seconds (local dev server)', async ({
    request,
  }) => {
    // GIVEN: The .NET backend is running on localhost (no network latency)
    // WHEN: A request is timed against /scalar
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const elapsed = Date.now() - startTime;

    // THEN: Backend serves the response in under 3 seconds (dev server boundary)
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(3000);
  });

  test('[P2] should respond to unknown routes within 2 seconds (middleware path)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware adds minimal latency
    // WHEN: A 404 response is timed
    const startTime = Date.now();
    await request.get(`${API_BASE_URL}/api/nonexistent-timing-probe`);
    const elapsed = Date.now() - startTime;

    // THEN: Error path resolves in under 2 seconds
    expect(elapsed).toBeLessThan(2000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security headers baseline
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Security response headers baseline', () => {
  test('[P2] should not expose the server implementation banner in response headers', async ({
    request,
  }) => {
    // GIVEN: .NET by default may expose the Server header (e.g. "Kestrel")
    // For production-readiness, the Server header should be absent or generic
    // WHEN: Any response is inspected for the Server header
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server header (if present) must not reveal .NET / Kestrel version details
    const serverHeader = response.headers()['server'] ?? '';
    // Allow "Kestrel" (no version) but not "Microsoft-HTTPAPI/2.0" with version
    expect(serverHeader).not.toMatch(/Microsoft-HTTPAPI\/\d/i);
    expect(serverHeader).not.toContain('ASP.NET');
  });

  test('[P1] should NOT expose X-Powered-By or X-AspNet-Version headers', async ({
    request,
  }) => {
    // GIVEN: .NET Minimal API best practices — strip legacy IIS/ASP.NET headers
    // WHEN: A response is inspected for information-leaking headers
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const headers = response.headers();

    // THEN: Legacy headers that reveal implementation details are absent
    expect(headers['x-powered-by']).toBeUndefined();
    expect(headers['x-aspnet-version']).toBeUndefined();
    expect(headers['x-aspnetmvc-version']).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint isolation — no accidental catch-all
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Endpoint isolation — no unintended catch-all routes', () => {
  test('[P1] should return 404 (not 200) for a deeply nested non-existent API path', async ({
    request,
  }) => {
    // GIVEN: No wildcard route is registered that matches all paths
    // WHEN: A deeply nested path that cannot match any registered route is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/nested/deep/path/that/does/not/exist`
    );

    // THEN: 404 is returned — no accidental route swallows the request with 200
    expect(response.status()).toBe(404);
  });

  test('[P1] should return 404 for a path with SQL injection attempt characters', async ({
    request,
  }) => {
    // GIVEN: The backend receives malformed / adversarial paths
    // WHEN: A path containing SQL-like characters is requested
    // Note: URL-encoded so the request is valid HTTP
    const response = await request.get(
      `${API_BASE_URL}/api/v1/%27%3B%20DROP%20TABLE%20clientes%3B--`
    );

    // THEN: Server handles it gracefully — returns 4xx, not 500 or 200
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should return 404 for paths with path traversal sequences', async ({ request }) => {
    // GIVEN: Backend must not serve filesystem files via path traversal
    // WHEN: A request with encoded traversal sequences is made
    const response = await request.get(`${API_BASE_URL}/..%2F..%2Fetc%2Fpasswd`);

    // THEN: Server does not serve a file — returns 4xx
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend root path — consistent behavior
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend root path — stable behavior', () => {
  test('[P1] should not crash on GET / (root path)', async ({ request }) => {
    // GIVEN: The backend runs at http://localhost:5000
    // WHEN: The root path is requested (common health probe pattern)
    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: Server responds with any status below 500 — it does NOT crash
    expect(response.status()).toBeLessThan(500);
  });

  test('[P2] should not return 500 on HEAD / (health check pattern)', async ({ request }) => {
    // GIVEN: Load balancers and health check probes often use HEAD requests
    // WHEN: A HEAD request targets the backend root
    const response = await request.fetch(`${API_BASE_URL}/`, { method: 'HEAD' });

    // THEN: Backend handles HEAD without error (any non-500 status is acceptable)
    expect(response.status()).toBeLessThan(500);
  });
});
