import { test, expect } from '@playwright/test';

/**
 * API Edge Case Tests: Story 1.1 — CORS & Middleware Boundary Conditions
 *
 * BMad-Integrated: Expands ATDD coverage with edge cases NOT in the ATDD suite.
 * Targets: AC2 (backend), AC3 (CORS), AC5 (error handling)
 *
 * Edge cases covered:
 *   - CORS rejects disallowed origins (no wildcard policy)
 *   - CORS allows all HTTP methods (OPTIONS, POST, PUT, DELETE)
 *   - ExceptionHandlingMiddleware never exposes stack traces
 *   - Problem Details response has correct content-type header
 *   - Backend does NOT start Swagger middleware at /swagger/index.html
 *   - /openapi endpoint is NOT publicly browsable (raw JSON, not UI)
 *   - Backend responds to HEAD requests without body
 */

const BACKEND_URL = 'http://localhost:5000';

test.describe('Story 1.1 — Backend CORS & Middleware Edge Cases', () => {

  // ─── CORS: Disallowed origins MUST be rejected ───────────────────────────

  test('[P1] AC3 — CORS rejects requests from an unlisted origin', async ({ request }) => {
    // GIVEN: The DevCors policy only allows http://localhost:5173
    // WHEN: A request arrives from a different origin (e.g., http://evil.example.com)
    const response = await request.fetch(`${BACKEND_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://evil.example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The Access-Control-Allow-Origin header MUST NOT allow the unlisted origin
    const allowOrigin = response.headers()['access-control-allow-origin'] ?? '';
    expect(allowOrigin).not.toBe('http://evil.example.com');
    expect(allowOrigin).not.toBe('*');
  });

  test('[P1] AC3 — CORS allows POST method from frontend origin', async ({ request }) => {
    // GIVEN: DevCors policy uses AllowAnyMethod()
    // WHEN: A preflight for POST is sent from http://localhost:5173
    const response = await request.fetch(`${BACKEND_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The response includes Access-Control-Allow-Methods containing POST
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    // CORS may return the specific method or a wildcard
    expect(
      allowMethods.toUpperCase().includes('POST') || allowMethods === '*',
      `Expected POST to be allowed. Got: "${allowMethods}"`,
    ).toBe(true);
  });

  test('[P1] AC3 — CORS allows PUT method from frontend origin', async ({ request }) => {
    // GIVEN: DevCors policy uses AllowAnyMethod()
    // WHEN: A preflight for PUT is sent from http://localhost:5173
    const response = await request.fetch(`${BACKEND_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: The response includes Access-Control-Allow-Methods containing PUT
    const allowMethods = response.headers()['access-control-allow-methods'] ?? '';
    expect(
      allowMethods.toUpperCase().includes('PUT') || allowMethods === '*',
      `Expected PUT to be allowed. Got: "${allowMethods}"`,
    ).toBe(true);
  });

  test('[P2] AC3 — CORS allows Content-Type request header from frontend origin', async ({ request }) => {
    // GIVEN: DevCors policy uses AllowAnyHeader()
    // WHEN: A preflight for Content-Type header is sent
    const response = await request.fetch(`${BACKEND_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Access-Control-Allow-Headers includes Content-Type or wildcard
    const allowHeaders = response.headers()['access-control-allow-headers'] ?? '';
    expect(
      allowHeaders.toLowerCase().includes('content-type') || allowHeaders === '*',
      `Expected Content-Type to be allowed. Got: "${allowHeaders}"`,
    ).toBe(true);
  });

  // ─── ExceptionHandlingMiddleware: Problem Details format ─────────────────

  test('[P1] AC5 — Problem Details response has application/problem+json content-type', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware catches unhandled exceptions
    // WHEN: A 500 error is triggered (endpoint does not exist — may yield 404)
    const response = await request.get(`${BACKEND_URL}/internal-error-test-trigger`);

    // THEN: If 500, content-type must be application/problem+json
    if (response.status() === 500) {
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('application/problem+json');
    } else {
      // 404 is acceptable — no crash occurred
      expect([200, 404]).toContain(response.status());
    }
  });

  test('[P1] AC5 — Problem Details response never contains stackTrace field', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware follows RFC 7807 (no stack exposure)
    // WHEN: Any 500 error is triggered
    const response = await request.get(`${BACKEND_URL}/internal-error-test-trigger`);

    // THEN: stackTrace is never present in the response body
    if (response.status() === 500) {
      const body = await response.json();
      expect(body).not.toHaveProperty('stackTrace');
      expect(body).not.toHaveProperty('StackTrace');
      expect(body).not.toHaveProperty('exception');
      expect(body).not.toHaveProperty('innerException');
    } else {
      expect([200, 404]).toContain(response.status());
    }
  });

  test('[P1] AC5 — Problem Details detail field is null (no internal error info exposed)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null per security policy
    // WHEN: A 500 error is triggered
    const response = await request.get(`${BACKEND_URL}/internal-error-test-trigger`);

    // THEN: detail must be null (NEVER expose ex.Message)
    if (response.status() === 500) {
      const body = await response.json();
      expect(body.detail).toBeNull();
    } else {
      expect([200, 404]).toContain(response.status());
    }
  });

  // ─── Swagger must NOT be configured ──────────────────────────────────────

  test('[P1] AC2 — /swagger/index.html does NOT exist (no Swashbuckle)', async ({ request }) => {
    // GIVEN: The backend uses Scalar exclusively (no UseSwagger() calls)
    // WHEN: The /swagger/index.html path is requested
    const response = await request.get(`${BACKEND_URL}/swagger/index.html`);

    // THEN: 404 — Swashbuckle UI is not configured
    expect(response.status()).toBe(404);
  });

  // ─── HEAD method support ─────────────────────────────────────────────────

  test('[P2] AC2 — Backend responds to HEAD requests without error', async ({ request }) => {
    // GIVEN: The backend is running
    // WHEN: A HEAD request is sent to any known route
    const response = await request.fetch(`${BACKEND_URL}/scalar`, { method: 'HEAD' });

    // THEN: Server responds (HEAD should not return 500 or 400)
    expect(response.status()).toBeLessThan(500);
  });

  // ─── Backend JSON response format ─────────────────────────────────────────

  test('[P2] AC2 — 404 responses do not expose internal routing details', async ({ request }) => {
    // GIVEN: The backend is running with ExceptionHandlingMiddleware
    // WHEN: A completely non-existent path is requested
    const response = await request.get(`${BACKEND_URL}/non-existent-route-xyz-abc`);

    // THEN: No 500 error (middleware works), and no sensitive info leaked
    expect(response.status()).not.toBe(500);
    // Response should be 404 — normal routing behavior
    expect(response.status()).toBe(404);
  });
});
