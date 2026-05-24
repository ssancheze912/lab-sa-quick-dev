/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — `dotnet ef database update` creates siesa_agents_db with no errors;
 *          EF Core migrations folder exists in SiesaAgents.Infrastructure.
 *          (Verified at runtime: backend starts and DI resolves AppDbContext.)
 *   AC2 — Unhandled exceptions return Problem Details RFC 7807 format with
 *          content-type application/problem+json and no stack traces exposed.
 *   AC4 — AppDbContext resolves from DI via DefaultConnection;
 *          dotnet build SiesaAgents.sln succeeds with zero errors.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — EF Core database infrastructure: siesa_agents_db created, migrations present
// The backend can only start if AppDbContext is registered and the migration ran.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — EF Core database infrastructure', () => {
  test('should have the backend running, proving AppDbContext DI registration succeeded', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered via AddDbContext<AppDbContext> in Program.cs
    //        using the DefaultConnection from appsettings.Development.json
    // WHEN: The backend server is queried (DI container initialised on startup)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds — proves AppDbContext was resolved without DI errors
    // A missing DbContext registration throws at startup before the server accepts any request
    expect(response.status()).toBe(200);
  });

  test('should NOT expose database connection details in any error response', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered pointing to siesa_agents_db
    // WHEN: Any non-existent endpoint is requested (triggering an error response)

    const response = await request.get(`${API_BASE_URL}/api/db-probe-does-not-exist`);
    const body = await response.text();

    // THEN: No PostgreSQL connection string fragments are exposed in the response
    const sensitiveKeywords = ['Host=', 'Password=', 'Username=', 'siesa_agents_db', 'postgres'];
    for (const keyword of sensitiveKeywords) {
      expect(body).not.toContain(keyword);
    }
  });

  test('should return a non-500 status for the health probe, showing DB layer did not crash startup', async ({
    request,
  }) => {
    // GIVEN: The backend has completed startup with EF Core registered
    //        and the initial migration applied to siesa_agents_db
    // WHEN: The root endpoint is hit

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: The server is responsive — not a crash-loop caused by missing migrations
    // 404 is acceptable (no root route defined), 500 means startup error
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(0); // 0 = connection refused
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Problem Details RFC 7807: unhandled exceptions return structured error
// ExceptionHandlingMiddleware must set Content-Type: application/problem+json
// with `status`, `title`, `detail` keys and NO stack trace exposure.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — Problem Details RFC 7807 for unhandled exceptions', () => {
  test('should return application/problem+json content-type on 5xx errors', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered BEFORE routing in Program.cs
    // WHEN: A request triggers the middleware (simulated via the dedicated test trigger endpoint)

    // NOTE: We use a route that the middleware will catch if an unhandled exception occurs.
    // The dedicated trigger endpoint /api/test/trigger-exception is added by the DEV team
    // as part of implementing AC2. Until then, this test fails (RED phase).
    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: Response content-type is application/problem+json (RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return HTTP 500 status for unhandled exception', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps all request processing
    // WHEN: An unhandled exception is thrown inside the request pipeline

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: The HTTP status code is 500 Internal Server Error
    expect(response.status()).toBe(500);
  });

  test('should include "status" key in Problem Details response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware serialises ProblemDetails to JSON
    // WHEN: An unhandled exception reaches the middleware

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);
    const body = await response.json();

    // THEN: The JSON body contains the "status" key (RFC 7807 required field)
    expect(body).toHaveProperty('status');
    expect(body.status).toBe(500);
  });

  test('should include "title" key in Problem Details response body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets ProblemDetails.Title
    // WHEN: An unhandled exception reaches the middleware

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);
    const body = await response.json();

    // THEN: The JSON body contains the "title" key (RFC 7807 required field)
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('should NOT expose stack trace in Problem Details response body (NFR6)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (no internal message exposed)
    // WHEN: An unhandled exception occurs

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);
    const body = await response.text();

    // THEN: No stack trace indicators are present in the response body
    const stackTraceIndicators = [
      'at System.',
      'at SiesaAgents.',
      'StackTrace',
      'System.Exception',
      'Microsoft.AspNetCore',
      'at Microsoft.',
    ];
    for (const indicator of stackTraceIndicators) {
      expect(body).not.toContain(indicator);
    }
  });

  test('should NOT expose internal exception message in Problem Details body (NFR6)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware does NOT include the exception.Message in Detail
    // WHEN: An unhandled exception with a specific internal message is thrown

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);
    const body = await response.text();

    // THEN: The raw exception message "test error" is NOT echoed back to the client
    expect(body).not.toContain('test error');
    expect(body).not.toContain('System.Exception');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — AppDbContext resolves from DI using DefaultConnection;
//        dotnet build SiesaAgents.sln succeeds with zero errors.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — AppDbContext DI resolution and solution build integrity', () => {
  test('should have the backend responding, proving solution compiled with zero errors', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln includes all four projects
    //        (API, Application, Domain, Infrastructure)
    // WHEN: The backend is queried (build must succeed for server to start)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds — proves compilation succeeded with no errors
    // A build failure prevents the server from starting; DI resolution error causes 500 on startup
    expect(response.status()).toBe(200);
  });

  test('should respond to the DI probe endpoint confirming AppDbContext is resolvable', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered via AddDbContext<AppDbContext>(...UseNpgsql(...)) in Program.cs
    //        SiesaAgents.API.csproj references SiesaAgents.Infrastructure.csproj
    // WHEN: A probe endpoint that resolves AppDbContext from the DI container is requested
    //       (/api/test/db-context-probe is added by the DEV team as part of AC4 implementation)

    const response = await request.get(`${API_BASE_URL}/api/test/db-context-probe`);

    // THEN: Server returns 200 (AppDbContext resolved) — not 500 (DI failure)
    expect(response.status()).toBe(200);
  });

  test('should NOT return 500 on startup indicating DI container misconfiguration', async ({
    request,
  }) => {
    // GIVEN: All four Clean Architecture projects are referenced correctly
    // WHEN: Any valid endpoint is accessed after server startup

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server is fully operational — no startup DI exception
    expect(response.status()).not.toBe(500);
  });
});
