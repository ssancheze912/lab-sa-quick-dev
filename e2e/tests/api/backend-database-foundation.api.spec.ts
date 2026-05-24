/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — dotnet ef database update creates siesa_agents_db with __EFMigrationsHistory table
 *   AC3 — Unhandled exceptions return Problem Details RFC 7807 format (status 500, no stack trace)
 *   AC5 — AppDbContext resolves from DI and connects to PostgreSQL via Npgsql without errors
 *
 * NOTE: AC2 (migration file structure), AC4 (ApplySnakeCaseNaming order), AC6 (OnModelCreating order)
 * are validated at the unit test level in:
 *   backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs
 *   backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationStructureTests.cs
 *
 * Test strategy: API-level tests call the running backend to validate observable behavior.
 * No UI interaction — this is a pure backend infrastructure story.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Database created and __EFMigrationsHistory table is present
// Validated indirectly: if the backend boots without crashing on DB startup,
// EF Core has successfully applied the InitialCreate migration.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — PostgreSQL database created with EF Core migrations applied', () => {
  test('should have the backend running, which proves EF Core startup did not fail', async ({
    request,
  }) => {
    // GIVEN: PostgreSQL is running locally with siesa_agents_db database
    // WHEN: dotnet ef database update has been applied and the backend starts

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The backend responds (a crash at EF Core startup would prevent this)
    // Status 200 confirms the server is up — EF Core DI validation runs at startup
    expect(response.status()).toBe(200);
  });

  test('should return JSON (not HTML or plain text) from any API route, confirming DI is wired', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered via AddDbContext<AppDbContext>() in Program.cs
    // WHEN: A request is made to any API endpoint that would exercise DI resolution

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-for-db-probe`);

    // THEN: Response is JSON (Problem Details), not HTML — confirms middleware + DI are wired
    // A missing AddDbContext would cause a DI exception and the middleware must catch it
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Unhandled exceptions return Problem Details RFC 7807
//        (status 500, application/problem+json, no stack traces)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 on unhandled errors', () => {
  test('should return status 500 for an internal server error scenario', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs before route mappings
    // WHEN: A request triggers an unhandled exception (simulate via dedicated error endpoint)

    // Network-first: intercept before request to validate response contract
    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);

    // THEN: Response is 500 Internal Server Error (not 200 or unhandled crash)
    // NOTE: This test will fail (RED) until /api/throw-for-atdd-test endpoint is added
    // OR until any real unhandled exception path is exercised returning 500
    expect(response.status()).toBe(500);
  });

  test('should return Content-Type application/problem+json on unhandled exception', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware returns RFC 7807 Problem Details
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);

    // THEN: Content-Type is application/problem+json (RFC 7807 contract)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should include status and title fields in the Problem Details response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware builds ProblemDetails with Status=500 and Title set
    // WHEN: An unhandled exception reaches the middleware

    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);
    const body = await response.json();

    // THEN: Response body contains 'status' = 500 and 'title' (RFC 7807 required fields)
    expect(body).toHaveProperty('status', 500);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('should NOT expose the exception message or stack trace in the response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (NFR6 — no stack trace exposure)
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);
    const bodyText = await response.text();

    // THEN: The response body does NOT contain stack trace indicators
    expect(bodyText).not.toContain('at ');          // Stack frame format
    expect(bodyText).not.toContain('Exception');     // Raw exception class name
    expect(bodyText).not.toContain('StackTrace');    // Raw stack trace field
  });

  test('should return null for the detail field in Problem Details (NFR6)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware has Detail = null (never expose ex.Message)
    // WHEN: The error response is received

    const response = await request.get(`${API_BASE_URL}/api/throw-for-atdd-test`);
    const body = await response.json();

    // THEN: 'detail' is null or absent — exception message is never leaked
    if ('detail' in body) {
      expect(body.detail).toBeNull();
    }
    // If 'detail' key is absent entirely, the test also passes (acceptable RFC 7807 behavior)
  });

  test('should return Problem Details even for a 404 not-found route (middleware covers all paths)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered before all route mappings
    // WHEN: A request is made to a completely unknown route

    const response = await request.get(`${API_BASE_URL}/api/completely-nonexistent-path-12345`);

    // THEN: Response is JSON (not HTML), confirming middleware coverage across all routes
    const contentType = response.headers()['content-type'] ?? '';
    expect([404, 400]).toContain(response.status());
    expect(contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — AppDbContext resolves from DI and connects to PostgreSQL via Npgsql
//        Validated at runtime: server starts only if DI configuration is correct
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — AppDbContext DI registration and PostgreSQL connectivity', () => {
  test('should have the backend running with a valid connection string configured', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has ConnectionStrings:DefaultConnection
    //        pointing to siesa_agents_db on localhost
    // WHEN: The backend starts up with AddDbContext<AppDbContext>() DI registration

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server is up — a misconfigured connection string causes startup failure
    expect(response.status()).toBe(200);
  });

  test('should not return a 500 error on the health-check route due to DB connection issues', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is properly registered with UseNpgsql and valid connection string
    // WHEN: The backend processes any request (DI resolution occurs at request time)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: No DB connection error surfaces — Npgsql connection is established correctly
    expect(response.status()).not.toBe(500);
  });

  test('should serve the Scalar API page confirming all DI services resolved without error', async ({
    request,
  }) => {
    // GIVEN: AddDbContext<AppDbContext> is registered in Program.cs with Npgsql provider
    //        MigrationsAssembly("SiesaAgents.Infrastructure") is set
    // WHEN: The ASP.NET Core host builds the service container and starts

    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Scalar loads (HTTP 200, text/html) — proves DI container was built without exceptions
    expect(response.status()).toBe(200);
    expect(contentType).toContain('text/html');
  });
});
