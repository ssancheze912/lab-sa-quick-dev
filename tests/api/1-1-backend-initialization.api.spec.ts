/**
 * Story 1.1: Project Initialization & Repository Structure
 * API Tests — RED phase (all tests must fail until implementation is complete)
 *
 * AC2: Backend starts on port 5000, Scalar docs at /scalar, Clean Architecture projects linked
 * AC3: CORS allows requests from http://localhost:5173
 * AC5: dotnet build succeeds (validated indirectly — if server is up, build succeeded)
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_ORIGIN = 'http://localhost:5173';

test.describe('Story 1.1 — Backend Initialization', () => {
  /**
   * AC2 — Given the backend project has been created,
   *        When the developer runs `dotnet run` in SiesaAgents.API,
   *        Then the backend starts on port 5000
   */
  test('AC2 — backend responds on port 5000 (HTTP reachability)', async ({ request }) => {
    // GIVEN: The .NET 10 backend is expected to be running on port 5000
    // WHEN: Making an HTTP GET to the root of the backend
    const response = await request.get(`${BACKEND_URL}/`);

    // THEN: Server responds (any 2xx or 4xx is acceptable — 404 means it is up)
    expect([200, 301, 302, 404].includes(response.status())).toBe(true);
  });

  test('AC2 — Scalar API documentation page loads at /scalar', async ({ request }) => {
    // GIVEN: The backend is running on port 5000 with Scalar configured
    // WHEN: Making an HTTP GET request to /scalar
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: The response is HTTP 200 (Scalar page served successfully)
    expect(response.status()).toBe(200);
  });

  test('AC2 — Scalar page returns HTML content (not JSON or plain text)', async ({ request }) => {
    // GIVEN: The backend is running with app.MapScalarApiReference() wired
    // WHEN: Requesting the Scalar documentation page
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: The Content-Type header indicates HTML
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('AC2 — default WeatherForecast endpoint has been removed', async ({ request }) => {
    // GIVEN: The backend was created from `dotnet new webapi` template
    // WHEN: Requesting the default scaffolded WeatherForecast endpoint
    const response = await request.get(`${BACKEND_URL}/weatherforecast`);

    // THEN: 404 — scaffolded endpoint was removed per story tasks
    expect(response.status()).toBe(404);
  });

  /**
   * AC3 — Given both servers are running,
   *        When the frontend makes any HTTP request to http://localhost:5000,
   *        Then CORS allows requests from http://localhost:5173 without errors
   */
  test('AC3 — backend returns CORS header allowing frontend origin on GET request', async ({ request }) => {
    // GIVEN: Both servers are running
    // WHEN: Sending a preflight-equivalent GET with Origin header from frontend origin
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: {
        Origin: FRONTEND_ORIGIN,
      },
    });

    // THEN: Access-Control-Allow-Origin matches frontend origin (or wildcard)
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(
      allowOrigin === FRONTEND_ORIGIN || allowOrigin === '*'
    ).toBe(true);
  });

  test('AC3 — backend handles CORS preflight OPTIONS request with 204 or 200', async ({ request }) => {
    // GIVEN: Both servers are running and CORS policy is registered
    // WHEN: Browser sends OPTIONS preflight for a cross-origin POST
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight is accepted (204 No Content or 200 OK)
    expect([200, 204].includes(response.status())).toBe(true);
  });

  test('AC3 — CORS preflight response includes Access-Control-Allow-Methods header', async ({ request }) => {
    // GIVEN: CORS policy allows any method (AllowAnyMethod)
    // WHEN: Sending OPTIONS preflight
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Access-Control-Allow-Methods header is present
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    expect(allowMethods.length).toBeGreaterThan(0);
  });

  /**
   * AC5 — Given the backend solution is initialized,
   *        When `dotnet build SiesaAgents.sln` is executed,
   *        Then all four projects compile successfully with zero errors or warnings
   *
   * Validated indirectly: if the server responds at all, the build was successful.
   * The direct build test is in the CI pipeline (see test execution commands).
   */
  test('AC5 — backend health check implies successful dotnet build (server is running)', async ({ request }) => {
    // GIVEN: `dotnet build SiesaAgents.sln` must succeed before `dotnet run`
    // WHEN: The server is reachable
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: HTTP 200 — server started, which requires successful build of all 4 projects
    expect(response.status()).toBe(200);
  });

  test('AC5 — error responses use Problem Details RFC 7807 format (ExceptionHandlingMiddleware)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: A request triggers an unhandled exception (simulate with invalid route payload)
    // NOTE: We test the format on a known 404 scenario for now; full exception path is tested in Story 1.3
    const response = await request.get(`${BACKEND_URL}/api/nonexistent-endpoint-that-does-not-exist`);

    // THEN: Response is 404 but Content-Type is problem+json (middleware applies to all errors)
    // If middleware is NOT set up, this will return text/plain or HTML — test will fail (RED)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });
});
