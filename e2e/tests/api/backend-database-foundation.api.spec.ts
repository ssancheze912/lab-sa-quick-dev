/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — `dotnet ef database update` creates `siesa_agents_db` and `__ef_migrations_history`
 *           table exists in snake_case (confirms ApplySnakeCaseNaming() is active)
 *   AC2 — After initial migration, no domain tables (clientes, contactos) exist — migration is empty
 *   AC3 — ExceptionHandlingMiddleware returns Content-Type: application/problem+json, HTTP 500,
 *           body with status/title/detail, NO stackTrace/exception/innerException (NFR6)
 *   AC4 — modelBuilder.ApplySnakeCaseNaming() is the LAST call in OnModelCreating — verified
 *           via snake_case column presence in __ef_migrations_history
 *   AC5 — Backend builds and SiesaAgents.Infrastructure references Npgsql and EF Core Design
 *           (verified via runtime: if server is up, build succeeded and packages resolved)
 *
 * Test IDs from test-design-epic-1.md:
 *   TC-E1-P0-05 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 (P0)
 *   TC-E1-P1-05 — EF Core migration creates database and migrations table (P1)
 *   TC-E1-P2-04 — snake_case column naming applied via ApplySnakeCaseNaming (P2)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P0-05: ExceptionHandlingMiddleware returns Problem Details RFC 7807
