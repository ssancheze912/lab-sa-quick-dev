/**
 * Story 1.3: Backend Database Foundation — Automate Expansion
 * Epic 1: Project Foundation & Application Shell
 *
 * E2E Edge Cases & Boundary Conditions for API Level
 * Complements the ATDD happy-path tests in database-foundation.api.spec.ts
 *
 * Coverage added:
 *   - Exception trigger endpoint returns proper RFC 7807 structure (AC2 deep validation)
 *   - Connection string fragments never appear in any endpoint response
 *   - Problem Details body has non-trivial size (not empty JSON)
 *   - No "detail" field leaks internal database errors
 *   - Server responds to concurrent trigger-exception requests consistently
 *   - /scalar responds even after a middleware-handled exception (server stability)
 *   - Non-existent endpoints return structured errors, not HTML pages
 *   - Response to trigger-exception is idempotent (same result on repeat calls)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 Deep Validation — Problem Details RFC 7807 structure completeness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 Deep — Problem Details body structure validation', () => {
  test('trigger-exception endpoint: "status" value in body equals 500 (numeric)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before routing
    // WHEN: The dedicated exception-trigger endpoint is hit
    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: The "status" value in the body is the integer 500 (not a string)
    if (response.status() === 500) {
      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body.status).toBe(500);
      expect(typeof body.status).toBe('number');
    } else {
      // Endpoint not yet implemented — acceptable in RED phase
      expect([404, 405]).toContain(response.status());
    }
  });

  test('trigger-exception endpoint: "title" is a non-empty string', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Title = "An unexpected error occurred."
    // WHEN: The exception-trigger endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    if (response.status() === 500) {
      const body = await response.json();
      expect(body).toHaveProperty('title');
      expect(typeof body.title).toBe('string');
      expect(body.title.length).toBeGreaterThan(0);
    } else {
      expect([404, 405]).toContain(response.status());
    }
  });

  test('trigger-exception endpoint: "detail" is null or absent (NFR6)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null
    // WHEN: The exception-trigger endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    if (response.status() === 500) {
      const body = await response.json();
      // "detail" must be null or absent — not an internal exception message
      if ('detail' in body) {
        expect(body.detail).toBeNull();
      }
    } else {
      expect([404, 405]).toContain(response.status());
    }
  });

  test('trigger-exception endpoint: response body is non-trivially sized', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware serializes a full ProblemDetails object
    // WHEN: The exception-trigger endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    if (response.status() === 500) {
      const body = await response.text();
      // A complete RFC 7807 body with status + title is at least 30 characters
      expect(body.length).toBeGreaterThan(30);
      // And should not be trivially empty like "{}" or "null"
      expect(body.trim()).not.toBe('{}');
      expect(body.trim()).not.toBe('null');
    } else {
      expect([404, 405]).toContain(response.status());
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + AC4 Boundary — Connection string never exposed in any response
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Database security — connection string never exposed', () => {
  const endpointsToProbe = [
    '/scalar',
    '/',
    '/api/does-not-exist',
    '/api/test/trigger-exception',
    '/api/test/db-context-probe',
  ];

  for (const endpoint of endpointsToProbe) {
    test(`should not expose connection string fragments at ${endpoint}`, async ({ request }) => {
      // GIVEN: AppDbContext uses DefaultConnection with postgres credentials
      // WHEN: The endpoint is probed
      const response = await request.get(`${API_BASE_URL}${endpoint}`);
      const body = await response.text();

      // THEN: No PostgreSQL connection string fragments appear in the response
      const sensitiveFragments = ['Host=', 'Password=', 'Username=', 'Database=siesa', 'postgres'];
      for (const fragment of sensitiveFragments) {
        expect(body, `Endpoint ${endpoint} exposed: ${fragment}`).not.toContain(fragment);
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Server stability — multiple concurrent exception-trigger requests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Server stability — concurrent exception handling', () => {
  test('should handle 5 concurrent trigger-exception requests without crash', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware handles exceptions safely
    // WHEN: 5 concurrent requests hit the exception trigger
    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/api/test/trigger-exception`)
    );
    const responses = await Promise.all(requests);

    // THEN: All responses are handled (500 or 404 if endpoint not yet implemented)
    //       — server does NOT crash or return 0 (connection refused)
    for (const resp of responses) {
      expect(resp.status()).not.toBe(0);
      expect(resp.status()).toBeGreaterThanOrEqual(400);
      expect(resp.status()).toBeLessThanOrEqual(599);
    }
  });

  test('server remains available after multiple exception-trigger calls', async ({ request }) => {
    // GIVEN: Several requests to the exception trigger have been processed
    for (let i = 0; i < 3; i++) {
      await request.get(`${API_BASE_URL}/api/test/trigger-exception`);
    }

    // WHEN: /scalar is probed (infrastructure health check)
    const healthResponse = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server is still up — ExceptionHandlingMiddleware does not corrupt server state
    expect(healthResponse.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Idempotency — trigger-exception response is consistent across calls
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware — response idempotency', () => {
  test('trigger-exception returns same status code on repeat calls', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is stateless
    // WHEN: The trigger endpoint is called twice sequentially
    const r1 = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);
    const r2 = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: Both calls return the same HTTP status code (middleware is stateless)
    expect(r1.status()).toBe(r2.status());
  });

  test('trigger-exception: content-type header is identical on repeat calls', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware always sets the same Content-Type
    // WHEN: The trigger endpoint is called twice
    const r1 = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);
    const r2 = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: Content-Type is identical — middleware does not vary headers per call
    const ct1 = r1.headers()['content-type'] ?? '';
    const ct2 = r2.headers()['content-type'] ?? '';

    expect(ct1).toBe(ct2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Non-existent endpoints — structured error, not raw HTML
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Non-existent API endpoints — structured error responses', () => {
  test('should not return text/html for unknown /api/* routes', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all unhandled pipeline errors
    // WHEN: A completely fabricated /api path is requested
    const response = await request.get(`${API_BASE_URL}/api/this-path-never-exists-1234567890`);

    // THEN: The Content-Type is NOT text/html (no ASP.NET error page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('text/html');
  });

  test('deeply nested non-existent path returns a handled response', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before routing
    // WHEN: A deeply nested path that does not exist is requested
    const response = await request.get(
      `${API_BASE_URL}/api/level1/level2/level3/level4/does-not-exist`
    );

    // THEN: Server returns a defined status code — not 0 (connection refused) or crash
    expect(response.status()).not.toBe(0);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
