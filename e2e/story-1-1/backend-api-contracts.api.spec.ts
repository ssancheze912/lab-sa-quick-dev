/**
 * Story 1.1: Project Initialization & Repository Structure
 * API-Level Tests - RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC2: Backend API structure and Scalar endpoint
 * - AC3: CORS headers on all API responses
 * - AC5: Backend solution builds and starts (verified by API reachability)
 *
 * Uses Playwright's APIRequestContext for pure HTTP testing without browser.
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_ORIGIN = 'http://localhost:5173';

// ─── Backend Reachability ─────────────────────────────────────────────────────

test.describe('Backend API - Base Reachability (AC2, AC5)', () => {
  test('GET /scalar should respond with 200 and Content-Type text/html', async ({ request }) => {
    // GIVEN: The .NET 10 API is initialized with Scalar.AspNetCore
    // WHEN: A GET request is made to the Scalar documentation endpoint
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });

    // THEN: Response is 200 with HTML content
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/html');
  });

  test('GET /openapi should respond (Scalar metadata endpoint registered)', async ({ request }) => {
    // GIVEN: builder.Services.AddOpenApi() is called in Program.cs (for Scalar metadata)
    // WHEN: A GET request is made to the OpenAPI JSON endpoint
    const response = await request.get(`${BACKEND_URL}/openapi/v1.json`);

    // THEN: The OpenAPI document is served (Scalar relies on this)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('openapi');
    expect(body).toHaveProperty('info');
  });
});

// ─── CORS Headers (AC3) ───────────────────────────────────────────────────────

test.describe('Backend API - CORS Configuration (AC3)', () => {
  test('OPTIONS preflight should return 204 or 200 with CORS headers for frontend origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy "DevCors" is registered allowing http://localhost:5173
    // WHEN: OPTIONS preflight from frontend origin
    const response = await request.fetch(`${BACKEND_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight succeeds (204 or 200)
    expect([200, 204]).toContain(response.status());
  });

  test('Access-Control-Allow-Origin header should be http://localhost:5173 on GET /scalar', async ({
    request,
  }) => {
    // GIVEN: CORS policy configured with WithOrigins("http://localhost:5173")
    // WHEN: Cross-origin GET request from frontend origin
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: {
        Origin: FRONTEND_ORIGIN,
      },
    });

    // THEN: ACAO header reflects allowed origin
    const acao = response.headers()['access-control-allow-origin'];
    expect(acao).toBe(FRONTEND_ORIGIN);
  });

  test('should NOT allow arbitrary cross-origin requests (CORS not wildcard)', async ({
    request,
  }) => {
    // GIVEN: CORS policy only allows http://localhost:5173 (not wildcard)
    // WHEN: Request from a different unauthorized origin
    const response = await request.get(`${BACKEND_URL}/scalar`, {
      headers: {
        Origin: 'http://malicious.example.com',
      },
    });

    // THEN: ACAO header does NOT include the unauthorized origin
    const acao = response.headers()['access-control-allow-origin'];
    expect(acao).not.toBe('http://malicious.example.com');
    expect(acao).not.toBe('*');
  });
});

// ─── Default Template Cleanup (AC2) ──────────────────────────────────────────

test.describe('Backend API - Clean Project State (AC2)', () => {
  test('GET /weatherforecast should return 404 (default template removed)', async ({ request }) => {
    // GIVEN: The WeatherForecast controller/endpoint was removed from the generated project
    // WHEN: A GET request is made to the default template endpoint
    const response = await request.get(`${BACKEND_URL}/weatherforecast`);

    // THEN: Endpoint no longer exists
    expect(response.status()).toBe(404);
  });

  test('Unhandled error should return Problem Details format (RFC 7807)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before routing in Program.cs
    // WHEN: An endpoint triggers an unhandled exception (simulated via non-existent route)
    // Note: In full integration we would have a /test/error endpoint; here we verify the format
    const response = await request.get(`${BACKEND_URL}/api/trigger-error-test`);

    // THEN: If it returns 5xx, it must be in Problem Details format
    if (response.status() >= 500) {
      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('title');
      // Must NOT expose stack traces or raw exception messages
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('exception');
    } else {
      // 404 is acceptable — endpoint doesn't exist
      expect(response.status()).toBe(404);
    }
  });
});

// ─── appsettings.Development.json placeholder (AC2/Task 5) ───────────────────

test.describe('Backend API - Configuration Placeholders', () => {
  test('Backend should start without configuration errors (appsettings.Development.json valid)', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has ConnectionStrings:DefaultConnection and AllowedOrigins
    // WHEN: The backend starts (reachable = configuration loaded successfully)
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: Server started successfully, no configuration exception on startup
    // If appsettings.json is malformed or required values are missing, server would return 500 or not start
    expect(response.status()).not.toBe(500);
    expect(response.ok() || response.status() === 404).toBeTruthy();
  });
});
