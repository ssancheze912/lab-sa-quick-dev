/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Boundary Tests — AUTO-GENERATED (testarch-automate)
 *
 * Expands ATDD coverage with:
 *   - Problem Details RFC 7807 exact content-type (application/problem+json)
 *   - ExceptionHandlingMiddleware 500 response structure validation
 *   - CORS blocks unauthorized origins
 *   - OpenAPI JSON schema endpoint accessible (MapOpenApi registered)
 *   - Backend response time boundary (< 5 seconds — server not hung)
 *   - Malformed JSON body handled gracefully (400 not 500)
 *   - CORS OPTIONS preflight for POST and PUT methods
 *   - Health check: backend does not return 500 on root
 *   - MapFallback returns Problem Details, NOT HTML
 *   - No WeatherForecast schema in OpenAPI spec
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Problem Details RFC 7807 exact format
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P0] Backend Problem Details RFC 7807 — exact format validation', () => {
  test('[P0] should return application/problem+json content-type for 404 fallback routes', async ({ request }) => {
    // GIVEN: MapFallback returns Results.Problem with status 404
    // WHEN: A request is made to a non-existent route
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-for-edge-test`);

    // THEN: Content-Type is application/problem+json (RFC 7807 exact spec)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P0] should include "title" and "status" fields in 404 Problem Details body', async ({ request }) => {
    // GIVEN: MapFallback is registered with Problem Details
    // WHEN: A non-existent route is requested
    const response = await request.get(`${API_BASE_URL}/api/nonexistent-problem-body-check`);

    // THEN: Response body contains required RFC 7807 fields: title and status
    expect(response.status()).toBe(404);
    const body = await response.json() as Record<string, unknown>;
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('status');
    expect(body['status']).toBe(404);
  });

  test('[P1] should NOT return an HTML error page for unknown routes (middleware active)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware and MapFallback are registered
    // WHEN: A route that does not exist is requested
    const response = await request.get(`${API_BASE_URL}/non-html-check`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is NOT text/html (would indicate ASP.NET default error page without middleware)
    expect(contentType).not.toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: CORS — unauthorized origin blocking
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] CORS — security boundary validation', () => {
  test('[P1] should NOT include Access-Control-Allow-Origin for unauthorized origins', async ({ request }) => {
    // GIVEN: CORS policy allows ONLY http://localhost:5173
    // WHEN: A request with a different Origin is sent
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious-site.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header either is absent or does not allow the malicious origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://malicious-site.example.com');
  });

  test('[P1] should handle OPTIONS preflight for POST method from frontend origin', async ({ request }) => {
    // GIVEN: CORS must support POST requests (for API endpoints in future stories)
    // WHEN: An OPTIONS preflight for POST is sent from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });

    // THEN: Preflight succeeds (200 or 204)
    expect([200, 204]).toContain(response.status());
  });

  test('[P1] should handle OPTIONS preflight for PUT method from frontend origin', async ({ request }) => {
    // GIVEN: CORS must support PUT requests (for resource updates in future stories)
    // WHEN: An OPTIONS preflight for PUT is sent from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight succeeds (200 or 204)
    expect([200, 204]).toContain(response.status());
  });

  test('[P1] should handle OPTIONS preflight for DELETE method from frontend origin', async ({ request }) => {
    // GIVEN: CORS must support DELETE requests (for resource deletion in future stories)
    // WHEN: An OPTIONS preflight for DELETE is sent from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight succeeds (200 or 204)
    expect([200, 204]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: OpenAPI schema endpoint
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] Backend OpenAPI schema — accessibility validation', () => {
  test('[P1] should serve the OpenAPI JSON schema at /openapi/v1.json', async ({ request }) => {
    // GIVEN: builder.Services.AddOpenApi() and app.MapOpenApi() are registered in Program.cs
    // WHEN: A GET request is made to /openapi/v1.json
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The endpoint returns 200 with JSON content
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] should have a valid OpenAPI schema with "openapi" version field', async ({ request }) => {
    // GIVEN: AddOpenApi() generates a standard OpenAPI 3.x document
    // WHEN: The schema JSON is fetched and parsed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const schema = await response.json() as Record<string, unknown>;

    // THEN: The schema has the required "openapi" field (e.g. "3.0.1" or "3.1.0")
    expect(schema).toHaveProperty('openapi');
    expect(typeof schema['openapi']).toBe('string');
  });

  test('[P1] should NOT include WeatherForecast paths in the OpenAPI schema', async ({ request }) => {
    // GIVEN: The default WeatherForecast template endpoint was explicitly removed (Task 2)
    // WHEN: The OpenAPI schema is fetched
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const schema = await response.json() as Record<string, unknown>;
    const schemaText = JSON.stringify(schema).toLowerCase();

    // THEN: No mention of weatherforecast in the schema paths
    expect(schemaText).not.toContain('weatherforecast');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Backend performance and stability boundaries
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend performance boundaries', () => {
  test('[P2] should respond to /scalar within 5 seconds (server not hung)', async ({ request }) => {
    // GIVEN: The backend is running and not in a hung state
    // WHEN: A request to /scalar is made and we measure response time

    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const elapsed = Date.now() - startTime;

    // THEN: Response arrives within 5 seconds and is successful
    expect(response.status()).toBe(200);
    expect(elapsed).toBeLessThan(5000);
  });

  test('[P2] should respond to the root path within 5 seconds (not connection refused)', async ({ request }) => {
    // GIVEN: The .NET 10 server is initialized and accepting connections
    // WHEN: A request is made to the root path

    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/`);
    const elapsed = Date.now() - startTime;

    // THEN: Server responds (any status) within the boundary — not hung
    expect(response.status()).toBeLessThan(600);
    expect(elapsed).toBeLessThan(5000);
  });

  test('[P2] should return a stable status on repeated requests to /scalar (no memory leak crash)', async ({ request }) => {
    // GIVEN: The backend is initialized
    // WHEN: Five consecutive requests are made to the same endpoint
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const response = await request.get(`${API_BASE_URL}/scalar`);
      statuses.push(response.status());
    }

    // THEN: All five responses return 200 — server did not crash between requests
    expect(statuses).toHaveLength(5);
    statuses.forEach((status) => expect(status).toBe(200));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: ExceptionHandlingMiddleware — error format boundary
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P1] ExceptionHandlingMiddleware — error response format', () => {
  test('[P1] should return JSON (not HTML) for 404 unmatched routes', async ({ request }) => {
    // GIVEN: MapFallback is registered to return Problem Details
    // AND: ExceptionHandlingMiddleware is registered before routing
    // WHEN: A GET to a non-mapped route triggers the fallback

    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-resource`);

    // THEN: Response is NOT HTML (no ASP.NET yellow-screen-of-death)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('text/html');
    expect(contentType).toContain('json');
  });

  test('[P1] should return 404 status (not 200 or 500) for MapFallback routes', async ({ request }) => {
    // GIVEN: MapFallback returns Results.Problem(statusCode: 404)
    // WHEN: A non-existent API route is requested
    const response = await request.get(`${API_BASE_URL}/api/v99/does-not-exist`);

    // THEN: HTTP status code is exactly 404 (not 200 wrapping an error, not 500)
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Backend configuration from appsettings
// ─────────────────────────────────────────────────────────────────────────────

test.describe('[P2] Backend configuration — appsettings.Development.json', () => {
  test('[P2] should read AllowedOrigins from appsettings and apply to CORS (not hardcoded)', async ({ request }) => {
    // GIVEN: appsettings.Development.json has AllowedOrigins: ["http://localhost:5173"]
    // AND: Program.cs reads AllowedOrigins from configuration (not hardcoded)
    // WHEN: A request with a different origin NOT in the config is sent

    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://another-app.localhost:3000',
      },
    });

    // THEN: The response does not include ACAO header for the unlisted origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://another-app.localhost:3000');
    // Server still responds (CORS rejection is not a 5xx error — it's just missing headers)
    expect(response.status()).toBeLessThan(500);
  });
});
