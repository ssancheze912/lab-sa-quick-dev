/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — PostgreSQL database created with __EFMigrationsHistory table
 *   AC4 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details (status, title, detail)
 *         HTTP 500, Content-Type application/problem+json, no stack trace exposed
 *   AC5 — AppDbContext registered via AddDbContext using DefaultConnection
 *   AC6 — Connection string targets siesa_agents_db with Npgsql format
 *
 * Note: AC2 (migration file structure) and AC3 (snake_case convention) are
 * validated by xUnit unit tests in SiesaAgents.UnitTests — see:
 *   - backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs
 *   - backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC5: AppDbContext registered in DI — application starts without errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — AppDbContext registered in DI container via AddDbContext', () => {
  test('should have the backend API server running (DI registration succeeded)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered with AddDbContext<AppDbContext> using DefaultConnection
    // WHEN: The backend starts — a DI registration failure prevents the server from starting

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds with 200 — server startup without DI errors is proven
    // A missing or mis-configured AppDbContext registration throws at startup
    expect(response.status()).toBe(200);
  });

  test('should start with no unhandled startup exceptions visible in API response', async ({
    request,
  }) => {
    // GIVEN: Program.cs calls builder.Services.AddDbContext<AppDbContext>(...) before app.Build()
    // WHEN: The server has started and the health probe endpoint is requested

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: Any status below 500 confirms the server started cleanly — 500 would indicate
    // an unhandled startup exception surfacing through the middleware
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: ExceptionHandlingMiddleware — RFC 7807 Problem Details compliance
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details on unhandled exceptions', () => {
  test('should return Content-Type application/problem+json for unhandled server errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered as the first middleware in Program.cs
    // WHEN: A request triggers a 500-level unhandled exception

    // NOTE: We use the dedicated test error route which must be implemented to trigger
    // an unhandled exception for ATDD verification (e.g., GET /api/test-exception)
    // If this route does not exist yet, the test will fail with 404 — RED phase is correct
    const response = await request.get(`${API_BASE_URL}/api/test-exception`);

    // THEN: Content-Type is application/problem+json (RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return HTTP status 500 for an unhandled exception', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all unhandled exceptions
    // WHEN: An endpoint raises an exception that is not caught by the endpoint itself

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);

    // THEN: HTTP status code is 500
    expect(response.status()).toBe(500);
  });

  test('should return a Problem Details body with status, title, and detail fields', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps exceptions in ProblemDetails
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);
    const body = await response.json();

    // THEN: The body is a valid RFC 7807 Problem Details object
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('title');
    expect(body).toHaveProperty('detail');
    expect(body.status).toBe(500);
  });

  test('should NOT expose stack trace in the 500 error response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware must comply with NFR6 (no internal details exposed)
    // WHEN: An unhandled exception triggers a 500 response

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);
    const body = await response.text();

    // THEN: No stack trace indicators appear in the response body
    expect(body).not.toMatch(/\s+at\s+\w+\./);
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('System.');
    expect(body).not.toContain('Microsoft.AspNetCore');
  });

  test('should NOT expose internal exception message in the 500 response body', async ({
    request,
  }) => {
    // GIVEN: Detail field in ProblemDetails must be null per NFR6
    // WHEN: An unhandled exception triggers a 500 response

    const response = await request.get(`${API_BASE_URL}/api/test-exception`);
    const body = await response.json();

    // THEN: Detail field is null (no internal exception message exposed to caller)
    expect(body.detail).toBeNull();
  });

  test('should return 404 with application/problem+json for KeyNotFoundException', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware handles KeyNotFoundException → HTTP 404
    // WHEN: An endpoint raises a KeyNotFoundException

    const response = await request.get(`${API_BASE_URL}/api/test-not-found`);

    // THEN: Status is 404 and Content-Type is application/problem+json
    expect(response.status()).toBe(404);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return 400 with application/problem+json for ArgumentException', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware handles ArgumentException → HTTP 400
    // WHEN: An endpoint raises an ArgumentException

    const response = await request.get(`${API_BASE_URL}/api/test-bad-request`);

    // THEN: Status is 400 and Content-Type is application/problem+json
    expect(response.status()).toBe(400);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Database is created and __EFMigrationsHistory table exists
// (Integration-level proxy: if the database is NOT connected, any DB-touching
// endpoint will return 500; a dedicated health endpoint can expose DB connectivity)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Database connectivity via EF Core AppDbContext (integration proxy)', () => {
  test('should expose a database health endpoint that returns 200 when DB is connected', async ({
    request,
  }) => {
    // GIVEN: PostgreSQL is running and siesa_agents_db exists with __EFMigrationsHistory
    //        AppDbContext is registered and migrations have been applied via dotnet ef database update
    // WHEN: The health endpoint that exercises DB connectivity is requested
    // NOTE: /api/health/db must be implemented; test fails (RED) until endpoint exists

    // Network-first: intercept registered before navigation in request context (handled by Playwright)
    const response = await request.get(`${API_BASE_URL}/api/health/db`);

    // THEN: HTTP 200 confirms the database is reachable and EF Core migrations table exists
    expect(response.status()).toBe(200);
  });

  test('should return JSON body confirming database status from health endpoint', async ({
    request,
  }) => {
    // GIVEN: The health endpoint connects to siesa_agents_db via AppDbContext
    // WHEN: The endpoint is called

    const response = await request.get(`${API_BASE_URL}/api/health/db`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is JSON (confirms structured health response, not plain text)
    expect(contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Connection string targets siesa_agents_db with Npgsql format
// (Verified at runtime: if the connection string is wrong the server fails to
// connect; the health endpoint above proves the correct string is in use)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Connection string uses Npgsql format targeting siesa_agents_db', () => {
  test('should connect to siesa_agents_db (wrong connection string would cause health failure)', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has DefaultConnection pointing to
    //        Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres
    // WHEN: The DB health endpoint is exercised

    const response = await request.get(`${API_BASE_URL}/api/health/db`);

    // THEN: 200 confirms that siesa_agents_db is reachable with the Npgsql connection string
    // A wrong database name or wrong provider would yield a 500 (connection failure)
    expect(response.status()).toBe(200);
  });
});
