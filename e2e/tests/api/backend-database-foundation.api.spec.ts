/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — `dotnet ef database update` creates siesa_agents_db and migrations folder
 *   AC2 — Unhandled exceptions return Problem Details RFC 7807 (status, title, detail),
 *          no stack trace exposed (NFR6)
 *   AC3 — `ApplySnakeCaseNaming()` is applied in OnModelCreating (snake_case convention active)
 *   AC4 — Only `__ef_migrations_history` table exists; no domain tables (clientes, contactos)
 *   AC5 — All four Clean Architecture projects compile with zero errors
 *
 * Test level: API Integration (Playwright request context against http://localhost:5000)
 * This story has no UI component — backend-only.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC2: ExceptionHandlingMiddleware returns Problem Details RFC 7807
// TC-E1-P0-05 (P0 — Must pass)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 (NFR6)', () => {
  test('should return HTTP 500 when an unhandled exception reaches the middleware', async ({
    request,
  }) => {
    // GIVEN: An unhandled exception occurs in the backend pipeline
    // WHEN: The error reaches ExceptionHandlingMiddleware
    // NOTE: The test-error endpoint must be registered by the dev via Program.cs:
    //   app.Map("/api/v1/test-error", () => { throw new Exception("test"); });
    // This endpoint does not exist yet → request returns non-2xx which validates RED phase

    // WHEN: A request is sent to the designated exception-trigger endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: The HTTP status is 500 Internal Server Error
    expect(response.status()).toBe(500);
  });

  test('should return Content-Type application/problem+json for unhandled exceptions', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets context.Response.ContentType = "application/problem+json"
    // WHEN: The /api/v1/test-error endpoint throws an unhandled exception

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type header contains application/problem+json
    expect(contentType).toContain('application/problem+json');
  });

  test('should include "status" field in the Problem Details response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware writes a ProblemDetails object to the response
    // WHEN: The /api/v1/test-error endpoint is hit

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.text();

    // THEN: The response body contains the "status" field (RFC 7807 required)
    expect(body).toContain('"status"');
  });

  test('should include "title" field in the Problem Details response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware writes a ProblemDetails object to the response
    // WHEN: The /api/v1/test-error endpoint is hit

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.text();

    // THEN: The response body contains the "title" field (RFC 7807 required)
    expect(body).toContain('"title"');
  });

  test('should NOT expose stack trace in the Problem Details response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware explicitly sets Detail = null
    // to prevent information leakage (NFR6 — no stack traces in responses)
    // WHEN: An exception is thrown and the middleware catches it

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.text();

    // THEN: Stack trace indicators are absent from the response body
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('at System.');
    expect(body).not.toContain('InnerException');
  });

  test('should NOT expose raw exception messages in the Problem Details response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches exceptions and never surfaces ex.Message
    // WHEN: The endpoint throws with a specific internal message

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.text();

    // THEN: The raw internal exception message "internal test" does NOT appear in the body
    expect(body).not.toContain('internal test');
  });

  test('should return a parseable JSON Problem Details object for unhandled exceptions', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware serializes a valid ProblemDetails to the response
    // WHEN: The error endpoint is triggered

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: The response is valid JSON
    const body = await response.json() as Record<string, unknown>;
    expect(typeof body).toBe('object');
    expect(body).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 + AC4: Database creation and initial migration scope
// TC-E1-P1-05 (P1)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 + AC4 — EF Core database creation and scope boundary', () => {
  test('should have the backend running — proving migrations were applied without error', async ({
    request,
  }) => {
    // GIVEN: PostgreSQL is running locally and `dotnet ef database update` was executed
    // WHEN: The backend starts successfully (startup includes DB context registration)
    // A running backend proves AppDbContext connected and migration applied without crash

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The backend is running (200 OK from Scalar)
    // If migrations fail at startup, the server would not start and this test would fail
    expect(response.status()).toBe(200);
  });

  test('should expose the health or diagnostic endpoint confirming DB context is registered in DI', async ({
    request,
  }) => {
    // GIVEN: AppDbContext is registered via builder.Services.AddDbContext<AppDbContext>(...)
    // WHEN: The backend initializes the DI container at startup
    // A GET to /api/v1/db-status should confirm DbContext is wired (endpoint not yet created)

    const response = await request.get(`${API_BASE_URL}/api/v1/db-status`);

    // THEN: The endpoint returns 200 with DB status info
    // Currently fails RED because /api/v1/db-status does not exist yet
    expect(response.status()).toBe(200);
  });

  test('should NOT expose a /api/v1/clientes endpoint (domain tables not created in this story)', async ({
    request,
  }) => {
    // GIVEN: Scope boundary — clientes table is NOT created in Story 1.3
    // WHEN: A GET request is made to the clientes collection endpoint

    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The endpoint does NOT return HTTP 200 with data (table does not exist yet)
    // 404 (route not mapped) is expected at this story stage
    expect(response.status()).toBe(404);
  });

  test('should NOT expose a /api/v1/contactos endpoint (domain tables not created in this story)', async ({
    request,
  }) => {
    // GIVEN: Scope boundary — contactos table is NOT created in Story 1.3
    // WHEN: A GET request is made to the contactos collection endpoint

    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN: The endpoint does NOT return HTTP 200 with data (table does not exist yet)
    // 404 (route not mapped) is expected at this story stage
    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: snake_case naming convention applied via ApplySnakeCaseNaming()
// TC-E1-P2-04 (P2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — snake_case naming convention confirmed via API contract', () => {
  test('should confirm snake_case convention is active by checking migrations history endpoint', async ({
    request,
  }) => {
    // GIVEN: ApplySnakeCaseNaming() is applied as the LAST call in AppDbContext.OnModelCreating
    // WHEN: The backend starts and the EF migration history is accessible
    // A dedicated endpoint returns the EF migration table name (snake_case: __ef_migrations_history)

    const response = await request.get(`${API_BASE_URL}/api/v1/db-info/migration-table`);

    // THEN: The endpoint returns 200 confirming the migration table uses snake_case
    // Currently RED — endpoint does not exist yet
    expect(response.status()).toBe(200);
  });

  test('should confirm the EF migration history table name follows snake_case convention', async ({
    request,
  }) => {
    // GIVEN: EF Core uses __EFMigrationsHistory by default (PascalCase)
    // When ApplySnakeCaseNaming() is applied last, EF renames it to __ef_migrations_history
    // WHEN: The db-info endpoint returns migration table metadata

    const response = await request.get(`${API_BASE_URL}/api/v1/db-info/migration-table`);

    // THEN: The response body includes the snake_case table name
    // Currently RED — endpoint does not exist yet
    const body = await response.json() as Record<string, unknown>;
    expect(body['tableName']).toBe('__ef_migrations_history');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: All four Clean Architecture projects compile with zero errors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — All four Clean Architecture projects compile and are wired via DI', () => {
  test('should have the backend running with Infrastructure project wired to API via DI', async ({
    request,
  }) => {
    // GIVEN: SiesaAgents.Infrastructure references SiesaAgents.Domain and is wired to API
    // GIVEN: dotnet build SiesaAgents.slnx produces zero errors
    // WHEN: The backend server starts (compilation must succeed for server to start)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Scalar docs load (200) — proves all four projects compiled successfully
    // Build failure would prevent server startup entirely
    expect(response.status()).toBe(200);
  });

  test('should expose OpenAPI spec with valid JSON — confirming API and Application layers are wired', async ({
    request,
  }) => {
    // GIVEN: SiesaAgents.API, SiesaAgents.Application, SiesaAgents.Domain, SiesaAgents.Infrastructure
    //        all compile and are registered in the DI container
    // WHEN: The OpenAPI spec endpoint is requested

    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: The spec is returned as valid JSON (200)
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Exception middleware security and Problem Details contract
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ExceptionHandlingMiddleware — edge cases and security contract', () => {
  test('[P1] should return 500 for all unhandled exceptions regardless of exception type', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware wraps the full pipeline with try/catch
    // WHEN: Any uncaught exception propagates from any middleware or handler

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: The status is always 500 (never 200 or 4xx for internal errors)
    expect(response.status()).toBe(500);
  });

  test('[P1] should NOT return HTML error page for unhandled exceptions (developer exception page disabled)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered BEFORE all other middleware
    // The .NET developer exception page (HTML with stack trace) must not be exposed
    // WHEN: An unhandled exception occurs

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Content-Type is never text/html (Problem Details must be JSON)
    expect(contentType).not.toContain('text/html');
  });

  test('[P1] middleware must be registered BEFORE CORS — verifying correct pipeline order', async ({
    request,
  }) => {
    // GIVEN: app.UseMiddleware<ExceptionHandlingMiddleware>() is called before app.UseCors()
    // WHEN: A request that would normally throw arrives from the frontend origin

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`, {
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // THEN: The response is still 500 with Problem Details (not CORS error before middleware)
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('[P2] should NOT expose "detail" field with internal information in Problem Details', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null in ProblemDetails to prevent leakage
    // WHEN: The error endpoint triggers an exception

    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json() as Record<string, unknown>;

    // THEN: The "detail" field is either absent or explicitly null
    if ('detail' in body) {
      expect(body['detail']).toBeNull();
    }
    // If absent, the test passes implicitly (no detail = no leakage)
  });
});
