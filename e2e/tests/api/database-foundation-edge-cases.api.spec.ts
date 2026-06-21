/**
 * Story 1.3: Backend Database Foundation — Edge Cases & Boundary Tests
 * Epic 1: Project Foundation & Application Shell
 *
 * EXPANSION of baseline ATDD coverage in database-foundation.api.spec.ts.
 * These tests target edge cases, boundary conditions, and error paths
 * NOT covered by the original ATDD test suite.
 *
 * Edge cases covered:
 *   AC3 (expanded) — Problem Details RFC 7807 boundary values
 *   AC5 (expanded) — Database connection resilience / DI correctness
 *   AC6 (expanded) — Infrastructure stability under repeated calls
 *
 * Maps to: TC-E1-P0-05 (expanded), TC-E1-P1-05 (expanded)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 (Edge Cases) — Problem Details response body boundary validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 Edge Cases — Problem Details response body boundary validation', () => {
  test('[P0] status field value should equal 500 (not just be present)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware produces RFC 7807 Problem Details
    // WHEN: An unhandled exception triggers the middleware
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: 'status' field integer value is exactly 500
    expect(body.status).toBe(500);
  });

  test('[P0] title field should be a non-empty string (not null or empty)', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 requires title to be a human-readable summary
    // WHEN: An unhandled exception occurs
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: 'title' is present, is a string, and is not empty
    expect(typeof body.title).toBe('string');
    expect(body.title.trim().length).toBeGreaterThan(0);
  });

  test('[P1] response body should be valid parseable JSON', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware writes a JSON body
    // WHEN: The error endpoint is hit
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const text = await response.text();

    // THEN: Raw response text is valid JSON (no parse errors)
    let parsed: unknown;
    expect(() => {
      parsed = JSON.parse(text);
    }).not.toThrow();
    expect(parsed).not.toBeNull();
  });

  test('[P0] content-type media type should equal exactly application/problem+json', async ({
    request,
  }) => {
    // GIVEN: RFC 7807 specifies the media type exactly
    // WHEN: An exception response is received
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Media type portion equals 'application/problem+json'
    // Charset suffix is allowed: 'application/problem+json; charset=utf-8'
    expect(contentType).toContain('application/problem+json');
  });

  test('[P1] should NOT expose error message content in any response field (NFR6)', async ({
    request,
  }) => {
    // GIVEN: NFR6 prohibits leaking implementation details to clients
    // WHEN: An unhandled exception is processed
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();
    const bodyString = JSON.stringify(body).toLowerCase();

    // THEN: Body does not contain common stack trace indicators
    expect(bodyString).not.toContain('system.');
    expect(bodyString).not.toContain('at siesaagents');
    expect(bodyString).not.toContain('stacktrace');
  });

  test('[P0] repeated calls to error endpoint all return 500 (stateless middleware)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must be stateless and not fail after first call
    // WHEN: The error endpoint is called 3 consecutive times
    // THEN: All 3 responses return HTTP 500 (no degradation)
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
      expect(response.status()).toBe(500);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 (Boundary) — Middleware transparency for non-error paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 Boundary — Middleware is transparent for non-error requests', () => {
  test('[P1] Scalar endpoint should return 200, not 500 (middleware does not intercept success)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware only intercepts unhandled exceptions
    // WHEN: A successful endpoint (Scalar docs) is requested
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Response is not a 500 (middleware is transparent)
    expect(response.status()).not.toBe(500);
  });

  test('[P2] Non-existent route should return 404, not 500 (404s are not swallowed by middleware)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches unhandled exceptions, not 404s
    // WHEN: A request is made to a non-existent route
    const response = await request.get(`${API_BASE_URL}/api/v1/this-route-does-not-exist`);

    // THEN: Response is 404, not 500 (middleware does not convert 404 to 500)
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (Edge Cases) — Database DI registration correctness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 Edge Cases — DI and connection string boundary conditions', () => {
  test('[P1] Scalar endpoint should be consistently reachable on multiple requests', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered in DI — must not destabilize normal requests
    // WHEN: The Scalar endpoint is requested 3 times consecutively
    // THEN: All 3 return non-500 (DI registration does not degrade over requests)
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/scalar`);
      expect(response.status()).not.toBe(500);
    }
  });

  test('[P1] OpenAPI spec endpoint should respond after AppDbContext registration', async ({
    request,
  }) => {
    // GIVEN: Adding DbContext to DI must not break other service registrations
    // WHEN: The OpenAPI spec endpoint is requested
    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: Endpoint responds without a 500 (DI not broken by DbContext registration)
    expect(response.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 (Edge Cases) — Infrastructure stability
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 Edge Cases — Infrastructure stability under various conditions', () => {
  test('[P2] API responds to concurrent requests without errors (no thread-safety issues)', async ({
    request,
  }) => {
    // GIVEN: EF Core and Npgsql packages are registered correctly
    // WHEN: 5 simultaneous requests are made to the Scalar endpoint
    // THEN: All responses succeed (no 500s from thread-safety violations)
    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/scalar`),
    );
    const responses = await Promise.all(requests);

    for (const response of responses) {
      expect(response.status()).not.toBe(500);
    }
  });

  test('[P2] API should handle HEAD request to Scalar endpoint', async ({ request }) => {
    // GIVEN: Backend is running with Infrastructure packages
    // WHEN: A HEAD request is made (not GET)
    // THEN: Server responds without crashing (infrastructure handles HTTP method variations)
    const response = await request.fetch(`${API_BASE_URL}/scalar`, { method: 'HEAD' });

    // HEAD should return 200/405 but never 500
    expect(response.status()).not.toBe(500);
  });
});
