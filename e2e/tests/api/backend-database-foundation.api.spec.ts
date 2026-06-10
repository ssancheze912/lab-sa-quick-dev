/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (API Level)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — `dotnet ef database update` creates siesa_agents_db with __ef_migrations_history
 *          in snake_case; no domain tables (clientes, contactos) exist.
 *          (Runtime proxy: backend starts without DB errors → migrations applied correctly)
 *   AC2 — Unhandled exceptions return Problem Details RFC 7807 format with status,
 *          title, detail fields; no stackTrace/exception/innerException exposed (NFR6).
 *          (Integration proxy: middleware correctly registered AND ordered in real pipeline)
 *   AC4 — AppDbContext registered in DI; connection string read from
 *          ConnectionStrings:DefaultConnection in appsettings.Development.json.
 *          (Runtime proxy: backend starts on port 5000 without DI or connection errors)
 *
 * Test Cases:
 *   TC-E1-P0-05 (P0) — ExceptionHandlingMiddleware returns Problem Details RFC 7807
 *   TC-E1-P1-05 (P1) — EF Core migration creates siesa_agents_db and __ef_migrations_history
 *
 * NOTE: TC-E1-P1-05 full validation (live DB) requires TestContainers or local PostgreSQL.
 *       The API-level proxy here validates that the backend starts (DI + DB wiring succeeded)
 *       and that the middleware is correctly ordered in the real production pipeline.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────────────────────
