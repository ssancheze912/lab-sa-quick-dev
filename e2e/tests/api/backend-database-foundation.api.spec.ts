/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — siesa_agents_db database is created; EF Core migrations folder exists
 *   AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 (no stack traces)
 *   AC4 — dotnet build succeeds; AppDbContext registered as a service in Program.cs
 *   AC6 — Exactly one migration "InitialCreate" is applied
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 format', () => {
  test('should return application/problem+json content-type on unhandled exception', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs before routing
    // WHEN: A request reaches an endpoint that throws an unhandled exception
    // NOTE: We call a dedicated test endpoint /api/test/throw that intentionally throws

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);

    // THEN: Response Content-Type is application/problem+json (RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should include "status" field in Problem Details response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered and returns Problem Details
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json();

    // THEN: Response body contains "status" field (RFC 7807 requirement)
    expect(body).toHaveProperty('status');
    expect(typeof body.status).toBe('number');
  });

  test('should include "title" field in Problem Details response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered and returns Problem Details
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.json();

    // THEN: Response body contains "title" field (RFC 7807 requirement)
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
  });

  test('should return HTTP 500 status code on unhandled exception', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware catches all unhandled exceptions
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);

    // THEN: HTTP status code is 500 (Internal Server Error)
    expect(response.status()).toBe(500);
  });

  test('should NOT expose stack trace in Problem Details response body (NFR6)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware must never expose stack traces (NFR6)
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/throw`);
    const body = await response.text();

    // THEN: Response body does NOT contain stack trace information
    expect(body).not.toContain('stackTrace');
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('   at '); // C# stack trace line pattern
    expect(body).not.toContain('System.Exception');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — AppDbContext registered; backend compiles and responds correctly
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — AppDbContext is registered and backend is fully operational', () => {
  test('should have the backend API server running (build compiled successfully)', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.slnx was executed with zero errors
    // WHEN: The running backend server receives a health-check request
    // NOTE: If the build failed, the server cannot run — this test acts as a build proxy

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: Server is reachable (any status < 500 confirms server is up)
    expect(response.status()).toBeLessThan(500);
  });

  test('should expose a health endpoint confirming AppDbContext is registered in DI', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered via builder.Services.AddDbContext<AppDbContext>()
    //        with the DefaultConnection connection string in Program.cs
    // WHEN: A GET request is made to /api/health (or healthz)

    const response = await request.get(`${API_BASE_URL}/health`);

    // THEN: Health endpoint responds — AppDbContext DI registration does not throw
    // A misconfigured DI container would cause the app to fail to start (server would be down)
    expect(response.status()).toBeLessThanOrEqual(503);
  });

  test('should not crash on startup when AppDbContext DefaultConnection is configured', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has ConnectionStrings:DefaultConnection configured
    //        as set in Story 1.1 (Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres)
    // WHEN: The backend server starts with the full DI container (including AppDbContext)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Scalar documentation loads — the app started without DI configuration errors
    expect(response.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 / AC6 — Database created with InitialCreate migration applied
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 / AC6 — Database initialized with exactly one migration (InitialCreate)', () => {
  test('should have the EF Core migrations endpoint returning applied migrations list', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered and the InitialCreate migration was applied
    //        via `dotnet ef database update`
    // WHEN: A GET request is made to /api/health/db-migrations (diagnostic endpoint)

    const response = await request.get(`${API_BASE_URL}/api/health/db-migrations`);

    // THEN: Endpoint responds (not 404 — the diagnostic route must exist)
    expect(response.status()).not.toBe(404);
  });

  test('should return "InitialCreate" as the only applied migration', async ({ request }) => {
    // GIVEN: `dotnet ef database update` was run successfully from backend/ directory
    //        The migration is named "InitialCreate" per AC6
    // WHEN: The diagnostics endpoint lists applied EF Core migrations

    const response = await request.get(`${API_BASE_URL}/api/health/db-migrations`);
    const body = await response.json();

    // THEN: Exactly one migration named "InitialCreate" is listed as applied
    expect(Array.isArray(body.migrations)).toBe(true);
    expect(body.migrations).toHaveLength(1);
    expect(body.migrations[0]).toContain('InitialCreate');
  });

  test('should have the siesa_agents_db database created (backend connects without error)', async ({
    request,
  }) => {
    // GIVEN: `dotnet ef database update` created the siesa_agents_db database in PostgreSQL
    // WHEN: The backend connects to the database via the health check endpoint

    const response = await request.get(`${API_BASE_URL}/api/health/db-migrations`);

    // THEN: Response is not a database connection error (any 2xx or 200 OK)
    expect(response.status()).toBe(200);
  });
});
