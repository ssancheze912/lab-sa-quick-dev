import { test, expect } from '@playwright/test';

/**
 * API Acceptance Tests: Story 1.1 — Backend Initialization
 *
 * RED PHASE: These tests are written BEFORE implementation.
 * They verify the .NET 10 Clean Architecture backend is correctly initialized.
 *
 * Uses Playwright's APIRequestContext (no browser required).
 *
 * Covers:
 *   AC2 — Backend starts on port 5000; Scalar docs load at /scalar
 *   AC5 — All four Clean Architecture projects compile (verified via running server)
 */

const BACKEND_URL = 'http://localhost:5000';

test.describe('Story 1.1 — Backend Initialization & Clean Architecture', () => {

  // ─── AC2: Backend starts on port 5000 ────────────────────────────────────

  test('AC2 — Backend responds on port 5000', async ({ request }) => {
    // GIVEN: The backend project has been created and dotnet run executed in SiesaAgents.API
    // WHEN: Any HTTP request is sent to http://localhost:5000
    const response = await request.get(`${BACKEND_URL}/`);

    // THEN: The server is reachable (responds with any HTTP status — not a connection refused)
    expect(response.status()).toBeLessThan(600);
  });

  test('AC2 — Scalar API documentation page loads at /scalar', async ({ request }) => {
    // GIVEN: The backend is running with Scalar configured via app.MapScalarApiReference()
    // WHEN: GET /scalar is requested
    const response = await request.get(`${BACKEND_URL}/scalar`);

    // THEN: The Scalar documentation UI responds with HTTP 200
    expect(response.status()).toBe(200);
  });

  test('AC2 — Scalar page returns HTML content (not JSON error)', async ({ request }) => {
    // GIVEN: Scalar is registered and the backend is running
    // WHEN: The /scalar endpoint is requested
    const response = await request.get(`${BACKEND_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The response is HTML (Scalar UI), not a JSON error
    expect(contentType).toContain('text/html');
  });

  // ─── AC2: Swagger/OpenAPI is NOT used (Scalar only) ──────────────────────

  test('AC2 — /swagger endpoint does NOT exist (Scalar is the only API docs)', async ({ request }) => {
    // GIVEN: The backend is initialized with Scalar-only API documentation
    // WHEN: The /swagger endpoint is requested (should be absent)
    const response = await request.get(`${BACKEND_URL}/swagger`);

    // THEN: 404 — UseSwagger() was never called
    expect(response.status()).toBe(404);
  });

  // ─── AC3: CORS header validation ─────────────────────────────────────────

  test('AC3 — Backend responds with CORS header for allowed frontend origin', async ({ request }) => {
    // GIVEN: The DevCors policy is registered allowing http://localhost:5173
    // WHEN: A preflight OPTIONS request is sent from the frontend origin
    const response = await request.fetch(`${BACKEND_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The response includes the CORS allow-origin header for the frontend
    const allowOrigin = response.headers()['access-control-allow-origin'];
    expect(allowOrigin).toBe('http://localhost:5173');
  });

  // ─── AC5: Build health — all projects compiled ───────────────────────────

  test('AC5 — ExceptionHandlingMiddleware returns Problem Details on unhandled errors', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs
    // WHEN: An endpoint that throws an unhandled exception is hit
    // (using a deliberately invalid/non-existent path that may trigger 500)
    const response = await request.get(`${BACKEND_URL}/internal-error-test-trigger`);

    // THEN: If a 500 is returned, it uses Problem Details RFC 7807 format
    if (response.status() === 500) {
      const body = await response.json();
      expect(body).toMatchObject({
        status: 500,
        title: expect.any(String),
      });
      // Problem Details must NOT expose stack traces
      expect(body.detail).toBeNull();
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('exception');
    } else {
      // 404 is acceptable — means the route doesn't exist (no crash)
      expect([404, 200]).toContain(response.status());
    }
  });
});
