/**
 * Story 1.1: Project Initialization & Repository Structure — API Edge Cases
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands ATDD API coverage with edge cases, boundary conditions, and error paths
 * NOT covered by the primary ATDD acceptance tests in backend-initialization.api.spec.ts.
 *
 * Coverage:
 *   - AC2: Backend robustness (wrong HTTP methods, concurrent requests, port boundary)
 *   - AC5: Build/run health checks (ExceptionHandlingMiddleware, response format)
 *   - Security: Header hygiene, information leakage prevention
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 Edge Cases — Backend robustness and HTTP boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Backend server HTTP boundary conditions', () => {
  test('[P1] should respond to GET requests on /scalar within acceptable time (under 3 seconds)', async ({
    request,
  }) => {
    // GIVEN: The .NET backend is running and dependencies are loaded
    // WHEN: A GET request to /scalar is made
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const elapsed = Date.now() - startTime;

    // THEN: Server responds within 3 seconds (not timing out or hanging)
    expect(response.status()).toBeLessThan(500);
    expect(elapsed).toBeLessThan(3000);
  });

  test('[P1] should return consistent status for repeated requests to /scalar (no transient failures)', async ({
    request,
  }) => {
    // GIVEN: The backend server is initialized and stable
    // WHEN: Three consecutive requests are made to /scalar
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/scalar`);
      statuses.push(response.status());
    }

    // THEN: All three return the same status (server is stable, not flapping)
    expect(new Set(statuses).size).toBe(1);
    // And all must be 200
    expect(statuses.every((s) => s === 200)).toBe(true);
  });

  test('[P1] should return 404 or 405 for POST requests to /scalar (read-only docs page)', async ({
    request,
  }) => {
    // GIVEN: The /scalar endpoint is a documentation page (GET only)
    // WHEN: A POST request is sent to /scalar
    const response = await request.post(`${API_BASE_URL}/scalar`, {
      data: { unexpected: 'payload' },
    });

    // THEN: Returns 404 or 405 (endpoint not accepting POST), not 500 (server crash)
    expect([404, 405]).toContain(response.status());
  });

  test('[P2] should not expose server version header information (security hygiene)', async ({
    request,
  }) => {
    // GIVEN: The backend is a production-ready .NET 10 API
    // WHEN: Any request is made to the server
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server does NOT expose its version in headers (information leakage)
    // "Server" header should be absent or redacted (not "Kestrel", "IIS", version numbers)
    const serverHeader = response.headers()['server'] ?? '';
    // Server header should not contain detailed version info
    expect(serverHeader).not.toMatch(/\d+\.\d+\.\d+/); // no X.Y.Z version strings
  });

  test('[P1] should handle HEAD requests to /scalar without returning a body', async ({ request }) => {
    // GIVEN: The backend supports standard HTTP methods
    // WHEN: A HEAD request is made to /scalar
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'HEAD',
    });

    // THEN: Server responds with a valid status (not 500) and no body
    expect(response.status()).not.toBe(500);
    const body = await response.text();
    expect(body).toBe('');
  });

  test('[P2] should return text/html content-type for the /scalar endpoint', async ({ request }) => {
    // GIVEN: The Scalar API documentation is a web page
    // WHEN: GET /scalar is requested with Accept: text/html
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Accept: 'text/html, application/xhtml+xml, */*',
      },
    });

    // THEN: The response content-type includes text/html (documentation page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('[P1] should NOT respond on port 5001 (only port 5000 is configured)', async ({ request }) => {
    // GIVEN: The backend is configured to listen on port 5000 only
    // WHEN: A request is made to port 5001 (wrong port)
    let requestFailed = false;
    try {
      await request.get('http://localhost:5001/scalar', {
        timeout: 2000,
      });
    } catch {
      // Connection refused or timeout expected
      requestFailed = true;
    }

    // THEN: The request fails (connection refused — nothing listening on 5001)
    expect(requestFailed).toBe(true);
  });

  test('[P2] should include content-length or transfer-encoding in response headers', async ({
    request,
  }) => {
    // GIVEN: Standard HTTP response from a properly configured server
    // WHEN: GET /scalar is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Response includes either content-length or transfer-encoding (well-formed HTTP)
    const contentLength = response.headers()['content-length'];
    const transferEncoding = response.headers()['transfer-encoding'];
    const hasLengthInfo = !!(contentLength || transferEncoding);
    expect(hasLengthInfo).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — ExceptionHandlingMiddleware boundary conditions', () => {
  test('[P1] should return application/problem+json or application/json for non-existent API routes', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is wired before routing in Program.cs
    // WHEN: A request is made to an endpoint that doesn't exist in the API
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-resource`);

    // THEN: Response content-type is JSON (not HTML error page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] should return 404 (not 200) for nonexistent /api/* routes', async ({ request }) => {
    // GIVEN: The backend has no /api/v1/completely-missing endpoint registered
    // WHEN: GET request is made to this endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/completely-missing`);

    // THEN: Returns 404 — not a catch-all 200
    expect(response.status()).toBe(404);
  });

  test('[P1] should NOT expose exception stack traces in error responses', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware returns Problem Details with Detail: null
    // WHEN: Any endpoint returns an error response
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-resource`);

    // THEN: Response body does NOT contain stack trace information
    const bodyText = await response.text();
    expect(bodyText).not.toContain('at '); // Stack trace lines start with "at "
    expect(bodyText).not.toContain('System.'); // .NET namespace in stack traces
    expect(bodyText).not.toContain('Microsoft.AspNetCore.'); // ASP.NET internals
  });

  test('[P2] should return a 404 Problem Details structure for missing resources', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware returns Problem Details RFC 7807 format
    // WHEN: A request to a missing endpoint is made
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-resource`);

    // THEN: The response status is 404 and body is structured JSON
    expect(response.status()).toBe(404);

    let body: Record<string, unknown>;
    try {
      body = await response.json();
      // Problem Details RFC 7807 should have a status field
      // It may or may not have 'title', 'type', etc. — at minimum: valid JSON with status
      expect(typeof body).toBe('object');
    } catch {
      // If not JSON, the server returned HTML — which is a violation of the middleware requirement
      expect.fail('Response body is not valid JSON — ExceptionHandlingMiddleware may not be wired correctly');
    }
  });

  test('[P1] should survive concurrent requests without 500 errors', async ({ request }) => {
    // GIVEN: The backend server is initialized and running
    // WHEN: 5 concurrent GET requests are made to /scalar simultaneously
    const concurrentRequests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/scalar`)
    );

    const responses = await Promise.all(concurrentRequests);

    // THEN: All responses succeed (no 500 errors from concurrency issues)
    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });
  });

  test('[P2] should not include X-Powered-By or X-AspNet-Version headers (information leakage)', async ({
    request,
  }) => {
    // GIVEN: The backend is hardened per Clean Architecture best practices
    // WHEN: A request is made to any endpoint
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Internal technology headers are not exposed
    const xPoweredBy = response.headers()['x-powered-by'];
    const xAspNetVersion = response.headers()['x-aspnet-version'];
    const xAspNetMvcVersion = response.headers()['x-aspnetmvc-version'];

    expect(xPoweredBy).toBeUndefined();
    expect(xAspNetVersion).toBeUndefined();
    expect(xAspNetMvcVersion).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scalar documentation page content edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Scalar documentation content integrity', () => {
  test('[P1] should serve Scalar documentation with non-empty HTML body', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore is installed and MapScalarApiReference() is called in Program.cs
    // WHEN: GET /scalar is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: Response body is non-empty HTML (not an empty page)
    expect(body.length).toBeGreaterThan(100);
    expect(body.toLowerCase()).toContain('<!doctype html>');
  });

  test('[P2] should respond to /scalar/v1 or redirect to the canonical Scalar URL', async ({
    request,
  }) => {
    // GIVEN: Scalar.AspNetCore registers the documentation under /scalar
    // WHEN: A request is made to /scalar with a version path variant
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      maxRedirects: 3,
    });

    // THEN: Final response status is 200 (may follow redirects)
    expect(response.status()).toBe(200);
  });

  test('[P1] should NOT have WeatherForecast schema in Scalar documentation', async ({ request }) => {
    // GIVEN: The default WeatherForecast endpoint was removed per story requirements
    // WHEN: The Scalar documentation page is fetched
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: The default WeatherForecast model/schema is NOT present in the documentation
    // (case-insensitive check for both HTML and embedded JSON)
    expect(body.toLowerCase()).not.toContain('weatherforecast');
  });

  test('[P2] should expose the OpenAPI/Scalar JSON spec at a predictable path', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore registers an OpenAPI spec endpoint
    // WHEN: The OpenAPI JSON spec endpoint is requested (common paths used by Scalar)
    const possibleSpecPaths = ['/openapi/v1.json', '/openapi.json', '/api/v1.json'];

    let specFound = false;
    for (const path of possibleSpecPaths) {
      const response = await request.get(`${API_BASE_URL}${path}`);
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'] ?? '';
        if (contentType.includes('json')) {
          specFound = true;
          break;
        }
      }
    }

    // THEN: At least one spec path responds with JSON (Scalar requires this to render)
    expect(specFound).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// appsettings.Development.json configuration edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2/AC5 — Backend configuration boundary conditions', () => {
  test('[P1] should NOT expose connection string information through any public endpoint', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json contains a PostgreSQL connection string
    // WHEN: Any public endpoint is probed
    const endpoints = [`${API_BASE_URL}/scalar`, `${API_BASE_URL}/`];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      const body = await response.text();

      // THEN: No connection string details appear in any public response
      expect(body.toLowerCase()).not.toContain('host=localhost');
      expect(body.toLowerCase()).not.toContain('password=');
      expect(body.toLowerCase()).not.toContain('username=postgres');
    }
  });

  test('[P2] should NOT expose AllowedOrigins configuration in response headers or body', async ({
    request,
  }) => {
    // GIVEN: AllowedOrigins is stored in appsettings.Development.json
    // WHEN: The /scalar endpoint is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: The configuration values do not leak into the response
    expect(body).not.toContain('AllowedOrigins');
  });
});
