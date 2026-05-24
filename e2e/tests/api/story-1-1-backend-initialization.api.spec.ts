/**
 * Story 1.1: Project Initialization & Repository Structure
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API level)
 * Tests are intentionally FAILING until implementation is complete.
 * Covers ONLY the acceptance criteria for Story 1.1 (AC2, AC3, AC5 — backend).
 *
 * AC2 — dotnet run in SiesaAgents.API starts backend on port 5000,
 *        Scalar API documentation page loads at /scalar,
 *        four Clean Architecture projects (API, Application, Domain, Infrastructure)
 *        referenced correctly in SiesaAgents.sln
 * AC3 — CORS allows requests from http://localhost:5173 without errors
 *        (no CORS-related console errors)
 * AC5 — dotnet build SiesaAgents.sln compiles all four projects with zero errors
 *        (validated indirectly via server reachability — build failure prevents startup)
 *
 * Test level: API integration (Playwright request context — no browser required)
 * Pattern: Given-When-Then
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';
const FRONTEND_ORIGIN = 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Backend starts on port 5000 and Scalar API documentation loads at /scalar
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Backend .NET 10 server initialization', () => {
  test('should have the backend API server reachable on port 5000', async ({ request }) => {
    // GIVEN: The .NET 10 backend project has been created and `dotnet run` executed
    //        in src/SiesaAgents.API
    // WHEN: An HTTP GET request is made to the backend root URL
    const response = await request.get(`${BACKEND_URL}/`);

    // THEN: The server responds (any non-connection-error status — 2xx, 3xx, 4xx all mean up)
    // A connection refused error would propagate as an exception, not a status code
    expect(response.status()).toBeLessThan(500);
  });

  test('should serve the Scalar API documentation page at /scalar with HTTP 200', async ({ request }) => {
    // GIVEN: The backend is running with Scalar.AspNetCore package installed
    //        and app.MapScalarApiReference() registered in Program.cs
    // WHEN: A GET request is made to /scalar
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: The Scalar documentation page is served with HTTP 200
    expect(response.status()).toBe(200);
  });

  test('should return HTML content-type from the Scalar documentation endpoint', async ({ request }) => {
    // GIVEN: app.MapScalarApiReference() is wired correctly in Program.cs
    // WHEN: Requesting the /scalar endpoint
    const response = await request.get(`${BACKEND_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response is text/html (Scalar serves an HTML page, not JSON)
    expect(contentType).toContain('text/html');
  });

  test('should NOT expose a /swagger endpoint (Swashbuckle is explicitly forbidden)', async ({ request }) => {
    // GIVEN: The architecture mandates Scalar ONLY — app.UseSwagger() must NOT appear
    // WHEN: A GET request is made to /swagger (Swashbuckle's default path)
    const response = await request.get(`${BACKEND_URL}/swagger`);

    // THEN: The /swagger endpoint does not serve a valid page (must not be HTTP 200)
    expect(response.status()).not.toBe(200);
  });

  test('should NOT expose the default WeatherForecast scaffolding endpoint', async ({ request }) => {
    // GIVEN: The backend was initialized from `dotnet new webapi` template
    //        which generates WeatherForecast endpoints by default
    // WHEN: A GET request is made to /weatherforecast
    const response = await request.get(`${BACKEND_URL}/weatherforecast`);

    // THEN: The scaffolded endpoint has been removed (HTTP 404 or 405)
    expect([404, 405]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: CORS allows requests from http://localhost:5173
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — CORS policy allows cross-origin requests from http://localhost:5173', () => {
  test('should return Access-Control-Allow-Origin header allowing the frontend origin', async ({ request }) => {
    // GIVEN: Both frontend (5173) and backend (5000) servers are running,
    //        and CORS policy "DevCors" is configured in Program.cs with:
    //        .WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()
    // WHEN: An HTTP GET request includes the Origin header from the frontend origin
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: { Origin: FRONTEND_ORIGIN },
    });

    // THEN: The Access-Control-Allow-Origin header is present and matches the frontend origin
    //       (or is a wildcard — though explicit origin is expected per company standards)
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader === FRONTEND_ORIGIN || allowOriginHeader === '*').toBe(true);
  });

  test('should respond to CORS OPTIONS preflight with 200 or 204', async ({ request }) => {
    // GIVEN: CORS middleware is applied BEFORE endpoint mapping in Program.cs
    //        (app.UseCors() before app.MapScalarApiReference())
    // WHEN: A browser sends an OPTIONS preflight for a cross-origin POST request
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The preflight is accepted — HTTP 200 or 204 (not 403 or connection error)
    expect([200, 204]).toContain(response.status());
  });

  test('should include Access-Control-Allow-Methods in the OPTIONS preflight response', async ({ request }) => {
    // GIVEN: CORS policy is configured with .AllowAnyMethod()
    // WHEN: Sending a CORS OPTIONS preflight request
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Access-Control-Allow-Methods header is present and non-empty
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    expect(allowMethods.length).toBeGreaterThan(0);
  });

  test('should allow preflight requests for the Content-Type request header', async ({ request }) => {
    // GIVEN: CORS policy is configured with .AllowAnyHeader()
    // WHEN: OPTIONS preflight includes Access-Control-Request-Headers: Content-Type
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Access-Control-Allow-Headers is present (Content-Type is allowed)
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    expect(allowHeaders.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: dotnet build SiesaAgents.sln succeeds with zero errors
//      (validated indirectly — a running server proves a successful build)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — All four Clean Architecture projects build without errors', () => {
  test('should have the server running — proving SiesaAgents.sln compiled successfully', async ({ request }) => {
    // GIVEN: SiesaAgents.sln references all four projects:
    //        SiesaAgents.API, SiesaAgents.Application, SiesaAgents.Domain, SiesaAgents.Infrastructure
    // WHEN: `dotnet build SiesaAgents.sln` is executed then `dotnet run` starts the server
    //       (build failure prevents server startup entirely)
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: HTTP 200 — server started and is serving Scalar, proving all four projects
    //       compiled without errors (a build failure produces a non-starting process)
    expect(response.status()).toBe(200);
  });

  test('should return Problem Details RFC 7807 format for requests to non-existent endpoints', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    //        (registered BEFORE endpoint mapping per architecture requirements)
    // WHEN: A GET request targets a path that does not exist in the API
    const response = await request.get(`${BACKEND_URL}/api/nonexistent-endpoint-atdd-probe`);

    // THEN: Response body uses application/problem+json or application/json
    //       (NOT text/html which would indicate middleware is missing or HTML error pages)
    //       If middleware is absent, .NET default returns HTML — this test would FAIL (RED)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');

    // AND: HTTP status is an expected error code (not 5xx crash)
    expect([404, 400]).toContain(response.status());
  });
});
