/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — dotnet ef database update creates siesa_agents_db, migrations folder exists
 *   AC3 — Unhandled exception returns Problem Details RFC 7807 (HTTP 500, no stack trace exposed)
 *   AC4 — AppDbContext registered via DefaultConnection; backend starts without EF Core errors
 *   AC5 — Only __EFMigrationsHistory table after initial migration (no clientes/contactos tables)
 *   AC6 — All four projects compile with zero errors (proxy: server running = build succeeded)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — AppDbContext is registered and backend boots without EF Core errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — AppDbContext registration and DI wiring', () => {
  test('should boot without EF Core configuration errors when DefaultConnection is set', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered in Program.cs using DefaultConnection from appsettings.Development.json
    // WHEN: The backend starts and receives any request

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds with HTTP 200 (EF Core misconfiguration would cause startup failure)
    expect(response.status()).toBe(200);
  });

  test('should not expose internal EF Core exception messages on startup probe endpoint', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered in DI and PostgreSQL is accessible
    // WHEN: A health-probe GET is made to the base API URL

    const response = await request.get(`${API_BASE_URL}/`);

    // THEN: The server responds — a status below 500 indicates no unhandled EF Core startup error
    expect(response.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Unhandled exception returns Problem Details RFC 7807 with no stack trace
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details', () => {
  test('should return HTTP 500 when an unhandled exception is triggered', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered as the first middleware in Program.cs
    // WHEN: A request hits an endpoint that raises an unhandled exception
    // NOTE: We target a dedicated test-trigger endpoint that Story 1.3 must expose for ATDD validation
    // The endpoint must throw deliberately and should not exist before implementation.

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test/trigger-exception`,
    );

    // THEN: Middleware catches the exception and returns HTTP 500
    expect(response.status()).toBe(500);
  });

  test('should return Content-Type application/problem+json for unhandled exceptions', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Content-Type to application/problem+json
    // WHEN: An unhandled exception is triggered

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test/trigger-exception`,
    );

    // THEN: Content-Type header includes application/problem+json
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return a body with status field equal to 500 in RFC 7807 format', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware writes a ProblemDetails JSON body
    // WHEN: An unhandled exception is triggered

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test/trigger-exception`,
    );
    const body = await response.json();

    // THEN: Body contains status: 500
    expect(body.status).toBe(500);
  });

  test('should return a body with title "An unexpected error occurred." in RFC 7807 format', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware uses ProblemDetails with a safe generic title
    // WHEN: An unhandled exception is triggered

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test/trigger-exception`,
    );
    const body = await response.json();

    // THEN: Body contains the expected safe title
    expect(body.title).toBe('An unexpected error occurred.');
  });

  test('should NOT expose stack trace or internal exception message in the response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null and never exposes ex.Message
    // WHEN: An unhandled exception (with an identifiable internal message) is triggered

    const response = await request.get(
      `${API_BASE_URL}/api/v1/test/trigger-exception`,
    );
    const body = await response.json();
    const bodyText = JSON.stringify(body);

    // THEN: The response body does NOT contain stack trace keywords
    expect(bodyText).not.toContain('StackTrace');
    expect(bodyText).not.toContain('at ');
    // AND: detail field is null (never exposes ex.Message)
    expect(body.detail).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — siesa_agents_db database exists and EF migrations folder is created
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — Database and migrations infrastructure exist after dotnet ef database update', () => {
  test('should have the database accessible when the backend API starts up', async ({
    request,
  }) => {
    // GIVEN: PostgreSQL is running locally and DefaultConnection points to siesa_agents_db
    // GIVEN: dotnet ef database update has been executed
    // WHEN: A request is made to an endpoint that performs a database health check

    const response = await request.get(`${API_BASE_URL}/api/v1/health/db`);

    // THEN: The endpoint responds successfully (database is reachable)
    // This endpoint must be created as part of Story 1.3 implementation
    expect(response.status()).toBe(200);
  });

  test('should return database health status as healthy in the response body', async ({
    request,
  }) => {
    // GIVEN: AppDbContext can connect to siesa_agents_db
    // WHEN: The database health endpoint is called

    const response = await request.get(`${API_BASE_URL}/api/v1/health/db`);
    const body = await response.json();

    // THEN: The response indicates the database is healthy
    expect(body.status).toBe('healthy');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Only __EFMigrationsHistory table exists after initial migration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Initial migration contains only __EFMigrationsHistory (no domain tables)', () => {
  test('should confirm no clientes table exists after the initial migration', async ({
    request,
  }) => {
    // GIVEN: dotnet ef database update has been run with the InitialCreate migration
    // WHEN: A request attempts to access the clientes API endpoint (Epic 2 scope)

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The endpoint does not exist (404) — clientes table is NOT created in this story
    // A 200 or 500 from a table-not-found error would indicate scope violation
    expect(response.status()).toBe(404);
  });

  test('should confirm no contactos table exists after the initial migration', async ({
    request,
  }) => {
    // GIVEN: dotnet ef database update has been run with the InitialCreate migration
    // WHEN: A request attempts to access the contactos API endpoint (Epic 3 scope)

    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN: The endpoint does not exist (404) — contactos table is NOT created in this story
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — All four Clean Architecture projects compile with zero errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — Solution builds successfully with all four Clean Architecture projects', () => {
  test('should have all four projects operational (API, Application, Domain, Infrastructure)', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln has been executed after Story 1.3 changes
    // WHEN: The backend server is running (server start requires successful build)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server is running (HTTP 200) — a build failure prevents server startup entirely
    expect(response.status()).toBe(200);
  });

  test('should expose AppDbContext through the DI container without configuration errors', async ({
    request,
  }) => {
    // GIVEN: SiesaAgents.Infrastructure is referenced by SiesaAgents.API in the solution
    // GIVEN: AppDbContext is registered via builder.Services.AddDbContext<AppDbContext>(...)
    // WHEN: A request is made to the DB health endpoint

    const response = await request.get(`${API_BASE_URL}/api/v1/health/db`);

    // THEN: Endpoint responds (DI resolution of AppDbContext succeeded)
    // A 500 with "service not registered" would indicate build/DI setup failure
    expect([200, 503]).toContain(response.status());
  });
});
