/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 on unhandled exceptions.
 *          HTTP 500, Content-Type: application/problem+json, body has status/title/detail,
 *          NO stackTrace/exception/innerException keys exposed. (NFR6)
 *   AC5 — Backend starts without database-related errors (connection string read from
 *          appsettings.Development.json under ConnectionStrings:DefaultConnection).
 *   AC6 — Backend builds and all endpoints respond (SiesaAgents.Infrastructure with EF Core
 *          and Npgsql packages compiles successfully).
 *
 * Maps to test cases: TC-E1-P0-05, TC-E1-P1-05 (runtime verification layer)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807
// RED: Fails until /api/v1/test-error endpoint exists and middleware is wired
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware Problem Details RFC 7807', () => {
  test('should return HTTP 500 when an unhandled exception occurs', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered BEFORE UseCors in Program.cs
    // WHEN: A request triggers an unhandled exception on the test-error endpoint

    // CRITICAL: Intercept route before navigation (network-first pattern)
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: Response status is 500 Internal Server Error
    expect(response.status()).toBe(500);
  });

  test('should return Content-Type application/problem+json on unhandled exception', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets the Content-Type response header
    // WHEN: The test-error endpoint throws an unhandled exception

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type header contains application/problem+json
    expect(contentType).toContain('application/problem+json');
  });

  test('should return body with status field in Problem Details response', async ({ request }) => {
    // GIVEN: RFC 7807 requires a 'status' member in Problem Details
    // WHEN: The middleware processes the unhandled exception

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: JSON body contains 'status' field
    expect(body).toHaveProperty('status');
  });

  test('should return body with title field in Problem Details response', async ({ request }) => {
    // GIVEN: RFC 7807 requires a 'title' member in Problem Details
    // WHEN: The middleware processes the unhandled exception

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: JSON body contains 'title' field
    expect(body).toHaveProperty('title');
  });

  test('should NOT expose stackTrace key in Problem Details response (NFR6)', async ({
    request,
  }) => {
    // GIVEN: NFR6 prohibits stack trace exposure to clients
    // WHEN: An unhandled exception is processed by the middleware

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: Response body does NOT contain 'stackTrace' key
    expect(body).not.toHaveProperty('stackTrace');
  });

  test('should NOT expose exception key in Problem Details response (NFR6)', async ({
    request,
  }) => {
    // GIVEN: NFR6 prohibits raw exception details exposure
    // WHEN: An unhandled exception is processed by the middleware

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: Response body does NOT contain 'exception' key
    expect(body).not.toHaveProperty('exception');
  });

  test('should NOT expose innerException key in Problem Details response (NFR6)', async ({
    request,
  }) => {
    // GIVEN: NFR6 prohibits inner exception details exposure
    // WHEN: An unhandled exception is processed by the middleware

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: Response body does NOT contain 'innerException' key
    expect(body).not.toHaveProperty('innerException');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Backend starts without database-related errors
// RED: Fails until AppDbContext is registered in DI and connection string configured
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Backend starts with valid database connection configuration', () => {
  test('should start without database-related errors (API responds after DB context registered)', async ({
    request,
  }) => {
    // GIVEN: AppDbContext registered with UseNpgsql() in Program.cs
    //        Connection string Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres
    //        in appsettings.Development.json under ConnectionStrings:DefaultConnection
    // WHEN: The backend starts and the Scalar docs endpoint is requested

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Backend responds (no startup crash due to missing DB config)
    // HTTP 200 confirms Program.cs loaded AppDbContext registration without throwing
    expect(response.status()).toBe(200);
  });

  test('should not return 500 on normal requests after AppDbContext registration', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered in DI — a bad registration causes 500 on all requests
    // WHEN: A GET request to the Scalar endpoint is made

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Response is not a 500 (confirming DI registration succeeded)
    expect(response.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Infrastructure with EF Core and Npgsql packages compiles (runtime proxy)
// RED: Fails until SiesaAgents.Infrastructure.csproj has EF Core Design package
//      and the solution builds successfully
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — SiesaAgents.Infrastructure with EF Core packages compiles and runs', () => {
  test('should serve API after Infrastructure project with EF Core packages builds successfully', async ({
    request,
  }) => {
    // GIVEN: SiesaAgents.Infrastructure.csproj has Npgsql.EF and Microsoft.EF.Design packages
    //        dotnet build SiesaAgents.sln exits with code 0
    // WHEN: Backend is running (it can only run if all projects built successfully)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server is reachable — proves Infrastructure compiled without errors
    expect(response.status()).toBe(200);
  });
});
