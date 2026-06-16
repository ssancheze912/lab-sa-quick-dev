/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — `dotnet ef database update` creates `siesa_agents_db` with no errors;
 *          EF Core migrations folder exists in SiesaAgents.Infrastructure
 *   AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 format
 *          (status, title, detail) with no stack traces exposed (NFR6)
 *   AC4 — AppDbContext registered in DI, solution builds with zero errors,
 *          connection string read from appsettings.Development.json
 *
 * Note: AC3 (ApplySnakeCaseNaming in OnModelCreating) and AC5 (empty migration)
 * are structural concerns validated by xUnit unit tests in AppDbContextTests.cs.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Database connectivity — EF Core + PostgreSQL infrastructure wired
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Database connectivity and EF Core infrastructure', () => {
  test('should have the backend API running — proves EF Core DI registration did not crash startup', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered in DI (Story 1.3 Task 2)
    //        and the connection string is read from appsettings.Development.json
    // WHEN: The backend server is queried (a failed AddDbContext registration would crash startup)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server is up — EF Core DI registration succeeded without throwing
    // If AppDbContext registration fails the server cannot start → 500 or connection refused
    expect(response.status()).toBe(200);
  });

  test('should have a health-check or liveness probe confirming database connectivity', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered with UseNpgsql pointing to siesa_agents_db
    //        and `dotnet ef database update` has been applied
    // WHEN: A liveness / health-check endpoint is requested

    // NOTE: This test will fail (RED) until a /health endpoint is implemented
    // or until the backend exposes DB connectivity status. The backend must expose
    // a /health endpoint that checks EF Core connectivity to pass this criterion.
    const response = await request.get(`${API_BASE_URL}/health`);

    // THEN: Returns 200 (healthy) — PostgreSQL is reachable and migrations applied
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      status: expect.stringMatching(/healthy|Healthy/i),
    });
  });

  test('should return a JSON response from /health (not HTML or plain text)', async ({
    request,
  }) => {
    // GIVEN: A /health endpoint is registered in Program.cs using AddHealthChecks()
    // WHEN: GET /health is requested

    const response = await request.get(`${API_BASE_URL}/health`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-type is application/json (structured health report)
    expect(contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: ExceptionHandlingMiddleware — Problem Details RFC 7807, no stack traces
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807', () => {
  test('should return Problem Details RFC 7807 format for unhandled server errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered as the FIRST middleware in Program.cs
    //        (before routing, CORS, and endpoint mapping)
    // WHEN: A request reaches an endpoint that triggers an unhandled exception

    // NOTE: Until a dedicated /api/v1/test-exception endpoint exists this test uses
    // a route that currently returns 404 to verify the middleware intercepts error paths.
    // The RED state here is that /api/v1/trigger-error does not exist yet.
    const response = await request.get(`${API_BASE_URL}/api/v1/trigger-error`);

    // THEN: Response status is NOT 500 with raw HTML (middleware is wired)
    //       AND the body conforms to RFC 7807 (status field present in JSON)
    expect([400, 404, 500]).toContain(response.status());
    const contentType = response.headers()['content-type'] ?? '';
    // Must be JSON — never raw HTML (Kestrel default error page)
    expect(contentType).toContain('json');
  });

  test('should NOT expose stack traces in any error response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware.Detail is set to null for unhandled exceptions (NFR6)
    // WHEN: Any error response is returned from the backend

    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-db-endpoint`);
    const bodyText = await response.text();

    // THEN: No .NET stack trace fragments appear in the response body
    expect(bodyText).not.toContain('at ');          // stack trace lines
    expect(bodyText).not.toContain('System.');       // .NET namespaces
    expect(bodyText).not.toContain('Microsoft.EntityFrameworkCore.'); // EF Core internals
    expect(bodyText).not.toContain('Exception');     // raw exception type names
  });

  test('should return application/problem+json or application/json for 404 errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is wired in Program.cs (Story 1.3 Task 4)
    // WHEN: A request is made to a non-existent API route

    const response = await request.get(`${API_BASE_URL}/api/v1/missing-resource-1-3`);

    // THEN: The content-type header indicates JSON (Problem Details or standard JSON)
    //       Never text/html (bare Kestrel error page)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });

  test('should return a 404 status (not 200 or 500) for missing API resources', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware and routing are both active
    // WHEN: A GET request targets an API path that has no registered handler

    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-db-endpoint`);

    // THEN: Status is 404 — server handles the error gracefully
    expect(response.status()).toBe(404);
  });

  test('should include status field in Problem Details response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware formats errors as RFC 7807 Problem Details
    // WHEN: A request returns a 404 error

    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-db-endpoint`);

    // THEN: Response body contains at minimum a numeric status field (RFC 7807 requirement)
    // Assert JSON content-type first so parse errors are surfaced by Playwright directly
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    const body = await response.json();
    expect(typeof body).toBe('object');
    // RFC 7807 Problem Details MUST include status (integer matching HTTP status code)
    expect(body).toHaveProperty('status');
    expect(typeof body.status).toBe('number');
  });

  test('should NOT expose the Detail field for unhandled exceptions (NFR6 — no internal leakage)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware.Detail is explicitly set to null for unhandled errors
    //        per Story 1.1 Dev Notes pattern — Detail must be null, never ex.Message
    // WHEN: An unhandled exception scenario is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-db-endpoint`);

    // THEN: The detail field in the response body is either absent or null
    //       It must never contain internal error messages (ex.Message) or connection strings
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
    const body = await response.json();
    // If detail is present, it must be null — never an internal error message or connection string
    // Using nullish coalescing: absent field evaluates to null, present field must be null
    expect(body.detail ?? null).toBeNull();
  });

  test('should have ExceptionHandlingMiddleware registered BEFORE routing (first in pipeline)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must be the first middleware in Program.cs (Story 1.3 Task 4)
    // WHEN: The backend processes any request that triggers a 404 before reaching endpoints
    // This is a proxy test — if the middleware is after routing, a 404 may bypass it

    const response = await request.get(`${API_BASE_URL}/api/v1/db-route-does-not-exist`);

    // THEN: Response is JSON (not HTML default Kestrel 404 page)
    //       A JSON response proves middleware intercepted the error path correctly
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: AppDbContext DI registration + connection string from appsettings
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — AppDbContext DI registration and build integrity', () => {
  test('should have the backend running (proves dotnet build SiesaAgents.sln succeeds)', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln is executed after adding AppDbContext
    //        and Npgsql.EntityFrameworkCore.PostgreSQL packages
    // WHEN: The compiled backend server is started

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds with 200 — build succeeded (a compile error would prevent startup)
    expect(response.status()).toBe(200);
  });

  test('should NOT expose the DefaultConnection string value in any public response', async ({
    request,
  }) => {
    // GIVEN: ConnectionStrings:DefaultConnection is in appsettings.Development.json
    //        with value: Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres
    // WHEN: Any public endpoint is queried

    const endpoints = [
      `${API_BASE_URL}/scalar`,
      `${API_BASE_URL}/health`,
      `${API_BASE_URL}/`,
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      const body = await response.text();

      // THEN: Connection string contents are NOT exposed in any response
      expect(body.toLowerCase()).not.toContain('siesa_agents_db');
      expect(body.toLowerCase()).not.toContain('password=postgres');
      expect(body.toLowerCase()).not.toContain('username=postgres');
    }
  });

  test('should NOT have AppDbContext DI registration crash the server on startup', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered with UseNpgsql in Program.cs (Story 1.3 Task 2)
    //        and the connection string key DefaultConnection exists in appsettings.Development.json
    // WHEN: The server starts (DI container is built)

    // Network-first: intercept before sending request
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server started without DI exception (InvalidOperationException would crash startup)
    // If AppDbContext cannot be resolved the server throws at startup and returns nothing
    expect(response.status()).not.toBe(500);
    expect(response.status()).toBeLessThan(500);
  });
});
