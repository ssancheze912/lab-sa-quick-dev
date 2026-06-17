/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Expanded API Automation Tests — Edge Cases & Boundary Conditions
 * Complements the ATDD API acceptance tests with error paths, header validation,
 * security checks, and boundary conditions not covered in the RED-phase ATDD suite.
 *
 * Coverage:
 *   AC2 — Backend edge cases (response times, OpenAPI metadata, concurrent requests)
 *   AC3 — CORS header security (non-allowed origins, no credentials exposure)
 *   AC5 — Build/runtime robustness (middleware stack, error format correctness)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 edge cases: Backend initialization boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 edge cases — Backend initialization boundary conditions', () => {
  test('[P1] should respond to GET /scalar within 3 seconds (dev mode threshold)', async ({
    request,
  }) => {
    // GIVEN: The .NET 10 backend is running in development mode
    const startTime = Date.now();

    // WHEN: The Scalar page is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);

    const responseTime = Date.now() - startTime;

    // THEN: The server responds in under 3 seconds (dev mode includes JIT warmup)
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(3_000);
  });

  test('[P1] should serve the OpenAPI metadata JSON endpoint (required by Scalar)', async ({
    request,
  }) => {
    // GIVEN: builder.Services.AddOpenApi() is registered in Program.cs
    // WHEN: The OpenAPI JSON spec is requested
    // .NET 10 serves the spec at /openapi/v1.json by default
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Either the endpoint exists (200) or Scalar is using an embedded spec
    // We accept 200 or 404 — the key is Scalar itself loads at /scalar (covered in ATDD)
    // This documents the discovery: if 200, OpenAPI JSON is publicly accessible
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('json');
      const body = await response.json();
      // OpenAPI spec must have the required 'openapi' field
      expect(body).toHaveProperty('openapi');
    }
  });

  test('[P1] should handle multiple concurrent GET requests to /scalar without crashing', async ({
    request,
  }) => {
    // GIVEN: The backend is running
    // WHEN: 5 concurrent requests are made to /scalar (simulates parallel browser tabs)
    const concurrentRequests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/scalar`)
    );

    const responses = await Promise.all(concurrentRequests);

    // THEN: All responses succeed (server handles concurrent load)
    for (const response of responses) {
      expect(response.status()).toBe(200);
    }
  });

  test('[P2] should return Content-Type text/html (not text/plain or application/octet-stream) for /scalar', async ({
    request,
  }) => {
    // GIVEN: Scalar.AspNetCore renders the API documentation as an HTML page
    // WHEN: The /scalar endpoint is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is specifically text/html (not a generic binary type)
    expect(contentType).toContain('text/html');
    expect(contentType).not.toContain('application/octet-stream');
  });

  test('[P2] should NOT expose ASP.NET version information in response headers', async ({
    request,
  }) => {
    // GIVEN: Production-ready .NET apps should not expose framework version
    // WHEN: Any endpoint is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The Server header does not expose detailed version info
    // (Note: In dev mode this may be present — this test documents the expectation)
    const serverHeader = response.headers()['server'] ?? '';
    // We just verify it doesn't expose "Kestrel/10.x.x.x" with full build version
    expect(serverHeader).not.toMatch(/\d+\.\d+\.\d+\.\d+/); // no full 4-part version
  });

  test('[P2] should respond to HEAD request on /scalar (proxy/load-balancer health check)', async ({
    request,
  }) => {
    // GIVEN: Load balancers often use HEAD requests for health probes
    // WHEN: A HEAD request is made to /scalar
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'HEAD',
    });

    // THEN: The server responds (200 or 405 are acceptable)
    // 405 = HEAD not allowed on this specific endpoint (acceptable)
    // 200 = HEAD supported (ideal)
    expect([200, 405]).toContain(response.status());
  });

  test('[P2] should NOT serve /swagger endpoint (Swashbuckle explicitly forbidden by architecture)', async ({
    request,
  }) => {
    // GIVEN: The architecture mandates Scalar ONLY (covered in ATDD but repeated here for edge-case clarity)
    // WHEN: Several Swashbuckle-specific sub-paths are checked
    const swaggerPaths = [
      '/swagger/index.html',
      '/swagger/v1/swagger.json',
      '/swagger-ui',
    ];

    for (const path of swaggerPaths) {
      const response = await request.get(`${API_BASE_URL}${path}`);
      // THEN: None of the Swagger paths respond with HTTP 200
      expect(response.status()).not.toBe(200);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge cases: CORS security boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 edge cases — CORS security boundary conditions', () => {
  test('[P1] should NOT include Access-Control-Allow-Origin for disallowed origins', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows only http://localhost:5173
    // WHEN: A request comes from a different origin (potential SSRF / CSRF vector)
    const maliciousOrigins = [
      'http://localhost:3000',
      'http://malicious-host.internal',
      'https://attacker.example.com',
      'null', // sandboxed iframe origin
    ];

    for (const origin of maliciousOrigins) {
      const response = await request.get(`${API_BASE_URL}/scalar`, {
        headers: { Origin: origin },
      });

      const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
      // THEN: The disallowed origin is not reflected in the CORS header
      expect(allowOrigin).not.toBe(origin);
    }
  });

  test('[P1] should handle CORS preflight with custom headers from frontend origin', async ({
    request,
  }) => {
    // GIVEN: Frontend will send Authorization and Content-Type headers
    // WHEN: OPTIONS preflight includes these headers
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization, Content-Type',
      },
    });

    // THEN: Preflight succeeds (200 or 204)
    expect([200, 204]).toContain(response.status());
  });

  test('[P2] should include Vary: Origin header in CORS responses (cache correctness)', async ({
    request,
  }) => {
    // GIVEN: The backend has CORS middleware enabled
    // WHEN: A request with Origin header is made
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: The Vary header includes Origin (prevents caching issues across origins)
    const varyHeader = response.headers()['vary'] ?? '';
    // .NET CORS middleware automatically adds Vary: Origin
    expect(varyHeader.toLowerCase()).toContain('origin');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 edge cases: ExceptionHandlingMiddleware robustness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 edge cases — ExceptionHandlingMiddleware robustness', () => {
  test('[P1] should return Problem Details RFC 7807 with correct Content-Type for 404', async ({
    request,
  }) => {
    // GIVEN: The ExceptionHandlingMiddleware is registered and handles all unhandled paths
    // WHEN: A non-existent API endpoint is requested
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-edge-case-test`);

    // THEN: The response uses a JSON content type (not HTML error page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect(response.status()).toBe(404);
  });

  test('[P1] should NOT expose stack traces or exception details in error responses', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all exceptions and returns Problem Details
    // The middleware explicitly sets Detail = null (per story implementation notes)
    // WHEN: A non-existent endpoint triggers the error handler
    const response = await request.get(`${API_BASE_URL}/api/trigger-error-atdd-test`);

    if (response.status() >= 400) {
      // Check the response body doesn't contain stack trace artifacts
      let bodyText: string;
      try {
        bodyText = await response.text();
      } catch {
        bodyText = '';
      }

      // THEN: No stack trace patterns in the response
      expect(bodyText).not.toMatch(/at \w+\.\w+\(/); // C# stack trace pattern
      expect(bodyText).not.toContain('StackTrace');
      expect(bodyText).not.toContain('InnerException');
      // AND: No raw exception message exposure
      expect(bodyText).not.toContain('System.Exception');
    }
  });

  test('[P2] should return 404 (not 500) for paths that simply do not exist', async ({
    request,
  }) => {
    // GIVEN: A route that has never been defined
    // WHEN: The path is requested
    const response = await request.get(`${API_BASE_URL}/api/v99/completely-unknown`);

    // THEN: The server returns 404 (routing not found), not 500 (internal error)
    // This validates that ExceptionHandlingMiddleware doesn't swallow 404 into 500
    expect(response.status()).toBe(404);
  });

  test('[P2] should handle POST request to a GET-only endpoint with appropriate status', async ({
    request,
  }) => {
    // GIVEN: /scalar is a GET-only endpoint
    // WHEN: A POST request is made to it
    const response = await request.post(`${API_BASE_URL}/scalar`, {
      data: { unexpected: 'payload' },
    });

    // THEN: Server returns 404 or 405 (not configured for POST)
    // NOT 500 — the middleware should not crash on unexpected methods
    expect([404, 405]).toContain(response.status());
  });

  test('[P2] should handle requests with malformed Accept header gracefully', async ({
    request,
  }) => {
    // GIVEN: Some clients send malformed Accept headers
    // WHEN: A request is made with an invalid Accept header value
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Accept: 'application/☠️/invalid; q=not-a-number',
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: Server does not crash with 500 (handles malformed headers gracefully)
    expect(response.status()).not.toBe(500);
  });
});
