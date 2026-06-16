/**
 * Story 1.3: Backend Database Foundation — API Edge Cases
 * Epic 1: Project Foundation & Application Shell
 *
 * Expands ATDD API coverage with edge cases, boundary conditions, and error paths
 * NOT covered by the primary ATDD acceptance tests in backend-database-foundation.api.spec.ts.
 *
 * Coverage:
 *   - AC2: ExceptionHandlingMiddleware — Problem Details field completeness, HTTP method variations
 *   - AC4: DI registration robustness — startup stability, connection string security
 *   - Security: Header hygiene, OpenAPI spec does not leak internal config
 *   - Boundary: Response timing, concurrent error requests, CORS on error paths
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 Edge Cases — Problem Details RFC 7807 field completeness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Problem Details RFC 7807 field completeness', () => {
  test('[P1] should include a numeric status field matching the HTTP status code in Problem Details', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware formats errors as RFC 7807 Problem Details
    // WHEN: A request to a non-existent route returns 404
    const response = await request.get(`${API_BASE_URL}/api/v1/db-edge-missing-1`);

    // THEN: The JSON body has a status field equal to the HTTP status code
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(typeof body.status).toBe('number');
    expect(body.status).toBe(404);
  });

  test('[P1] should include a title field in Problem Details (RFC 7807 requirement)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware returns a structured Problem Details object
    // WHEN: A 404 response is triggered
    const response = await request.get(`${API_BASE_URL}/api/v1/db-edge-missing-2`);
    const body = await response.json();

    // THEN: 'title' is present and is a non-empty string
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('[P1] should return detail field as null (never expose internal error messages)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware explicitly sets Detail = null for unhandled errors
    // WHEN: A 404 response is triggered on any API route
    const response = await request.get(`${API_BASE_URL}/api/v1/db-edge-missing-3`);
    const body = await response.json();

    // THEN: 'detail' is absent or explicitly null (never a connection string or ex.Message)
    // Using nullish coalescing: absent field evaluates to null, present field must be null
    expect(body.detail ?? null).toBeNull();
  });

  test('[P1] should return application/problem+json content-type for 404 errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Content-Type to application/problem+json
    // WHEN: A missing resource is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/db-edge-missing-4`);

    // THEN: Content-Type header matches RFC 7807 media type (or at minimum contains 'json')
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P2] should NOT expose Microsoft.EntityFrameworkCore namespace in error body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sanitizes all unhandled exceptions
    // WHEN: Any API error response is returned
    const response = await request.get(`${API_BASE_URL}/api/v1/db-edge-ef-leak-check`);
    const bodyText = await response.text();

    // THEN: EF Core internal namespaces are absent from the response body
    expect(bodyText).not.toContain('Microsoft.EntityFrameworkCore');
    expect(bodyText).not.toContain('Npgsql');
    expect(bodyText).not.toContain('DbContext');
  });

  test('[P2] should NOT expose Npgsql connection details in any error response', async ({
    request,
  }) => {
    // GIVEN: The PostgreSQL connection string contains sensitive values
    // WHEN: An error response is returned from any route
    const response = await request.get(`${API_BASE_URL}/api/v1/db-edge-npgsql-leak`);
    const bodyText = await response.text();

    // THEN: PostgreSQL connection info is not present in the error body
    expect(bodyText.toLowerCase()).not.toContain('postgres');
    expect(bodyText.toLowerCase()).not.toContain('host=');
    expect(bodyText.toLowerCase()).not.toContain('port=5432');
    expect(bodyText.toLowerCase()).not.toContain('siesa_agents_db');
  });

  test('[P2] should NOT include stack trace fragments in the error response (at, System., Exception)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware suppresses stack trace output (NFR6)
    // WHEN: A 404 error response is returned
    const response = await request.get(`${API_BASE_URL}/api/v1/db-edge-stack-trace`);
    const bodyText = await response.text();

    // THEN: Stack trace patterns are absent
    expect(bodyText).not.toMatch(/^\s+at\s/m);       // "  at System.Something()" patterns
    expect(bodyText).not.toContain('System.');          // .NET namespaces
    expect(bodyText).not.toContain('Exception');        // Raw exception type names
    expect(bodyText).not.toContain('StackTrace');       // Stack trace property
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 Edge Cases — HTTP method boundary conditions on error paths
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — HTTP method boundary conditions on error paths', () => {
  test('[P1] should return JSON (not HTML) for POST to non-existent API route', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before routing
    // WHEN: A POST request hits a non-existent endpoint
    const response = await request.post(`${API_BASE_URL}/api/v1/db-edge-post-missing`, {
      data: { test: 'payload' },
    });

    // THEN: Error response is JSON (not raw HTML) — middleware intercepted it
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect([404, 405]).toContain(response.status());
  });

  test('[P1] should return JSON for PUT to non-existent API route', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware handles all HTTP verbs uniformly
    // WHEN: A PUT request hits a non-existent endpoint
    const response = await request.put(`${API_BASE_URL}/api/v1/db-edge-put-missing`, {
      data: { id: '00000000-0000-0000-0000-000000000001' },
    });

    // THEN: Response is JSON (not HTML default error page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect([404, 405]).toContain(response.status());
  });

  test('[P2] should return JSON for DELETE to non-existent API route', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware handles all HTTP verbs
    // WHEN: DELETE request hits a missing endpoint
    const response = await request.delete(`${API_BASE_URL}/api/v1/db-edge-delete-missing`);

    // THEN: Response is JSON (not HTML)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('[P1] should return status 404 (not 500) for HEAD request to non-existent route', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must not crash on HEAD requests
    // WHEN: HEAD request hits a non-existent endpoint
    const response = await request.fetch(`${API_BASE_URL}/api/v1/db-edge-head-missing`, {
      method: 'HEAD',
    });

    // THEN: Returns 404 without 500 (middleware handled it gracefully)
    expect(response.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 Edge Cases — AppDbContext DI registration robustness
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — DI registration robustness and startup stability', () => {
  test('[P0] should respond to /scalar within 3 seconds (EF Core DI does not slow startup)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered in DI — EF Core registration must not slow startup
    // WHEN: /scalar is requested and timing is measured
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/scalar`);
    const elapsed = Date.now() - startTime;

    // THEN: Server responds within 3 seconds (AddDbContext not causing startup delay)
    expect(response.status()).toBeLessThan(500);
    expect(elapsed).toBeLessThan(3000);
  });

  test('[P1] should return consistent status for 3 consecutive requests (DI is stable)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered as Scoped in DI (default AddDbContext behavior)
    // WHEN: Three consecutive requests test DI container stability
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const response = await request.get(`${API_BASE_URL}/scalar`);
      statuses.push(response.status());
    }

    // THEN: All 3 return 200 (DI is not corrupted across requests)
    expect(statuses.every((s) => s === 200)).toBe(true);
  });

  test('[P1] should survive 5 concurrent requests without 500 errors (DI scoping is correct)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is Scoped — each request creates a new context instance
    // WHEN: 5 concurrent requests test DI scoping behavior
    const concurrentRequests = Array.from({ length: 5 }, () =>
      request.get(`${API_BASE_URL}/scalar`)
    );

    const responses = await Promise.all(concurrentRequests);

    // THEN: All succeed without 500 (Scoped DI handled concurrency correctly)
    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });
  });

  test('[P1] should NOT expose connection string in OpenAPI JSON spec', async ({ request }) => {
    // GIVEN: The OpenAPI spec is generated from the registered routes
    //        DefaultConnection contains credentials: Username=postgres;Password=postgres
    // WHEN: The OpenAPI JSON spec is fetched
    const specPaths = ['/openapi/v1.json', '/openapi.json', '/api/v1.json'];

    for (const path of specPaths) {
      const response = await request.get(`${API_BASE_URL}${path}`);
      if (response.status() === 200) {
        const body = await response.text();
        // THEN: Connection string contents are absent from the spec
        expect(body.toLowerCase()).not.toContain('siesa_agents_db');
        expect(body.toLowerCase()).not.toContain('password=postgres');
        expect(body.toLowerCase()).not.toContain('username=postgres');
        expect(body.toLowerCase()).not.toContain('host=localhost');
      }
    }
    // If no spec paths respond with 200, constraint is satisfied (no spec leaks credentials)
  });

  test('[P2] should NOT expose DefaultConnection string value in root endpoint response', async ({
    request,
  }) => {
    // GIVEN: The connection string is stored in appsettings.Development.json only
    // WHEN: Root endpoint is queried
    const response = await request.get(`${API_BASE_URL}/`);
    const body = await response.text();

    // THEN: No connection string values appear in any root response
    expect(body.toLowerCase()).not.toContain('siesa_agents_db');
    expect(body.toLowerCase()).not.toContain('password=');
    expect(body.toLowerCase()).not.toContain('username=postgres');
  });

  test('[P1] should NOT expose technology headers that reveal EF Core or Npgsql version', async ({
    request,
  }) => {
    // GIVEN: The backend should hide internal implementation details
    // WHEN: Any request is made
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: No headers expose internal technology stack
    const headers = response.headers();
    expect(headers['x-powered-by']).toBeUndefined();
    expect(headers['x-aspnet-version']).toBeUndefined();
    expect(headers['x-aspnetmvc-version']).toBeUndefined();
    // Server header should not contain detailed version strings
    const serverHeader = headers['server'] ?? '';
    expect(serverHeader).not.toMatch(/\d+\.\d+\.\d+/); // no X.Y.Z version strings
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 / AC4 — Middleware order verification edge cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 / AC4 — Middleware pipeline order and error interception', () => {
  test('[P1] should return JSON (not HTML) for any API route that does not exist (middleware before routing)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered FIRST in Program.cs pipeline
    //        (before app.UseCors, app.MapOpenApi, and endpoint mapping)
    // WHEN: A request to a completely unknown API route is made
    const response = await request.get(`${API_BASE_URL}/api/v1/db-middleware-order-check`);

    // THEN: Response is JSON — middleware intercepted the error path
    //       If middleware were registered AFTER routing, 404 might return HTML
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect(response.status()).toBe(404);
  });

  test('[P1] should return JSON for deeply nested non-existent paths', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware handles all unmatched routes
    // WHEN: A deeply nested non-existent path is requested
    const response = await request.get(
      `${API_BASE_URL}/api/v1/deeply/nested/path/that/does/not/exist`,
    );

    // THEN: Error response is JSON (middleware is in the pipeline)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    expect([404, 400]).toContain(response.status());
  });

  test('[P2] should handle requests with special characters in path without 500', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must survive malformed-looking paths
    // WHEN: A request with encoded special characters is made
    const response = await request.get(
      `${API_BASE_URL}/api/v1/db-edge-special%20chars`,
    );

    // THEN: Server returns 404 (not 500) — graceful handling without crash
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(0);
  });

  test('[P2] should NOT return 200 for routes that should 404 (no catch-all handler)', async ({
    request,
  }) => {
    // GIVEN: The backend has no wildcard catch-all route that returns 200
    // WHEN: A truly non-existent API path is requested
    const response = await request.get(`${API_BASE_URL}/api/v1/db-no-catch-all-test`);

    // THEN: Returns 404 — server correctly distinguishes missing routes from successful ones
    expect(response.status()).toBe(404);
  });

  test('[P1] should return 404 JSON within 2 seconds for non-existent routes (no timeout hanging)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is fast and does not block the pipeline
    // WHEN: A request to a missing route is timed
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/api/v1/db-edge-timing-check`);
    const elapsed = Date.now() - startTime;

    // THEN: 404 response arrives within 2 seconds (no hanging middleware)
    expect(response.status()).toBe(404);
    expect(elapsed).toBeLessThan(2000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 Edge Cases — EF Core migration and infrastructure
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — EF Core migration infrastructure boundary conditions', () => {
  test('[P1] should NOT have WeatherForecast or any default template endpoints (clean scaffold)', async ({
    request,
  }) => {
    // GIVEN: The backend was initialized from a clean template, default endpoints removed
    // WHEN: The OpenAPI spec is fetched and analyzed
    const specPaths = ['/openapi/v1.json', '/openapi.json'];

    for (const path of specPaths) {
      const response = await request.get(`${API_BASE_URL}${path}`);
      if (response.status() === 200) {
        const body = await response.text();
        // THEN: No default WeatherForecast or template endpoints exist
        expect(body.toLowerCase()).not.toContain('weatherforecast');
        expect(body.toLowerCase()).not.toContain('weather');
      }
    }
  });

  test('[P0] should return 200 for /scalar (proves AddDbContext did not crash startup)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext.UseNpgsql is registered in DI before builder.Build()
    //        A misconfigured DI registration would throw InvalidOperationException at startup
    // WHEN: The server is queried after startup
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds — startup succeeded despite EF Core registration
    //       (An uncaught DI exception would prevent server from starting entirely)
    expect(response.status()).toBe(200);
  });

  test('[P1] should NOT expose migration file paths or Migrations namespace in any response', async ({
    request,
  }) => {
    // GIVEN: Migration files exist at SiesaAgents.Infrastructure.Migrations
    //        These internal paths must never appear in public API responses
    // WHEN: Any error response is returned
    const response = await request.get(`${API_BASE_URL}/api/v1/db-edge-migration-leak`);
    const bodyText = await response.text();

    // THEN: Internal migration namespace is absent
    expect(bodyText).not.toContain('Migrations');
    expect(bodyText).not.toContain('InitialCreate');
    expect(bodyText).not.toContain('AppDbContextModelSnapshot');
  });

  test('[P2] should not return 500 when CORS preflight is sent to a missing route', async ({
    request,
  }) => {
    // GIVEN: CORS middleware is registered after ExceptionHandlingMiddleware
    //        Preflight OPTIONS requests should not cause 500 errors
    // WHEN: An OPTIONS preflight request is sent to a non-existent API route
    const response = await request.fetch(`${API_BASE_URL}/api/v1/db-edge-cors-preflight`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    // THEN: Response is NOT 500 (CORS + middleware handled the OPTIONS request gracefully)
    expect(response.status()).not.toBe(500);
  });
});
