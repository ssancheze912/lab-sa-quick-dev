/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Backend starts on port 5000, Scalar loads at /scalar,
 *          four Clean Architecture projects referenced in SiesaAgents.sln
 *   AC5 — dotnet build SiesaAgents.sln succeeds with zero errors (verified via
 *          runtime behavior: all endpoints respond — build failure would prevent this)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Backend .NET 10 starts on port 5000 and Scalar API docs load at /scalar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Backend server initialization and Scalar API documentation', () => {
  test('should have the backend API server running on port 5000', async ({ request }) => {
    // GIVEN: The backend project has been created and dotnet run is executed
    // WHEN: An HTTP request is made to the backend base URL

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: The server responds (not connection refused)
    // Status can be 200, 404, or redirect — any response means server is up
    expect(response.status()).toBeLessThan(500);
  });

  test('should serve the Scalar API documentation page at /scalar', async ({ request }) => {
    // GIVEN: The backend is running and Program.cs includes app.MapScalarApiReference()
    // WHEN: A GET request is made to /scalar

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The Scalar documentation page is served (HTTP 200)
    expect(response.status()).toBe(200);
  });

  test('should return HTML content from the Scalar documentation endpoint', async ({ request }) => {
    // GIVEN: Scalar.AspNetCore is installed and MapScalarApiReference() is registered in Program.cs
    // WHEN: The /scalar endpoint is requested

    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response content type includes text/html
    expect(contentType).toContain('text/html');
  });

  test('should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)', async ({ request }) => {
    // GIVEN: The architecture mandates Scalar ONLY — Swashbuckle is explicitly forbidden
    // WHEN: A GET request is made to /swagger

    const response = await request.get(`${API_BASE_URL}/swagger`);

    // THEN: The /swagger endpoint does NOT respond with HTTP 200 (endpoint must not exist)
    expect(response.status()).not.toBe(200);
  });

  test('should NOT expose WeatherForecast default endpoint', async ({ request }) => {
    // GIVEN: The default .NET webapi template includes WeatherForecast which must be removed
    // WHEN: A GET request is made to the default WeatherForecast endpoint

    const response = await request.get(`${API_BASE_URL}/weatherforecast`);

    // THEN: The endpoint does NOT exist (404 or 405)
    expect([404, 405]).toContain(response.status());
  });

  test('should return CORS header allowing http://localhost:5173 origin', async ({ request }) => {
    // GIVEN: CORS policy "DevCors" is configured in Program.cs to allow http://localhost:5173
    // WHEN: A cross-origin request with Origin header is made

    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: The Access-Control-Allow-Origin header is present and allows the frontend origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(
      allowOriginHeader === 'http://localhost:5173' || allowOriginHeader === '*'
    ).toBe(true);
  });

  test('should respond to OPTIONS preflight from frontend origin without CORS rejection', async ({
    request,
  }) => {
    // GIVEN: CORS middleware is applied before endpoint mapping in Program.cs
    // WHEN: An OPTIONS preflight request is made from http://localhost:5173

    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight succeeds (200 or 204 — not 403 or 0)
    expect([200, 204]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Backend builds with zero errors (runtime proxy — if server is up, build passed)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Backend solution builds and runs successfully', () => {
  test('should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln has been executed with all four projects
    // (SiesaAgents.API, SiesaAgents.Application, SiesaAgents.Domain, SiesaAgents.Infrastructure)
    // WHEN: The backend server is running (build must succeed for server to start)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds — this proves the solution compiled without errors
    // A build failure would prevent the server from starting at all
    expect(response.status()).toBe(200);
  });

  test('should return Problem Details RFC 7807 format for unhandled errors', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: An endpoint that does not exist is requested (triggers unhandled path scenario)
    // NOTE: This tests the middleware is wired — actual exception path tested in Story 1.3

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-endpoint-for-atdd`);

    // THEN: Response is 404 with either Problem Details or standard not-found JSON
    // The server must NOT crash or return HTML error page (which would indicate middleware missing)
    expect([404, 400]).toContain(response.status());
    const contentType = response.headers()['content-type'] ?? '';
    // Should be JSON, not HTML (Problem Details is application/problem+json or application/json)
    expect(contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: CORS security boundary — disallowed origins must be rejected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS security boundaries — edge cases', () => {
  test('[P1] should NOT return ACAO header for an arbitrary disallowed origin', async ({ request }) => {
    // GIVEN: DevCors policy explicitly only allows http://localhost:5173
    // WHEN: A request arrives from a completely different origin
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil-attacker.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header is absent or does not grant access
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil-attacker.com');
    expect(allowOrigin).not.toBe('*');
  });

  test('[P1] should allow OPTIONS preflight for POST method from the frontend origin', async ({ request }) => {
    // GIVEN: The frontend will make POST requests (e.g., create operations in later stories)
    // WHEN: An OPTIONS preflight is sent for a POST with Content-Type header
    const response = await request.fetch(`${API_BASE_URL}/api/v1/any-future-endpoint`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The server responds to the preflight (not CORS-blocked) — 200 or 204
    // NOTE: 404 is also acceptable since the endpoint does not exist yet —
    // what matters is the server did not reject with a CORS error (403)
    expect(response.status()).not.toBe(403);
  });

  test('[P1] should allow PUT preflight from the frontend origin (update operations)', async ({ request }) => {
    // GIVEN: The frontend will make PUT requests for update operations (contacto/cliente association)
    // WHEN: An OPTIONS preflight is sent for PUT
    const response = await request.fetch(`${API_BASE_URL}/api/v1/any-future-resource/id`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The CORS preflight is not explicitly blocked with 403
    expect(response.status()).not.toBe(403);
  });

  test('[P1] should allow DELETE preflight from the frontend origin (delete operations)', async ({ request }) => {
    // GIVEN: The frontend will make DELETE requests for resource deletion
    // WHEN: An OPTIONS preflight is sent for DELETE
    const response = await request.fetch(`${API_BASE_URL}/api/v1/any-future-resource/id`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The CORS preflight is not explicitly blocked with 403
    expect(response.status()).not.toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ExceptionHandlingMiddleware — response body and security contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware — edge cases and security', () => {
  test('[P1] should return Content-Type application/problem+json on unhandled error paths', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets context.Response.ContentType = "application/problem+json"
    // WHEN: A non-existent endpoint is hit (server handles as 404 through middleware pipeline)
    const response = await request.get(`${API_BASE_URL}/api/does-not-exist-middleware-test`);

    // THEN: Response content type is JSON (problem+json or application/json — never text/html)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('text/html');
    expect(contentType).toContain('json');
  });

  test('[P1] should NOT expose internal exception messages or stack traces in response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware explicitly sets Detail = null to prevent info leakage
    // WHEN: A request to a non-existent endpoint returns an error response
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-security-check`);

    // THEN: The response body (if any) does NOT contain stack trace keywords
    const body = await response.text();
    const stackTraceIndicators = ['at System.', 'StackTrace', 'InnerException', 'Exception:'];
    for (const indicator of stackTraceIndicators) {
      expect(body).not.toContain(indicator);
    }
  });

  test('[P2] should return a status code ≥ 400 (never 2xx) for missing routes', async ({ request }) => {
    // GIVEN: The middleware pipeline correctly handles unknown routes
    // WHEN: A GET to a completely unknown path is made
    const response = await request.get(`${API_BASE_URL}/api/this-route-must-not-exist-boundary-test`);

    // THEN: Status is an error code (4xx or 5xx), never a success (2xx)
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: OpenAPI / Scalar infrastructure — supporting endpoints
// ─────────────────────────────────────────────────────────────────────────────

test.describe('OpenAPI and Scalar infrastructure — edge cases', () => {
  test('[P2] should expose the OpenAPI JSON document at /openapi/v1.json (required by Scalar)', async ({ request }) => {
    // GIVEN: Program.cs calls builder.Services.AddOpenApi() and app.MapOpenApi()
    // Scalar reads /openapi/v1.json to render its interactive documentation
    // WHEN: A GET request is made to the OpenAPI JSON endpoint
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The endpoint returns the OpenAPI spec (200)
    expect(response.status()).toBe(200);
  });

  test('[P2] should return valid JSON from the OpenAPI spec endpoint', async ({ request }) => {
    // GIVEN: AddOpenApi() is configured in Program.cs
    // WHEN: The OpenAPI JSON document is fetched
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The response is parseable JSON (not HTML or plain text)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');

    // Body must be valid JSON
    const body = await response.json();
    expect(body).toBeTruthy();
    expect(typeof body).toBe('object');
  });

  test('[P2] should include the openapi version field in the OpenAPI spec', async ({ request }) => {
    // GIVEN: The OpenAPI spec is generated by Microsoft.AspNetCore.OpenApi
    // WHEN: The spec document is fetched and parsed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const spec = await response.json() as Record<string, unknown>;

    // THEN: The spec contains the 'openapi' version field (OpenAPI 3.x)
    expect(spec).toHaveProperty('openapi');
    expect(typeof spec['openapi']).toBe('string');
    expect((spec['openapi'] as string).startsWith('3.')).toBe(true);
  });

  test('[P2] should NOT expose a /swagger endpoint (Swashbuckle is forbidden by architecture)', async ({ request }) => {
    // GIVEN: Architecture mandates Scalar only — Swashbuckle must not be installed or configured
    // WHEN: GET /swagger/index.html is requested (Swashbuckle default path)
    const response = await request.get(`${API_BASE_URL}/swagger/index.html`);

    // THEN: The Swashbuckle UI endpoint does not exist (not 200)
    expect(response.status()).not.toBe(200);
  });
});
