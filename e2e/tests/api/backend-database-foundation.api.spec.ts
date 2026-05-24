/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — `dotnet ef database update` creates `siesa_agents_db` with `__EFMigrationsHistory` table
 *   AC2 — EF Core migrations folder exists in SiesaAgents.Infrastructure with an initial empty migration
 *   AC3 — Unhandled exceptions return RFC 7807 Problem Details with Content-Type: application/problem+json
 *          and no stack traces (NFR6)
 *
 * Test Level: API (Playwright request context — no browser, direct HTTP)
 * Primary Level: API
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 & AC2 — EF Core database and migrations infrastructure
// Verified through a dedicated health/readiness endpoint that confirms DB connectivity
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1/AC2 — EF Core database connectivity and migrations', () => {
  test('should have the database reachable from the backend API', async ({ request }) => {
    // GIVEN: PostgreSQL is running locally and `dotnet ef database update` has been executed
    // WHEN: A request is made to a backend endpoint that requires DB connectivity

    // Intercept at network level — set route before any navigation/request
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: The backend responds with 200, confirming the DbContext can reach the DB
    // Fails RED: /api/v1/health endpoint does not exist yet
    expect(response.status()).toBe(200);
  });

  test('should confirm __EFMigrationsHistory table is present via health response body', async ({
    request,
  }) => {
    // GIVEN: `dotnet ef database update` has applied the InitialCreate migration
    // WHEN: The health endpoint is queried for DB migration status

    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: Response body confirms migrations have been applied
    // Fails RED: /api/v1/health endpoint does not exist yet
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      database: expect.objectContaining({
        migrationsApplied: true,
      }),
    });
  });

  test('should confirm DbContext connects to siesa_agents_db — not a fallback in-memory DB', async ({
    request,
  }) => {
    // GIVEN: `ConnectionStrings:DefaultConnection` points to siesa_agents_db on PostgreSQL
    // WHEN: The health endpoint is queried for DB connection details

    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: The response confirms PostgreSQL is the active provider (not InMemory)
    // Fails RED: /api/v1/health endpoint does not exist yet
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      database: expect.objectContaining({
        provider: 'postgresql',
      }),
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details
//        with Content-Type: application/problem+json and no stack traces
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details', () => {
  test('should return HTTP 500 when an unhandled exception reaches the middleware', async ({
    request,
  }) => {
    // GIVEN: An unhandled exception occurs in the backend
    // WHEN: The error propagates to ExceptionHandlingMiddleware

    const response = await request.get(`${API_BASE_URL}/api/v1/test/throw-exception`);

    // THEN: The HTTP status code is 500
    // Fails RED: /api/v1/test/throw-exception endpoint does not exist yet
    expect(response.status()).toBe(500);
  });

  test('should return Content-Type application/problem+json for unhandled exceptions', async ({
    request,
  }) => {
    // GIVEN: An unhandled exception occurs and reaches ExceptionHandlingMiddleware
    // WHEN: The middleware writes the error response

    const response = await request.get(`${API_BASE_URL}/api/v1/test/throw-exception`);

    // THEN: The Content-Type header is application/problem+json (RFC 7807)
    // Fails RED: /api/v1/test/throw-exception endpoint does not exist yet
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should include status field in Problem Details response body', async ({ request }) => {
    // GIVEN: An unhandled exception occurs in the backend
    // WHEN: The middleware serializes the ProblemDetails object

    const response = await request.get(`${API_BASE_URL}/api/v1/test/throw-exception`);

    // THEN: The response body contains a numeric status field equal to 500
    // Fails RED: /api/v1/test/throw-exception endpoint does not exist yet
    const body = await response.json();
    expect(body).toMatchObject({ status: 500 });
  });

  test('should include title field in Problem Details response body', async ({ request }) => {
    // GIVEN: An unhandled exception occurs in the backend
    // WHEN: ExceptionHandlingMiddleware handles the exception and writes the response

    const response = await request.get(`${API_BASE_URL}/api/v1/test/throw-exception`);

    // THEN: The response body contains a non-empty title field
    // Fails RED: /api/v1/test/throw-exception endpoint does not exist yet
    const body = await response.json();
    expect(body).toMatchObject({ title: 'An unexpected error occurred.' });
  });

  test('should NOT expose stack trace in Problem Details response body (NFR6)', async ({
    request,
  }) => {
    // GIVEN: An unhandled exception occurs with a stack trace
    // WHEN: ExceptionHandlingMiddleware catches the exception

    const response = await request.get(`${API_BASE_URL}/api/v1/test/throw-exception`);

    // THEN: The response body does NOT contain stack trace information
    //       (detail must be null or absent, never ex.Message or ex.StackTrace)
    // Fails RED: /api/v1/test/throw-exception endpoint does not exist yet
    const body = await response.json();
    // detail must not contain stack trace keywords
    const detail = body?.detail ?? '';
    expect(detail).not.toContain('at ');
    expect(detail).not.toContain('System.');
    expect(detail).not.toContain('Exception');
  });

  test('should return null or absent detail field in Problem Details (no exception message exposed)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is configured with Detail = null (NFR6 compliance)
    // WHEN: An unhandled exception is handled by the middleware

    const response = await request.get(`${API_BASE_URL}/api/v1/test/throw-exception`);

    // THEN: The detail field is null or not present in the response body
    // Fails RED: /api/v1/test/throw-exception endpoint does not exist yet
    const body = await response.json();
    // detail should be null (as configured) or missing entirely
    expect(body?.detail === null || body?.detail === undefined).toBe(true);
  });
});