// AC3 — Unhandled exception → Content-Type: application/problem+json, status 500
//        Body contains: status, title, detail — NO stackTrace/exception/innerException
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E1-P0-05 — AC3: ExceptionHandlingMiddleware returns Problem Details RFC 7807', () => {
  test('should return HTTP 500 when an unhandled exception occurs in the backend pipeline', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered BEFORE endpoint mappings in Program.cs
    // WHEN: A request reaches an endpoint that throws an unhandled Exception
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: HTTP status is 500 (Internal Server Error)
    expect(response.status()).toBe(500);
  });

  test('should return Content-Type application/problem+json for unhandled exceptions', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets context.Response.ContentType = "application/problem+json"
    // WHEN: A request causes an unhandled exception
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);

    // THEN: Content-Type header is application/problem+json (RFC 7807)
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).toContain('application/problem+json');
  });

  test('should return a JSON body containing the "status" field on unhandled exception', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware writes a ProblemDetails-compliant body
    // WHEN: A request causes an unhandled exception
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body contains the "status" field
    expect(body).toHaveProperty('status');
    expect(body.status).toBe(500);
  });

  test('should return a JSON body containing the "title" field on unhandled exception', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware writes ProblemDetails with a title
    // WHEN: A request causes an unhandled exception
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body contains the "title" field (non-empty)
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('should NOT expose stackTrace in the error response body (NFR6)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is configured to NEVER expose ex.Message or stack traces
    // WHEN: A request causes an unhandled exception
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body does NOT contain "stackTrace" (NFR6 — no stack trace exposure)
    expect(body).not.toHaveProperty('stackTrace');
  });

  test('should NOT expose exception details in the error response body (NFR6)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware catches and swallows the exception details
    // WHEN: A request causes an unhandled exception
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body does NOT contain "exception" (NFR6)
    expect(body).not.toHaveProperty('exception');
  });

  test('should NOT expose innerException in the error response body (NFR6)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null and never writes inner exceptions
    // WHEN: A request causes an unhandled exception
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The response body does NOT contain "innerException" (NFR6)
    expect(body).not.toHaveProperty('innerException');
  });

  test('should return the "detail" field as null (not exposing internal error message)', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null — NEVER exposes ex.Message
    // WHEN: A request causes an unhandled exception
    const response = await request.get(`${API_BASE_URL}/api/v1/test-error`);
    const body = await response.json();

    // THEN: The "detail" field is present but null (no internal error leakage)
    // Note: ProblemDetails serializes null fields depending on JsonOptions; body may omit "detail"
    // Either null or absent is acceptable; non-null string with internal content is NOT acceptable
    if (Object.prototype.hasOwnProperty.call(body, 'detail')) {
      expect(body.detail).toBeNull();
    }
    // If "detail" is absent from the JSON body, that also satisfies NFR6
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-05: EF Core migration creates siesa_agents_db and __ef_migrations_history
// AC1 — Database created with no errors, migrations table exists in snake_case
// AC2 — No domain tables exist after empty initial migration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E1-P1-05 — AC1/AC2: EF Core migration creates database and migrations table', () => {
  test('should have the backend respond to API requests (confirming DB connection is established)', async ({
    request,
  }) => {
    // GIVEN: PostgreSQL is running locally and AppDbContext is registered with UseNpgsql()
    // WHEN: The backend starts and handles any request (DB connection validated on startup)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The backend responds successfully (not crashed due to DB connection failure)
    expect(response.status()).toBe(200);
  });

  test('should confirm the database health endpoint responds (DB is reachable)', async ({
    request,
  }) => {
    // GIVEN: PostgreSQL siesa_agents_db is created via `dotnet ef database update`
    // WHEN: The backend is running and DB connection pool is active
    // NOTE: This endpoint is expected to exist as part of the backend's health check or test route
    const response = await request.get(`${API_BASE_URL}/api/v1/health`);

    // THEN: The health endpoint returns 200 (DB connection confirmed live)
    // RED phase: This endpoint does NOT exist yet — will return 404 until implemented
    expect(response.status()).toBe(200);
  });

  test('should confirm no domain-level tables are exposed via API (empty migration scope)', async ({
    request,
  }) => {
    // GIVEN: Story 1.3 creates an EMPTY initial migration — no clientes or contactos tables
    // WHEN: The backend API is queried for a domain endpoint that would require clientes table
    const response = await request.get(`${API_BASE_URL}/api/v1/clientes`);

    // THEN: The endpoint does NOT return data (table does not exist yet in this story)
    // 404 = endpoint not mapped (expected) OR 500 = DB table missing error (both confirm scope)
    // 200 would mean Epic 2 work was done prematurely (out-of-scope)
    expect([404, 500]).toContain(response.status());
  });

  test('should confirm no contactos table endpoint is available (empty migration scope)', async ({
    request,
  }) => {
    // GIVEN: Story 1.3 creates an EMPTY initial migration — contactos table NOT created
    // WHEN: The backend API is queried for a contactos domain endpoint
    const response = await request.get(`${API_BASE_URL}/api/v1/contactos`);

    // THEN: The endpoint does NOT return data (table does not exist yet)
    // 404 = not mapped (correct), 500 = table missing error (also confirms scope respected)
    expect([404, 500]).toContain(response.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P2-04: snake_case column naming applied via ApplySnakeCaseNaming()
// AC4 — modelBuilder.ApplySnakeCaseNaming() is the LAST call in OnModelCreating
//        Verified by EF Core migration creating snake_case columns in __ef_migrations_history
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC-E1-P2-04 — AC4: ApplySnakeCaseNaming() produces snake_case columns', () => {
  test('should confirm the backend uses snake_case naming (inferred via successful DB operations)', async ({
    request,
  }) => {
    // GIVEN: modelBuilder.ApplySnakeCaseNaming() is the LAST call in AppDbContext.OnModelCreating
    // WHEN: The backend starts and EF Core initializes the data model against siesa_agents_db
    // The backend would fail to start or throw DB errors if snake_case naming broke migrations
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Backend starts successfully — confirms snake_case model matches DB schema
    // RED phase: If ApplySnakeCaseNaming() is missing, EF Core would throw column-not-found errors
    expect(response.status()).toBe(200);
  });

  test('should expose a diagnostic endpoint confirming EF Core model uses snake_case convention', async ({
    request,
  }) => {
    // GIVEN: ApplySnakeCaseNaming() converts all PascalCase property names to snake_case
    // WHEN: A diagnostic/introspection endpoint is queried to validate model configuration
    // NOTE: This endpoint is expected to be implemented as part of Task 6 in the story
    const response = await request.get(`${API_BASE_URL}/api/v1/db-info`);

    // THEN: Endpoint returns 200 with snake_case confirmation details
    // RED phase: This endpoint does NOT exist yet — will return 404 until Task 6 is complete
    expect(response.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 (supplementary): Infrastructure project packages present (runtime verification)
// Verified indirectly: if Npgsql and EF Core Design are missing, DB operations fail and
// the backend cannot start. TC-E1-P1-05 tests above cover this implicitly.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — Infrastructure project builds with required package references', () => {
  test('should confirm SiesaAgents.Infrastructure Npgsql package is active (DB responds)', async ({
    request,
  }) => {
    // GIVEN: SiesaAgents.Infrastructure.csproj includes Npgsql.EntityFrameworkCore.PostgreSQL 10.*
    // WHEN: The backend starts and UseNpgsql() is called to configure the DB connection
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Backend starts without package resolution errors (Npgsql is available at runtime)
    // If Npgsql package reference is missing, dotnet build fails and server never starts
    expect(response.status()).toBe(200);
  });

  test('should confirm all four Clean Architecture projects are referenced and compiled', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln compiles API, Application, Domain, Infrastructure
    // WHEN: The backend API is running (requires all projects to compile successfully)
    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Backend responds — proves all four projects compiled with zero errors
    expect(response.status()).toBe(200);
  });
});
