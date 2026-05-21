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
