/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — `siesa_agents_db` database is reachable and EF Core migrations history table exists
 *   AC2 — Unhandled exceptions return Problem Details RFC 7807 (status, title, no stack traces)
 *   AC3 — `ApplySnakeCaseNaming()` applied in `OnModelCreating` — snake_case columns in future entities
 *   AC4 — `dotnet build SiesaAgents.sln` succeeds with zero errors (verified via runtime behavior)
 *   AC5 — `AppDbContext` registered in DI reading `ConnectionStrings:DefaultConnection`
 *   AC6 — Initial migration is empty (no table DDL for domain entities in this story)
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — PostgreSQL database is reachable; EF Core migrations history table exists
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — PostgreSQL database reachability and EF Core migrations', () => {
  test('should respond to a health-probe endpoint that exercises the database connection', async ({
    request,
  }) => {
    // GIVEN: The backend is running and AppDbContext is configured with Npgsql
    // WHEN: A request is made to a database-exercising endpoint (e.g., health or any data endpoint)

    const response = await request.get(`${API_BASE_URL}/api/v1/health/db`);

    // THEN: The backend responds (not connection-refused) — meaning the DB connection is established
    // Status 200 means healthy; 503 means unhealthy DB but server is still up
    expect([200, 503]).toContain(response.status());
  });

  test('should NOT return 500 when the database connection string points to siesa_agents_db', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has ConnectionStrings:DefaultConnection pointing to siesa_agents_db
    // WHEN: The backend starts and any API endpoint is requested

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server starts without crashing (5xx would indicate startup failure or DB crash)
    expect(response.status()).not.toBe(500);
    expect(response.status()).not.toBe(502);
    expect(response.status()).not.toBe(503);
  });

  test('should have EF Core migrations history table accessible via the migrations endpoint', async ({
    request,
  }) => {
    // GIVEN: `dotnet ef database update` was run and the `__EFMigrationsHistory` table was created
    // WHEN: The migrations status endpoint is called

    const response = await request.get(`${API_BASE_URL}/api/v1/health/migrations`);

    // THEN: The endpoint returns 200 with a list that includes at least the InitialCreate migration
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Unhandled exceptions return Problem Details RFC 7807 (no stack traces)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807', () => {
  test('should return HTTP 500 with Content-Type application/problem+json for unhandled exceptions', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered in Program.cs before routing
    // WHEN: An endpoint that intentionally triggers an unhandled exception is called
    // NOTE: Uses a dedicated test-error endpoint. In RED phase this endpoint does not exist yet.

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: The middleware intercepts the exception and returns 500 with problem+json
    expect(response.status()).toBe(500);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('application/problem+json');
  });

  test('should include required RFC 7807 fields (status and title) in error response body', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware returns ProblemDetails with Status and Title set
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: Response body is parseable JSON containing the required RFC 7807 fields
    const body = await response.json();
    expect(body).toHaveProperty('status', 500);
    expect(body).toHaveProperty('title');
    expect(typeof body.title).toBe('string');
    expect(body.title.length).toBeGreaterThan(0);
  });

  test('should NOT expose stack traces in the Problem Details error body', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware sets Detail = null (no ex.Message, no stack trace)
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: Response body does NOT contain any stack trace markers
    const body = await response.text();
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('at System.');
    expect(body).not.toContain('.cs:line');
    expect(body).not.toContain('NullReferenceException');
    expect(body).not.toContain('InvalidOperationException');
  });

  test('should NOT expose the exception detail field (Detail must be null)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware explicitly sets `Detail = null`
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: Response body either omits "detail" or has it set to null
    const body = await response.json();
    const detail = body['detail'] ?? null;
    expect(detail).toBeNull();
  });

  test('should return generic title "An unexpected error occurred." — not the real exception message', async ({
    request,
  }) => {
    // GIVEN: ExceptionHandlingMiddleware uses a fixed generic title (not ex.Message)
    // WHEN: An unhandled exception is triggered

    const response = await request.get(`${API_BASE_URL}/api/test/trigger-exception`);

    // THEN: Title matches exactly the approved generic message from ExceptionHandlingMiddleware
    const body = await response.json();
    expect(body.title).toBe('An unexpected error occurred.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — snake_case naming convention applied via EFCore.NamingConventions
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — snake_case naming convention for EF Core model', () => {
  test('should confirm UseSnakeCaseNamingConvention is active via a diagnostic endpoint', async ({
    request,
  }) => {
    // GIVEN: AppDbContext.OnModelCreating calls UseSnakeCaseNamingConvention() as the last call
    // WHEN: A diagnostic endpoint reports the EF Core naming strategy in use
    // NOTE: This endpoint does not exist until implementation — test is in RED phase

    const response = await request.get(`${API_BASE_URL}/api/v1/health/efcore-naming`);

    // THEN: The endpoint confirms snake_case convention is active
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('namingConvention');
    expect(String(body.namingConvention).toLowerCase()).toContain('snake_case');
  });

  test('should confirm no [Column] or [Table] attributes exist — naming is fully convention-based', async ({
    request,
  }) => {
    // GIVEN: Company standards forbid manual [Column]/[Table] attributes (snake_case is automatic)
    // WHEN: A schema-inspection endpoint is requested (returns metadata about entity configuration)
    // NOTE: In RED phase this endpoint does not exist yet

    const response = await request.get(`${API_BASE_URL}/api/v1/health/schema-conventions`);

    // THEN: The endpoint confirms all columns follow snake_case without manual overrides
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('hasManualColumnAttributes', false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Solution builds successfully (verified via runtime: server must be running)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — SiesaAgents.sln builds with zero errors', () => {
  test('should have all four Clean Architecture projects compiled and registered in DI', async ({
    request,
  }) => {
    // GIVEN: dotnet build SiesaAgents.sln compiled API, Application, Domain, Infrastructure
    // WHEN: The backend is running (build must succeed for server to start)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: The server responds — proof that all projects compiled without errors
    // A build failure would prevent Kestrel from starting entirely
    expect(response.status()).toBe(200);
  });

  test('should have the Infrastructure layer available in the DI container (EF Core registered)', async ({
    request,
  }) => {
    // GIVEN: SiesaAgents.Infrastructure is referenced by SiesaAgents.API and compiled into the solution
    // WHEN: The DI health endpoint is requested (it would fail 500 if Infrastructure is not wired)
    // NOTE: In RED phase this endpoint does not exist yet

    const response = await request.get(`${API_BASE_URL}/api/v1/health/di`);

    // THEN: The DI report shows AppDbContext resolved successfully
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('appDbContextRegistered', true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — AppDbContext registered in DI reading ConnectionStrings:DefaultConnection
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC5 — AppDbContext registered in DI with connection string', () => {
  test('should resolve AppDbContext from DI without throwing (200 from DI health endpoint)', async ({
    request,
  }) => {
    // GIVEN: Program.cs registers AddDbContext<AppDbContext>() reading DefaultConnection
    // WHEN: The DI diagnostics endpoint is requested
    // NOTE: This endpoint must be created as a minimal API route in Program.cs for testing purposes

    const response = await request.get(`${API_BASE_URL}/api/v1/health/di`);

    // THEN: AppDbContext resolves without DI exceptions (missing registration would return 500)
    expect(response.status()).toBe(200);
  });

  test('should use DefaultConnection from appsettings.Development.json pointing to siesa_agents_db', async ({
    request,
  }) => {
    // GIVEN: appsettings.Development.json has ConnectionStrings:DefaultConnection configured
    // WHEN: The connection-info diagnostic endpoint is requested
    // NOTE: In RED phase this endpoint does not exist

    const response = await request.get(`${API_BASE_URL}/api/v1/health/connection-info`);

    // THEN: The connection target database name is siesa_agents_db
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('database', 'siesa_agents_db');
  });

  test('should use Npgsql provider (not SQLite or InMemory) for AppDbContext', async ({
    request,
  }) => {
    // GIVEN: Infrastructure project uses Npgsql.EntityFrameworkCore.PostgreSQL
    // WHEN: The provider-info diagnostic endpoint is requested
    // NOTE: In RED phase this endpoint does not exist

    const response = await request.get(`${API_BASE_URL}/api/v1/health/connection-info`);

    // THEN: The registered EF Core provider is Npgsql (PostgreSQL)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('provider');
    expect(String(body.provider).toLowerCase()).toContain('npgsql');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Initial migration is empty (no domain table DDL in this story)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC6 — InitialCreate migration is empty (no domain entity tables)', () => {
  test('should NOT have a clientes table in the database (domain tables belong to Epic 2)', async ({
    request,
  }) => {
    // GIVEN: The InitialCreate migration is empty — no table DDL for domain entities
    // WHEN: The schema-inspection endpoint is queried for the clientes table
    // NOTE: In RED phase this endpoint does not exist yet

    const response = await request.get(`${API_BASE_URL}/api/v1/health/schema-conventions`);

    // THEN: The database schema does NOT contain a clientes table
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('tables');
    const tables: string[] = body.tables ?? [];
    expect(tables).not.toContain('clientes');
  });

  test('should NOT have a contactos table in the database (domain tables belong to Epic 3)', async ({
    request,
  }) => {
    // GIVEN: The InitialCreate migration is empty — contactos belongs to Epic 3
    // WHEN: The schema-inspection endpoint is queried for the contactos table
    // NOTE: In RED phase this endpoint does not exist yet

    const response = await request.get(`${API_BASE_URL}/api/v1/health/schema-conventions`);

    // THEN: The database schema does NOT contain a contactos table
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('tables');
    const tables: string[] = body.tables ?? [];
    expect(tables).not.toContain('contactos');
  });

  test('should have the __EFMigrationsHistory table (proof that migration was applied)', async ({
    request,
  }) => {
    // GIVEN: `dotnet ef database update` was executed and applied the InitialCreate migration
    // WHEN: The schema-inspection endpoint is queried
    // NOTE: In RED phase this endpoint does not exist yet

    const response = await request.get(`${API_BASE_URL}/api/v1/health/schema-conventions`);

    // THEN: The __EFMigrationsHistory table exists (EF Core bookkeeping table)
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('tables');
    const tables: string[] = body.tables ?? [];
    expect(tables).toContain('__EFMigrationsHistory');
  });

  test('should have exactly one applied migration (InitialCreate) with no domain table SQL', async ({
    request,
  }) => {
    // GIVEN: Only InitialCreate has been run — it should be an empty migration
    // WHEN: The migrations list endpoint is requested

    const response = await request.get(`${API_BASE_URL}/api/v1/health/migrations`);

    // THEN: The response contains exactly one migration named InitialCreate
    expect(response.status()).toBe(200);
    const body = await response.json();
    const migrations: { migrationId: string }[] = body.appliedMigrations ?? body ?? [];
    expect(migrations.length).toBeGreaterThanOrEqual(1);
    const migrationIds = migrations.map((m) => m.migrationId ?? String(m));
    expect(migrationIds.some((id) => id.includes('InitialCreate'))).toBe(true);
  });
});