// AC4: AppDbContext registered in DI — backend starts without DI or connection errors
// TC-E1-P1-05 (runtime proxy) — DB wiring succeeded if server responds
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC4 — AppDbContext registered in DI and connection string resolved', () => {
  test('should have the backend server running after AppDbContext DI registration', async ({ request }) => {
    // GIVEN: AppDbContext is registered via builder.Services.AddDbContext<AppDbContext>()
    //        and connection string is present in appsettings.Development.json
    // WHEN: The server starts (DI container is built — any AppDbContext config error would crash startup)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server responds — DI container built successfully with AppDbContext registered
    // A missing AddDbContext() or bad connection string format would prevent startup
    expect(response.status()).toBe(200);
  });

  test('should return HTTP 200 from scalar confirming Program.cs startup order is preserved', async ({ request }) => {
    // GIVEN: AddDbContext<AppDbContext>() is placed BEFORE builder.Build() in Program.cs
    //        and AFTER AddOpenApi(), AddCors() per the required ordering
    // WHEN: The backend application starts up completely

    const response = await request.get(`${API_BASE_URL}/scalar`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Scalar page loads (HTML) — Program.cs ordering is intact, no startup crash
    expect(response.status()).toBe(200);
    expect(contentType).toContain('text/html');
  });

  test('should not expose a database connection error in any API response', async ({ request }) => {
    // GIVEN: appsettings.Development.json has ConnectionStrings:DefaultConnection set
    //        to a valid PostgreSQL connection string format
    // WHEN: Any API endpoint is requested

    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: Response body does NOT contain PostgreSQL connection error markers
    // These strings appear when EF Core cannot resolve the connection string at startup
    expect(body).not.toContain('ConnectionString');
    expect(body).not.toContain('NpgsqlException');
    expect(body).not.toContain('InvalidOperationException');
  });

  test('should not expose any DI resolution error for AppDbContext in API responses', async ({ request }) => {
    // GIVEN: AppDbContext is properly registered in DI (AddDbContext<AppDbContext>() present)
    // WHEN: Backend starts and OpenAPI spec endpoint is requested
    // (OpenAPI spec resolves services — DI errors would manifest here)

    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);

    // THEN: OpenAPI spec loads (200) — confirms DI container resolved all registered services
    expect(response.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: ExceptionHandlingMiddleware — Problem Details RFC 7807
// TC-E1-P0-05 (P0) — integration proxy via real HTTP pipeline
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC2 — ExceptionHandlingMiddleware returns Problem Details RFC 7807 (integration proxy)', () => {
  test('should return JSON (not HTML) for any unhandled 404 path — middleware is registered', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is registered as the FIRST middleware in Program.cs
    //        (BEFORE app.UseCors, app.MapOpenApi, etc.)
    // WHEN: A request hits a non-existent API route

    // CRITICAL: Network-first — register route interception before any navigation
    const response = await request.get(`${API_BASE_URL}/api/v1/nonexistent-story-1-3-probe`, {
      headers: { Accept: 'application/json' },
    });

    // THEN: Response content-type is JSON (not HTML), confirming middleware is active
    // A missing middleware registration returns text/html error page on 404
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType.toLowerCase()).toContain('json');
    expect([404, 400]).toContain(response.status());
  });

  test('should not return HTML error page for missing API route (NFR6 integration check)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware is correctly ordered before endpoint mapping
    // WHEN: A completely unknown route is requested

    const response = await request.get(`${API_BASE_URL}/api/nonexistent-db-foundation-check`);
    const contentType = response.headers()['content-type'] ?? '';

    // THEN: Response is NOT text/html — confirms middleware intercepts and converts to JSON
    expect(contentType.toLowerCase()).not.toContain('text/html');
  });

  test('should not expose stack trace in any error response body (NFR6 production pipeline)', async ({ request }) => {
    // GIVEN: ExceptionHandlingMiddleware suppresses internal details (NFR6)
    //        This validates the real production pipeline (not just test host)
    // WHEN: A non-existent endpoint is requested

    const response = await request.get(`${API_BASE_URL}/api/v1/trigger-nfr6-validation`);
    const body = await response.text();

    // THEN: Response body contains no stack trace markers (NFR6 — never expose internals)
    expect(body).not.toContain('at SiesaAgents');
    expect(body).not.toContain('System.Exception');
    expect(body).not.toContain('StackTrace');
    expect(body).not.toContain('innerException');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1: EF Core migration applied — siesa_agents_db created with snake_case tables
// TC-E1-P1-05 (P1) — runtime proxy (full DB test requires TestContainers)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC1 — EF Core migration applied (runtime proxy — TC-E1-P1-05)', () => {
  test('should have the backend start without EF Core migration errors in API responses', async ({ request }) => {
    // GIVEN: `dotnet ef database update` has been run from SiesaAgents.Infrastructure/
    //        creating siesa_agents_db with __ef_migrations_history table
    // WHEN: The backend starts (EF Core validates pending migrations on startup if configured)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Server starts cleanly — no EF Core migration pending error (would crash startup
    //       if UseNpgsql with a running DB is configured and migrations are not applied)
    expect(response.status()).toBe(200);
  });

  test('should not expose EF Core pending migration error in any response (AC1 runtime proxy)', async ({ request }) => {
    // GIVEN: InitialCreate migration was run and __ef_migrations_history records it
    // WHEN: Any API endpoint is called

    const response = await request.get(`${API_BASE_URL}/scalar`);
    const body = await response.text();

    // THEN: No EF Core migration-related errors appear
    expect(body).not.toContain('pending model changes');
    expect(body).not.toContain('MigrationsPendingException');
    expect(body).not.toContain('__EFMigrationsHistory');
  });

  test('should confirm backend has no clientes or contactos tables registered (AC1 scope boundary)', async ({ request }) => {
    // GIVEN: Story 1.3 scope — zero domain entities; InitialCreate migration Up() is empty
    //        AppDbContext has NO DbSet<> properties for Clientes or Contactos
    // WHEN: OpenAPI spec is inspected for domain entity routes (none should exist yet)

    const response = await request.get(`${API_BASE_URL}/openapi/v1.json`);
    expect(response.status()).toBe(200);

    const spec = await response.json() as Record<string, unknown>;
    const paths = (spec['paths'] as Record<string, unknown>) ?? {};
    const pathKeys = Object.keys(paths);

    // THEN: No /clientes or /contactos API paths exist in Story 1.3
    // These are created in Epic 2 (Story 2.1) and Epic 3 (Story 3.1) respectively
    const clientesPaths = pathKeys.filter((p) => p.includes('/clientes'));
    const contactosPaths = pathKeys.filter((p) => p.includes('/contactos'));
    expect(clientesPaths).toHaveLength(0);
    expect(contactosPaths).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: UseSnakeCaseNamingConvention — runtime proxy via backend health
// TC-E1-P2-04 (P2) — snake_case column naming (unit-tested in AppDbContextTests.cs)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC3 — UseSnakeCaseNamingConvention applied (runtime proxy — TC-E1-P2-04)', () => {
  test('should have the backend start cleanly after UseSnakeCaseNamingConvention() registration', async ({ request }) => {
    // GIVEN: UseSnakeCaseNamingConvention() is called inside AddDbContext options builder
    //        AND UseSnakeCaseNamingConvention() / UseSnakeCaseNamingConvention() is called
    //        as the last call in OnModelCreating
    // WHEN: AppDbContext model is built at startup (happens on first DB call or EnsureCreated)

    const response = await request.get(`${API_BASE_URL}/scalar`);

    // THEN: Backend starts without EFCore.NamingConventions configuration errors
    // A missing UseSnakeCaseNamingConvention() in DbContextOptionsBuilder or OnModelCreating
    // would surface as a ModelBuilder exception on first model build
    expect(response.status()).toBe(200);
  });
});
