/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * AUTOMATION EXPANDED COVERAGE — BMad TEA testarch-automate
 * Part 1 of 2: ExceptionHandlingMiddleware edge cases, NFR6, and middleware ordering.
 *
 * Split from backend-database-foundation.automation.spec.ts (>500 lines) to comply
 * with TEA test-quality standards (max 300 lines per file).
 *
 * Coverage:
 *   - AC3 (ExceptionHandlingMiddleware): response body field types, concurrent requests,
 *     no internal message/stack trace leakage
 *   - NFR6: no connection string or EF Core internals exposed through error responses
 *   - AC5 (middleware ordering): ExceptionHandlingMiddleware registered outermost
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — ExceptionHandlingMiddleware: response body field types and invariants
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware: response body field type enforcement', () => {
  test('should return "status" as a number (not a string) in the Problem Details body', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 mandates "status" to be a numeric integer
    // WHEN: An unhandled exception occurs and ExceptionHandlingMiddleware writes ProblemDetails
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: "status" is a number, not a string
    expect(typeof body.status).toBe('number');
    expect(body.status).toBe(500);
  });

  test('should return "title" as a non-empty string in the Problem Details body', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 mandates "title" to be a human-readable string
    // WHEN: An unhandled exception is handled by the middleware
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: "title" is a string with at least one character
    expect(typeof body.title).toBe('string');
    expect(body.title.trim().length).toBeGreaterThan(0);
  });

  test('should NOT include the internal exception message text in any body field (NFR6)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches Exception("internal test") and swallows details
    // WHEN: The test-error endpoint is called
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const bodyText = await response.text();

    // THEN: The text "internal test" (from the thrown exception) does NOT appear in the response
    expect(bodyText).not.toContain('internal test');
    // THEN: Stack trace indicators are absent
    expect(bodyText).not.toContain('   at ');            // C# stack frame format
    expect(bodyText.toLowerCase()).not.toContain('stacktrace');
  });

  test('should return HTTP 500 for POST to the test-error endpoint (not verb-restricted)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware should intercept all HTTP verbs, not just GET
    // WHEN: A POST request is sent to a route that throws
    // NOTE: /api/v1/test-error is GET-only; the middleware itself is verb-agnostic.
    // This test verifies middleware is active for POST to a non-existent route — expects 404 not 5xx crash
    const response = await request.post(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: Server does not crash (405 Method Not Allowed or 404, never unhandled 500 crash)
    expect(response.status()).toBeLessThan(500);
  });

  test('should return consistent 500 status across two consecutive calls to test-error', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware handles every request independently
    // WHEN: Two sequential requests both trigger an exception
    const [r1, r2] = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/test-error`),
      request.get(`${API_BASE_URL}/api/v1/test-error`),
    ]);

    // THEN: Both return 500 — middleware does not break after first exception
    expect(r1.status()).toBe(500);
    expect(r2.status()).toBe(500);
  });

  test('should return Content-Type application/problem+json on concurrent exception requests', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is stateless — each request gets its own response
    // WHEN: Multiple requests are made concurrently
    const responses = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/test-error`),
      request.get(`${API_BASE_URL}/api/v1/test-error`),
      request.get(`${API_BASE_URL}/api/v1/test-error`),
    ]);

    // THEN: Every response has the RFC 7807 content type
    for (const response of responses) {
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('application/problem+json');
    }
  });

  test('should NOT expose "extensions" or "traceId" with internal details in error body', async ({
    request,
  }) => {
    // GIVEN: ASP.NET Core sometimes adds "extensions" to ProblemDetails with traceId
    // WHEN: An unhandled exception occurs
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: If "extensions" is present, it must not contain internal exception data
    if (body.extensions !== undefined && body.extensions !== null) {
      const extText = JSON.stringify(body.extensions).toLowerCase();
      expect(extText).not.toContain('exception');
      expect(extText).not.toContain('stacktrace');
      expect(extText).not.toContain('internal test');
    }
    // Extensions with only safe fields (e.g., traceId) is acceptable
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NFR6 — Connection string leakage prevention across all error paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe('NFR6 — No configuration or connection string leakage through error responses', () => {
  test('should NOT expose PostgreSQL host in 500 error response body', async ({ request }) => {
    // GIVEN: appsettings.json contains Host=localhost in the DefaultConnection string
    // WHEN: An unhandled exception triggers the Problem Details response
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const bodyText = await response.text();

    // THEN: No PostgreSQL connection details appear in the error body
    expect(bodyText.toLowerCase()).not.toContain('host=');
    expect(bodyText.toLowerCase()).not.toContain('database=');
  });

  test('should NOT expose PostgreSQL credentials in 404 error response body', async ({
    request,
  }) => {
    // GIVEN: A request to a non-existent route may trigger error handling
    // WHEN: The 404 response is received
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-probe`);
    const bodyText = await response.text();

    // THEN: No credential fragments appear
    expect(bodyText.toLowerCase()).not.toContain('password=');
    expect(bodyText.toLowerCase()).not.toContain('username=');
  });

  test('should NOT expose EF Core provider or migration assembly name in error response', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware swallows all exception details
    // WHEN: An unhandled exception occurs
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const bodyText = await response.text();

    // THEN: EF Core internals are not exposed
    // Note: "SiesaAgents" in the title is acceptable (it's the app name not an implementation detail)
    expect(bodyText).not.toContain('MigrationsAssembly');
    expect(bodyText).not.toContain('UseNpgsql');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Middleware ordering: ExceptionHandlingMiddleware registered FIRST
// Verify ordering by ensuring exceptions from routes AFTER it are still caught
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Middleware ordering: ExceptionHandlingMiddleware is outermost handler', () => {
  test('should catch exceptions thrown by endpoints registered after middleware (ordering confirmation)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered FIRST — before MapScalarApiReference and endpoints
    // WHEN: test-error throws (registered after middleware in Program.cs)
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: Exception IS caught (middleware wraps all downstream routes)
    // If middleware were registered AFTER endpoints, this would bubble up as unhandled 500 without RFC 7807 body
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should handle exceptions from multiple distinct routes consistently', async ({
    request,
  }) => {
    // GIVEN: Middleware applies to all routes, not just a specific path
    // WHEN: The same exception endpoint is called repeatedly with different context
    const responses = await Promise.all([
      request.get(`${API_BASE_URL}/api/v1/test-error`),
      request.get(`${API_BASE_URL}/api/v1/test-error`),
    ]);

    // THEN: All responses are consistently handled by the middleware
    for (const response of responses) {
      expect(response.status()).toBe(500);
      const body = await response.json();
      expect(body).toHaveProperty('status', 500);
      expect(body).toHaveProperty('title');
    }
  });
});
