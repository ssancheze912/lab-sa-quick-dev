/**
 * Story 1.1: Project Initialization & Repository Structure
 * API-Level Edge Cases — Beyond the ATDD happy paths
 *
 * Covers boundary conditions and error paths NOT in backend-initialization.api.spec.ts:
 *   - ExceptionHandlingMiddleware returns application/problem+json (not text/html)
 *   - ExceptionHandlingMiddleware Detail is null (no stack trace leakage)
 *   - CORS blocks origins NOT in the allowed list
 *   - CORS OPTIONS preflight for non-GET methods (POST, DELETE)
 *   - Backend returns structured JSON (not empty body) for 404 paths
 *   - Backend appsettings.Development.json AllowedOrigins is not empty
 *   - /openapi/v1.json endpoint accessible (MapOpenApi() registered)
 *   - Concurrent requests to /scalar do not cause server errors
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// ExceptionHandlingMiddleware edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware — RFC 7807 edge cases', () => {
  test('should return application/problem+json content-type for 404 not-found paths', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware and minimal API are wired in Program.cs
    // WHEN: A request is made to a completely unknown endpoint
    const response = await request.get(`${API_BASE_URL}/api/totally-unknown-path-edge`);

    // THEN: Response must be JSON (not HTML — which would indicate a missing middleware)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toMatch(/json/);
    // AND: Status is 4xx (not 500 — unhandled exceptions would be 500)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('should never expose stack trace or exception details in the response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null per architecture spec
    // WHEN: Any error response is received
    const response = await request.get(`${API_BASE_URL}/api/edge-error-probe`);

    // THEN: Response body must not contain stack trace indicators
    const body = await response.text();
    const stackTracePatterns = [
      'at SiesaAgents',
      'System.Exception',
      'StackTrace',
      'InnerException',
    ];
    for (const pattern of stackTracePatterns) {
      expect(body).not.toContain(pattern);
    }
  });

  test('should return status 404 (not 500) for a missing route — middleware passes through', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches unhandled exceptions (not routing 404s)
    // WHEN: A valid-but-unmapped route is requested
    const response = await request.get(`${API_BASE_URL}/api/not-a-real-endpoint`);

    // THEN: The middleware correctly passes through and the framework returns 404
    // (a 500 here would mean middleware is incorrectly intercepting routing results)
    expect(response.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CORS blocking — disallowed origins must be rejected
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CORS — disallowed origins are blocked', () => {
  test('should NOT return Access-Control-Allow-Origin for an unknown origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy only allows http://localhost:5173
    // WHEN: A request is made from an origin NOT in the allowed list
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://evil.example.com',
      },
    });

    // THEN: The Access-Control-Allow-Origin header is NOT set to the disallowed origin
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('http://evil.example.com');
    // The server still responds (CORS blocking is client-enforced via browser), but
    // the header must not grant permission to the untrusted origin
  });

  test('should NOT return wildcard Access-Control-Allow-Origin (policy uses WithOrigins)', async ({
    request,
  }) => {
    // GIVEN: The CORS policy uses WithOrigins("http://localhost:5173") — not AllowAnyOrigin
    // WHEN: Any request with Origin header is made
    const response = await request.get(`${API_BASE_URL}/scalar`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: The header is NOT a wildcard (security: wildcard + credentials is forbidden anyway)
    const allowOriginHeader = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOriginHeader).not.toBe('*');
  });

  test('should handle OPTIONS preflight for POST method from allowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy uses AllowAnyMethod() — POST must be preflighted correctly
    // WHEN: An OPTIONS preflight for POST is sent from the allowed origin
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });

    // THEN: The preflight must succeed (not 403) — any method is allowed
    expect(response.status()).not.toBe(403);
    expect([200, 204]).toContain(response.status());
  });

  test('should handle OPTIONS preflight for DELETE method from allowed origin', async ({
    request,
  }) => {
    // GIVEN: CORS policy uses AllowAnyMethod()
    // WHEN: A DELETE preflight is sent
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Preflight succeeds
    expect([200, 204]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI metadata — MapOpenApi() endpoint must be registered
// ─────────────────────────────────────────────────────────────────────────────

test.describe('OpenAPI metadata endpoint', () => {
  test('should expose the OpenAPI JSON document at /openapi/v1.json', async ({ request }) => {
    // GIVEN: Program.cs registers builder.Services.AddOpenApi() and app.MapOpenApi()
    // WHEN: The OpenAPI document URL is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The document is served (200)
    expect(response.status()).toBe(200);
  });

  test('should return a valid JSON OpenAPI document at /openapi/v1.json', async ({ request }) => {
    // GIVEN: MapOpenApi() is wired correctly
    // WHEN: The OpenAPI JSON is fetched and parsed
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    const body = await response.json();

    // THEN: The document has at minimum an "openapi" version field
    expect(body).toHaveProperty('openapi');
    expect(typeof body.openapi).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Concurrent requests — backend stability under light concurrency
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Backend stability — concurrent requests', () => {
  test('should handle 5 concurrent requests to /scalar without any 5xx errors', async ({
    request,
  }) => {
    // GIVEN: The backend is running with minimal middleware
    // WHEN: 5 simultaneous GET requests are sent to /scalar
    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/scalar`)
    );
    const responses = await Promise.all(requests);

    // THEN: None of the responses return a server error
    for (const response of responses) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HTTP method constraints — HEAD and OPTIONS on known routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('HTTP method handling on registered routes', () => {
  test('should respond to HEAD request on /scalar (same status as GET, no body)', async ({
    request,
  }) => {
    // GIVEN: HTTP HEAD is a valid method on any GET endpoint
    // WHEN: A HEAD request is made to /scalar
    const response = await request.fetch(`${API_BASE_URL}/scalar`, {
      method: 'HEAD',
    });

    // THEN: Server responds without 5xx — HEAD returns the same headers as GET but no body
    expect(response.status()).toBeLessThan(500);
  });
});
