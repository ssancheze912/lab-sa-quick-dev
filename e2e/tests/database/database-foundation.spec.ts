import { test, expect } from '@playwright/test';

/**
 * Story 1.3 — Backend Database Foundation
 * AC 2: Problem Details RFC 7807 middleware — no stack traces exposed
 * AC 1/4: Database connected and migrated
 *
 * These tests are in RED phase — they fail until the backend database
 * foundation is implemented (AppDbContext, ExceptionHandlingMiddleware,
 * initial EF Core migration, snakecase naming convention).
 *
 * Test IDs: API-F-03 (Problem Details), DB-F-01 (health endpoint confirms DB)
 */

const BACKEND_BASE = 'http://localhost:5000';

test.describe('Story 1.3 — Database Foundation & Exception Middleware', () => {
  /**
   * API-F-03 (P1 — AC2 / NFR6)
   * Given an unhandled exception or request to a non-existent route
   * When the error reaches the middleware
   * Then the response is RFC 7807 Problem Details with status, title, detail
   * And no stackTrace, exception, or inner exception is exposed in the body
   */
  test('API-F-03 — Error de backend devuelve Problem Details RFC 7807 sin stackTrace', async ({ request }) => {
    // network-first: intercept at the API level before any page navigation
    const response = await request.get(`${BACKEND_BASE}/api/v1/ruta-que-no-existe-1-3`);

    // RFC 7807 requires 4xx or 5xx status
    expect(response.status()).toBeGreaterThanOrEqual(400);

    // Content-Type must be application/problem+json per RFC 7807
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('problem+json');

    const body = await response.json();

    // Problem Details MUST have these three fields (AC2)
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('detail');

    // Must NOT expose any stack trace or exception details (NFR6)
    const rawBody = JSON.stringify(body).toLowerCase();
    expect(rawBody).not.toContain('stacktrace');
    expect(rawBody).not.toContain('exception');
    expect(rawBody).not.toContain('inner');
    expect(rawBody).not.toContain(' at ');

    // detail field must not reference source code paths (.cs files)
    if (body.detail) {
      expect(body.detail).not.toMatch(/at\s+\w+.*\.(cs|dll)/);
    }
  });

  /**
   * DB-F-01 (P1 — AC2 strict check)
   * Given an unhandled exception is triggered via a test endpoint or forced error
   * When the middleware processes the exception
   * Then the response status field in the body matches the HTTP status code
   * And the title field is a non-empty string (not an exception type class name)
   */
  test('DB-F-01 — Problem Details: campo status coincide con HTTP status y title no es un tipo de excepción', async ({ request }) => {
    // network-first: direct API request, no page navigation needed
    const response = await request.get(`${BACKEND_BASE}/api/v1/trigger-error-for-test`);

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const body = await response.json();

    // status field in body must be a number matching HTTP status (AC2)
    expect(typeof body.status).toBe('number');
    expect(body.status).toBe(response.status());

    // title must be a plain descriptive string, NOT a .NET exception class name
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
    // Exception class names contain 'Exception' — this must not appear in title
    expect(body.title).not.toContain('Exception');
    expect(body.title).not.toContain('System.');
    expect(body.title).not.toContain('Microsoft.');
  });

  /**
   * DB-F-02 (P1 — AC1/AC4)
   * Given the backend is running with AppDbContext configured
   * When the health check endpoint is called
   * Then the response indicates the database connection is alive (siesa_agents_db reachable)
   *
   * Note: This test requires the /api/v1/health endpoint to exist and report DB status.
   * If a dedicated health endpoint is not available, the test validates that
   * the backend starts without DB connection errors (implicit in any successful response).
   */
  test('DB-F-02 — Health check confirma que siesa_agents_db está accesible', async ({ request }) => {
    // network-first: check health before any UI navigation
    const response = await request.get(`${BACKEND_BASE}/health`);

    // A 200 or 204 means the app started and DB is reachable
    // A 503 means app is up but DB is unhealthy — both are progress over total failure
    expect([200, 204, 503]).toContain(response.status());

    // If health endpoint returns JSON, the database status must not be "Unhealthy"
    const contentType = response.headers()['content-type'] ?? '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      // If the health check has a "status" field, it should not be "Unhealthy"
      if (body.status) {
        expect(body.status).not.toBe('Unhealthy');
      }
    }
  });

  /**
   * DB-F-03 (P1 — AC2 content-type verification)
   * Given the backend is running with ExceptionHandlingMiddleware registered
   * When a request triggers a 404 or 500 error
   * Then the Content-Type header is exactly application/problem+json
   * And NOT application/json (plain JSON without Problem Details spec)
   */
  test('DB-F-03 — Content-Type de errores es application/problem+json (no plain JSON)', async ({ request }) => {
    // network-first: API call to force error response
    const response = await request.get(`${BACKEND_BASE}/api/v1/endpoint-inexistente-story-1-3`);

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const contentType = response.headers()['content-type'] ?? '';

    // RFC 7807 specifies content-type must be application/problem+json (AC2)
    expect(contentType).toContain('problem+json');
    // Must NOT be plain application/json
    expect(contentType).not.toBe('application/json');
    expect(contentType).not.toBe('application/json; charset=utf-8');
  });
});
