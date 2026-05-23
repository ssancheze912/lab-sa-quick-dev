/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — PostgreSQL database `siesa_agents_db` is created; `__EFMigrationsHistory` table present
 *   AC3 — ExceptionHandlingMiddleware returns application/problem+json with status/title/detail(null)
 *   AC5 — Backend build succeeds; AppDbContext is registered in DI with DefaultConnection
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3: ExceptionHandlingMiddleware — Problem Details RFC 7807
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details', () => {
  test('should return application/problem+json content-type when an unhandled exception occurs', async ({
    request,
  }) => {
    // GIVEN: The backend is running and a route triggers an unhandled exception
    // WHEN: The error reaches ExceptionHandlingMiddleware

    // Network-first: set up request BEFORE sending
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);

    // THEN: Content-Type header is application/problem+json
    expect(response.headers()['content-type']).toContain('application/problem+json');
  });

  test('should return HTTP 500 status code when an unhandled exception occurs', async ({
    request,
  }) => {
    // GIVEN: The backend is running and an unhandled exception is triggered
    // WHEN: The error reaches ExceptionHandlingMiddleware
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);

    // THEN: Response status is 500 Internal Server Error
    expect(response.status()).toBe(500);
  });

  test('should return a Problem Details body with "status" field equal to 500', async ({
    request,
  }) => {
    // GIVEN: The backend returns a problem+json response on unhandled exception
    // WHEN: The response body is parsed as JSON
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json();

    // THEN: The "status" field equals 500
    expect(body.status).toBe(500);
  });

  test('should return a Problem Details body with a non-empty "title" field', async ({
    request,
  }) => {
    // GIVEN: The backend returns a problem+json response on unhandled exception
    // WHEN: The response body is parsed as JSON
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json();

    // THEN: The "title" field is present and non-empty
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('should return a Problem Details body with "detail" field equal to null — no internal details exposed', async ({
    request,
  }) => {
    // GIVEN: The backend catches an exception with an internal message
    // WHEN: The error reaches ExceptionHandlingMiddleware (NFR6 — no stack trace exposure)
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json();

    // THEN: The "detail" field is null — ex.Message and stack trace are NOT exposed
    expect(body.detail).toBeNull();
  });

  test('should NOT expose any stack trace in the response body', async ({ request }) => {
    // GIVEN: An exception with a stack trace is thrown
    // WHEN: ExceptionHandlingMiddleware catches the exception
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const rawBody = await response.text();

    // THEN: The raw response body does not contain "StackTrace" or "at SiesaAgents"
    expect(rawBody).not.toContain('StackTrace');
    expect(rawBody).not.toContain('at SiesaAgents');
    expect(rawBody).not.toContain('Exception');
  });

  test('should NOT expose any internal exception message in the response body', async ({
    request,
  }) => {
    // GIVEN: An exception is thrown with a sensitive internal message
    // WHEN: ExceptionHandlingMiddleware catches it (NFR6)
    const response = await request.get(`${API_BASE_URL}/api/test/throw-exception`);
    const body = await response.json();

    // THEN: The response body does not include "exceptionMessage" or similar leak fields
    expect(body.exceptionMessage).toBeUndefined();
    expect(body.innerException).toBeUndefined();
    expect(body.traceId).toBeUndefined();
  });

  test('should pass through normally when no exception is thrown — middleware is transparent', async ({
    request,
  }) => {
    // GIVEN: A route that does not throw an exception
    // WHEN: A request is made to a known-good endpoint
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Response is not 500 — middleware did not interfere with normal responses
    expect(response.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Database connectivity — siesa_agents_db created with EFMigrationsHistory
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Database is created with __EFMigrationsHistory table present', () => {
  test('should return HTTP 200 from database health-check endpoint confirming DB connectivity', async ({
    request,
  }) => {
    // GIVEN: PostgreSQL is running locally with siesa_agents_db
    //        and dotnet ef database update has been run
    // WHEN: The backend health/readiness endpoint that queries the DB is called

    // Network-first intercept pattern: request is sent immediately
    const response = await request.get(`${API_BASE_URL}/health/db`);

    // THEN: The endpoint returns 200 (DB connection successful, migrations applied)
    // RED: Will fail until /health/db endpoint is implemented and DB is provisioned
    expect(response.status()).toBe(200);
  });

  test('should confirm __EFMigrationsHistory table exists via health check response body', async ({
    request,
  }) => {
    // GIVEN: EF Core InitialCreate migration has been applied
    // WHEN: The DB health check endpoint returns its payload
    const response = await request.get(`${API_BASE_URL}/health/db`);
    const body = await response.json();

    // THEN: The response indicates migrations are applied
    // RED: Will fail until health endpoint reports migration status
    expect(body.migrationsApplied).toBe(true);
  });

  test('should return a response confirming no domain tables exist — empty initial migration', async ({
    request,
  }) => {
    // GIVEN: InitialCreate migration was applied (AC2 — empty migration, no domain tables)
    // WHEN: The DB health check returns schema information
    const response = await request.get(`${API_BASE_URL}/health/db`);
    const body = await response.json();

    // THEN: No domain tables (clientes, contactos) are reported in the schema
    // RED: Will fail until health endpoint exposes table list
    expect(body.domainTablesCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: AppDbContext registered in DI — backend builds and starts
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — AppDbContext registered in DI with DefaultConnection', () => {
  test('should have the backend API server running on port 5000', async ({ request }) => {
    // GIVEN: The backend solution builds successfully (AppDbContext registered in DI)
    // WHEN: A request is made to the backend root
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Backend is reachable — DI registration did not cause startup failure
    expect([200, 301, 302]).toContain(response.status());
  });

  test('should start without DI container build exceptions — AppDbContext resolves correctly', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered with UseNpgsql and DefaultConnection string
    // WHEN: The backend starts (DI container built) and the first request arrives
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: No 500 "DI build failed" error — backend started successfully
    // RED: Will fail if AppDbContext is missing from DI registration in Program.cs
    expect(response.status()).not.toBe(500);
  });

  test('should confirm AppDbContext connection string points to siesa_agents_db via health check', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has DefaultConnection = Host=localhost;Database=siesa_agents_db
    // WHEN: The DB health endpoint verifies connection configuration
    const response = await request.get(`${API_BASE_URL}/health/db`);
    const body = await response.json();

    // THEN: The reported database name is siesa_agents_db
    // RED: Will fail until /health/db endpoint exposes the connected database name
    expect(body.databaseName).toBe('siesa_agents_db');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4: snake_case naming via ApplySnakeCaseNaming() — verified via schema info
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — snake_case naming applied via ApplySnakeCaseNaming() in OnModelCreating', () => {
  test('should confirm ApplySnakeCaseNaming is active via schema-info endpoint', async ({
    request,
  }) => {
    // GIVEN: AppDbContext.OnModelCreating calls modelBuilder.ApplySnakeCaseNaming() as last statement
    // WHEN: A schema introspection endpoint confirms the naming convention
    const response = await request.get(`${API_BASE_URL}/health/db`);
    const body = await response.json();

    // THEN: Snake case naming convention is reported as active
    // RED: Will fail until health endpoint exposes naming convention status
    expect(body.snakeCaseNamingActive).toBe(true);
  });
});
