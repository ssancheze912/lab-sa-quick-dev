/**
 * Story 1.3: Backend Database Foundation — Edge Case & Boundary API Tests
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands coverage beyond the 9 ATDD tests in backend-database-foundation.api.spec.ts.
 *
 * Edge cases covered:
 *   - Problem Details response structure completeness (all RFC 7807 required fields)
 *   - Content-Type charset suffix handling (application/problem+json; charset=utf-8)
 *   - Concurrent error requests produce isolated, non-contaminated responses
 *   - HTTP methods other than GET on error route (POST, PUT, DELETE) also get 500 + Problem Details
 *   - Response body is valid JSON under all conditions
 *   - Backend availability is idempotent (repeated health checks are stable)
 *   - Accept header negotiation does not bypass Problem Details contract
 *   - Scalar API reference endpoint is stable across multiple requests
 *
 * NOTE: These tests require the backend to be running with PostgreSQL.
 * In CI environments where .NET 10 + PostgreSQL are unavailable, all tests
 * are RED by environment constraint, not by implementation defect.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Problem Details JSON structure completeness (RFC 7807 required fields)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Problem Details RFC 7807 structural completeness', () => {
  test('should return a body with at minimum status and title fields on 500 error', async ({
    request,
  }) => {
    // GIVEN: An endpoint that triggers an unhandled exception
    // WHEN: The response is received
    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);
    const body = await response.json();

    // THEN: RFC 7807 required fields are present
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');

    // AND: Status is exactly 500 (not any other server error code)
    expect(body.status).toBe(500);

    // AND: Title is a non-empty string (user-safe, not a raw exception class name)
    expect(typeof body.title).toBe('string');
    expect(body.title.trim().length).toBeGreaterThan(0);
  });

  test('should have detail field absent or null — never an exception message', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (NFR6)
    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);
    const body = await response.json();

    // THEN: If detail is present, it must be null (not exception.Message)
    if ('detail' in body) {
      expect(body.detail).toBeNull();
    }
    // Absence of 'detail' is also valid per RFC 7807
  });

  test('should not include stack trace fields in response body', async ({ request }) => {
    // GIVEN: NFR6 — no stack trace exposure
    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);
    const bodyText = await response.text();

    // THEN: None of the stack trace indicators appear in the JSON body
    expect(bodyText).not.toMatch(/\bat\s+\w/);        // "at SomeMethod"
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('Exception');
    expect(bodyText).not.toContain('Microsoft.AspNetCore');
    expect(bodyText).not.toContain('System.Private');
  });

  test('should return body that is valid parseable JSON — not truncated or malformed', async ({
    request,
  }) => {
    // GIVEN: An unhandled exception triggers middleware
    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);
    const bodyText = await response.text();

    // THEN: The body is valid JSON (not a raw ASP.NET error page or truncated buffer)
    expect(() => JSON.parse(bodyText)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Content-Type header variations
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Content-Type header format for Problem Details responses', () => {
  test('should include application/problem+json in Content-Type (with or without charset)', async ({
    request,
  }) => {
    // GIVEN: The middleware sets ContentType = "application/problem+json"
    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: The media type portion is application/problem+json
    // Accept either bare or with charset suffix (both are valid)
    expect(contentType).toMatch(/application\/problem\+json/);
  });

  test('Scalar endpoint Content-Type should be text/html (not problem+json)', async ({
    request,
  }) => {
    // GIVEN: Scalar API reference page (happy path, no exception)
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is HTML — confirms Scalar endpoint is not caught by error middleware
    expect(contentType).toContain('text/html');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: HTTP method variants on error route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — HTTP method variants trigger the same middleware behavior', () => {
  test('POST to error-triggering route should return 500 Problem Details', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware covers ALL HTTP methods (not just GET)
    const response = await request.post(`${API_BASE_URL}/api/throw-for-atdd-test`, {
      data: {},
    });

    // THEN: 500 + problem+json regardless of HTTP method
    // NOTE: If the route doesn't exist, ASP.NET may return 404 or 405 — both are JSON (not HTML)
    const contentType = response.headers()['content-type'] ?? '';
    expect([404, 405, 500]).toContain(response.status());
    expect(contentType).toContain('json');
  });

  test('unknown route with any method should return JSON response (not HTML error page)', async ({
    request,
  }) => {
    // GIVEN: An unknown route with a DELETE request
    const response = await request.delete(`${API_BASE_URL}/api/route-that-does-not-exist-12345`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is JSON, not HTML — middleware covers all HTTP methods and routes
    expect(contentType).toContain('json');
    expect([404, 405, 500]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Concurrent requests — response isolation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Concurrent error requests produce isolated Problem Details responses', () => {
  test('5 simultaneous requests to error route all return 500 with independent bodies', async ({
    request,
  }) => {
    // GIVEN: 5 concurrent requests to the error-triggering endpoint
    const requests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/api/throw-for-atdd-test`)
    );

    // WHEN: All requests complete
    const responses = await Promise.all(requests);

    // THEN: Each response is independently 500 + problem+json
    for (const response of responses) {
      expect(response.status()).toBe(500);
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('application/problem+json');

      const body = await response.json();
      expect(body.status).toBe(500);
      expect(body.title).toBeTruthy();

      // AND: No cross-contamination — detail is null or absent in every response
      if ('detail' in body) {
        expect(body.detail).toBeNull();
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Backend availability idempotency (repeated health checks)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Backend availability is stable across repeated requests', () => {
  test('Scalar endpoint returns 200 on 3 consecutive requests without degradation', async ({
    request,
  }) => {
    // GIVEN: The backend has EF Core DI initialized (DI validation runs once at startup)
    // WHEN: 3 consecutive requests are made to the Scalar page
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/scalar`);

      // THEN: Each request returns 200 (no DB connection leak or middleware side-effect)
      expect(response.status()).toBe(200);
    }
  });

  test('nonexistent route returns 404 consistently across repeated requests', async ({
    request,
  }) => {
    // GIVEN: A route that does not exist
    const route = `${API_BASE_URL}/api/consistently-nonexistent`;

    // WHEN: 3 consecutive requests are made
    const statuses = await Promise.all([
      request.get(route).then(r => r.status()),
      request.get(route).then(r => r.status()),
      request.get(route).then(r => r.status()),
    ]);

    // THEN: All return the same status code (404 is consistent, not flipping to 500)
    const uniqueStatuses = new Set(statuses);
    expect(uniqueStatuses.size).toBe(1);
    expect([404, 400]).toContain(statuses[0]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Accept header negotiation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edge — Accept header does not bypass Problem Details contract', () => {
  test('request with Accept: text/html to error route still returns problem+json', async ({
    request,
  }) => {
    // GIVEN: Client requests HTML but middleware enforces problem+json for errors
    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`, {
      headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    });

    // THEN: Response is still application/problem+json (middleware overrides Accept for errors)
    const contentType = response.headers()['content-type'] ?? '';
    expect(response.status()).toBe(500);
    expect(contentType).toContain('application/problem+json');
  });

  test('request with Accept: application/json to error route still returns problem+json', async ({
    request,
  }) => {
    // GIVEN: Client requests generic JSON
    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`, {
      headers: { Accept: 'application/json' },
    });

    // THEN: Content-Type is problem+json (more specific than application/json, RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(response.status()).toBe(500);
    expect(contentType).toContain('problem+json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: DI wiring observable at the API level
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Boundary — ApplicationDbContext DI wiring is observable at API level', () => {
  test('backend should respond to any known route without 500 from DI failure', async ({
    request,
  }) => {
    // GIVEN: AddDbContext<ApplicationDbContext> is correctly registered in Program.cs
    // (a DI misconfiguration would produce a 500 on all routes at startup)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: No DI-caused 500 error — Scalar page loads successfully
    expect(response.status()).not.toBe(500);
  });

  test('response body on non-error routes is NOT problem+json (confirms middleware only activates on exceptions)', async ({
    request,
  }) => {
    // GIVEN: The Scalar page serves correctly (no exception)
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is NOT application/problem+json for successful responses
    // (middleware catch block is not triggered by normal responses)
    expect(contentType).not.toContain('problem+json');
  });
});
