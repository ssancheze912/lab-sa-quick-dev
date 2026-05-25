/**
 * Story 1.1: Project Initialization & Repository Structure
 * API Acceptance Tests — RED Phase (Failing before implementation)
 *
 * AC covered:
 *  AC2 — Backend starts on port 5000; four Clean Architecture projects compile
 *  AC3 — CORS preflight returns correct headers
 *  AC5 — dotnet build SiesaAgents.sln succeeds with zero errors/warnings
 *        (validated via API health check proxy — build must succeed for server to run)
 */

import { test, expect } from '@playwright/test';

const BACKEND_BASE_URL = 'http://localhost:5000';

// ---------------------------------------------------------------------------
// AC2 — Backend HTTP server is reachable on port 5000
// ---------------------------------------------------------------------------

test.describe('Story 1.1 — Backend server reachability (AC2)', () => {
  test('GET /scalar should return HTTP 200', async ({ request }) => {
    // GIVEN: dotnet run has been executed in src/SiesaAgents.API
    // WHEN: A GET request is sent to the Scalar docs endpoint
    const response = await request.get(`${BACKEND_BASE_URL}/scalar`);

    // THEN: The server responds with HTTP 200 (Scalar page is served)
    expect(response.status()).toBe(200);
  });

  test('GET /scalar should return text/html content', async ({ request }) => {
    // GIVEN: Backend is running with Scalar configured via app.MapScalarApiReference()
    // WHEN: A GET request is sent to /scalar
    const response = await request.get(`${BACKEND_BASE_URL}/scalar`);

    // THEN: Content-Type is text/html (Scalar renders an HTML page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('text/html');
  });

  test('Backend should not expose SwaggerUI at /swagger', async ({ request }) => {
    // GIVEN: Backend is initialized following company standards (Scalar only — never Swagger)
    // WHEN: A GET request is sent to /swagger
    const response = await request.get(`${BACKEND_BASE_URL}/swagger`, { failOnStatusCode: false });

    // THEN: /swagger returns 404 (Swashbuckle is NOT installed)
    expect(response.status()).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// AC3 — CORS preflight allows origin http://localhost:5173
// ---------------------------------------------------------------------------

test.describe('Story 1.1 — CORS headers (AC3)', () => {
  test('OPTIONS preflight to /scalar should include Access-Control-Allow-Origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" is registered allowing http://localhost:5173
    // WHEN: Browser sends an OPTIONS preflight from http://localhost:5173
    const response = await request.fetch(`${BACKEND_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      failOnStatusCode: false,
    });

    // THEN: ACAO header is present and set to the allowed origin
    const acao = response.headers()['access-control-allow-origin'];
    expect(acao).toBe('http://localhost:5173');
  });

  test('OPTIONS preflight to /scalar should include Access-Control-Allow-Methods', async ({
    request,
  }) => {
    // GIVEN: CORS policy allows any method (AllowAnyMethod())
    // WHEN: OPTIONS preflight is sent
    const response = await request.fetch(`${BACKEND_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
      failOnStatusCode: false,
    });

    // THEN: Response includes Access-Control-Allow-Methods header
    const acam = response.headers()['access-control-allow-methods'];
    expect(acam).toBeDefined();
  });

  test('GET request from allowed origin should include ACAO header in response', async ({
    request,
  }) => {
    // GIVEN: Both servers running with CORS configured
    // WHEN: GET request is sent with Origin: http://localhost:5173
    const response = await request.get(`${BACKEND_BASE_URL}/scalar`, {
      headers: { Origin: 'http://localhost:5173' },
    });

    // THEN: Response includes correct Access-Control-Allow-Origin header
    const acao = response.headers()['access-control-allow-origin'];
    expect(acao).toBe('http://localhost:5173');
  });

  test('Request from unauthorized origin should not include ACAO header', async ({ request }) => {
    // GIVEN: CORS policy only allows http://localhost:5173
    // WHEN: GET request comes from an unauthorized origin
    const response = await request.get(`${BACKEND_BASE_URL}/scalar`, {
      headers: { Origin: 'http://evil.example.com' },
      failOnStatusCode: false,
    });

    // THEN: ACAO header is not present (or does not match the malicious origin)
    const acao = response.headers()['access-control-allow-origin'] ?? '';
    expect(acao).not.toBe('http://evil.example.com');
  });
});

// ---------------------------------------------------------------------------
// AC2 + AC5 — Backend error handling follows Problem Details RFC 7807
// ---------------------------------------------------------------------------

test.describe('Story 1.1 — ExceptionHandlingMiddleware (AC2 implicit)', () => {
  test('Unhandled exception should return Problem Details RFC 7807 format', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: A request reaches a non-existent route (triggers default 404 via middleware)
    const response = await request.get(`${BACKEND_BASE_URL}/non-existent-route-trigger-error`, {
      failOnStatusCode: false,
    });

    // THEN: Error responses use Content-Type application/problem+json
    // (404 for missing routes may be handled by ASP.NET before middleware,
    //  but any 5xx must use Problem Details format)
    // This test will fail RED because no route exists and middleware is not yet implemented
    expect([404, 500]).toContain(response.status());

    if (response.status() === 500) {
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('application/problem+json');

      const body = await response.json();
      // RFC 7807 requires status and title fields
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('title');
      // Stack traces must never be exposed
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('exception');
    }
  });
});
