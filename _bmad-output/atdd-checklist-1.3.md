# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-07-01
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit + `WebApplicationFactory<Program>` + real PostgreSQL)

---

## Story Summary

As a developer, I want the PostgreSQL database connected and the EF Core infrastructure configured, so that subsequent stories can define entities and run migrations against a working data layer.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update`, **Then** the `siesa_agents_db` database is created with no errors, and an EF Core `Migrations/` folder exists in `SiesaAgents.Infrastructure` containing the generated initial migration files.
2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`, `Content-Type: application/problem+json`) with no stack traces/exception/inner exception details exposed (NFR6).
3. **Given** the backend receives any request, **When** the request is processed, **Then** `modelBuilder.ApplySnakeCaseNaming()` is called as the LAST statement inside `AppDbContext.OnModelCreating()`, and all EF-managed table/column names follow snake_case (verifiable via `__ef_migrations_history` using `migration_id`/`product_version`, not `MigrationId`/`ProductVersion`).

---

## Test Framework Note (Deviation from Default ATDD Tooling)

This story is 100% backend/.NET — no UI, no Playwright/Cypress applicable. Following company testing standards (`xUnit` + `WebApplicationFactory<Program>` for API-level integration tests) and `test-design-epic-1.md`, all failing tests are xUnit integration tests against a real PostgreSQL instance (no EF Core InMemory substitute, since the AC explicitly requires proving `dotnet ef database update` and real snake_case columns).

**Test infrastructure created in this ATDD pass** (did not exist before):

- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` — new xUnit project (`Microsoft.AspNetCore.Mvc.Testing`, `Npgsql`), added to `SiesaAgents.sln` under the `tests` solution folder
- `backend/tests/SiesaAgents.IntegrationTests/Support/TestApiFactory.cs` — `WebApplicationFactory<Program>` subclass that injects a test-only `GET /api/v1/test-error` endpoint via `IStartupFilter` (production `Program.cs` is not modified; the real middleware/DI pipeline runs unchanged)
- `InternalsVisibleTo("SiesaAgents.IntegrationTests")` added to `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — required because `Program` is `internal` under top-level statements and `WebApplicationFactory<Program>` needs type access from the test assembly

---

## Failing Tests Created (RED Phase)

### API Integration Tests (13 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (5 tests) — maps to TC-E1-P0-05

- `UnhandledException_ReturnsProblemJsonContentType` — RED: assembly fails to compile (see Notes) until `AppDbContext` exists; once compiling, will fail because no `AppDbContext`/DB wiring means `Program.cs` DI registration (Task 3) is absent
- `UnhandledException_Returns500StatusCode`
- `UnhandledException_BodyContainsStatusTitleDetailFields`
- `UnhandledException_BodyDoesNotExposeStackTraceOrExceptionKeys`
- `UnhandledException_BodyDoesNotExposeRawExceptionMessage`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextMigrationTests.cs` (4 tests) — maps to TC-E1-P1-05

- `Database_SiesaAgentsDb_ExistsAndIsReachable` — RED: `siesa_agents_db` not created yet (no `AppDbContext`, no migration run)
- `Database_ContainsEfMigrationsHistoryTable` — RED: `__ef_migrations_history` does not exist
- `Database_DoesNotContainDomainTables_ClientesOrContactos` — RED: currently vacuously would pass, but blocked by assembly compile failure until `AppDbContext` exists (kept as a regression guard for scope boundary)
- `MigrationsFolder_ExistsInInfrastructureProject_WithGeneratedFiles` — RED: only `.gitkeep` exists in `Data/Migrations/`, no generated `*.cs` migration files

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/SnakeCaseNamingTests.cs` (5 tests) — maps to TC-E1-P2-04

- `EfMigrationsHistoryTable_HasSnakeCaseColumn_MigrationId` — RED: table doesn't exist yet
- `EfMigrationsHistoryTable_HasSnakeCaseColumn_ProductVersion` — RED: table doesn't exist yet
- `EfMigrationsHistoryTable_HasNoPascalCaseColumns` — RED: table doesn't exist yet
- `ApplySnakeCaseNaming_IsCalledAsLastStatement_InOnModelCreating` — RED (compile-level): `AppDbContext.cs` does not exist (`SiesaAgents.Infrastructure.Data` namespace has no `AppDbContext` type — confirmed via `CS0234: The type or namespace name 'Infrastructure' does not exist`)
- `AppDbContext_HasZeroDbSetProperties` — RED (compile-level): same reason, and enforces the Dev Notes scope boundary (no `DbSet<T>` may be added in this story)

**Total: 14 tests, all RED** (13 assertions + verified compile-time RED via `dotnet build`, which blocks the whole assembly because `SiesaAgents.Infrastructure.Data.AppDbContext` — the exact type this story must create — does not exist yet).

---

## RED Phase Verification (Actual Run)

**Command:** `dotnet build tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` (from `backend/`)

**Result:**

```
backend/tests/SiesaAgents.IntegrationTests/Data/SnakeCaseNamingTests.cs(3,19): error CS0234:
The type or namespace name 'Infrastructure' does not exist in the namespace 'SiesaAgents'
(are you missing an assembly reference?)
1 Error(s)
```

This is the expected and correct RED signal: `AppDbContext` (Task 2 of the story) is the exact class under test and does not exist yet, so the whole test assembly fails to build — precisely the "fails for the right reason" criterion (missing implementation, not a test bug). This mirrors the precedent from Story 1.2's ATDD pass (module-not-found blocking a spec file).

**Confirmed unaffected:** `dotnet build src/SiesaAgents.API/SiesaAgents.API.csproj` and `dotnet build tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` both still succeed with 0 warnings/0 errors — the new test project and `InternalsVisibleTo` addition do not break the existing solution.

**Note on isolating individual test files:** Once `AppDbContext.cs` and `ModelBuilderExtensions.cs` are created (Task 2), the assembly will compile and the 5 `ExceptionHandlingMiddlewareTests` will still fail RED at runtime (500 body will differ / DbContext registration missing) until Task 3 (DI registration) and Task 5 (logging hardening — behavior-neutral) are done; the 9 `Data/*` tests will fail RED at runtime until Task 4 (`dotnet ef database update` actually run against local PostgreSQL) is completed.

---

## Data Factories Created

None. This story has no domain entities or API payloads to factory-generate (zero `DbSet`s by design — see Dev Notes scope boundary). Integration tests use plain `NpgsqlConnection`/`NpgsqlCommand` against `information_schema` — no ORM-level fixtures needed at this stage.

---

## Fixtures Created

### `TestApiFactory` (WebApplicationFactory subclass)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Support/TestApiFactory.cs`

**Provides:**

- `CreateClient()` — an `HttpClient` wired to the real `Program.cs` pipeline (middleware, CORS, DI) running in-memory
- Injects `GET /api/v1/test-error` (via `IStartupFilter`) which throws `InvalidOperationException("internal test")`, used exclusively by `ExceptionHandlingMiddlewareTests` to trigger the unhandled-exception path without polluting production routes

**Example Usage:**

```csharp
public class ExceptionHandlingMiddlewareTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public ExceptionHandlingMiddlewareTests(TestApiFactory factory) => _factory = factory;

    [Fact]
    public async Task UnhandledException_Returns500StatusCode()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/v1/test-error");
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }
}
```

No manual cleanup needed — `WebApplicationFactory<T>` disposes its in-memory `TestServer`/`HttpClient` automatically via `IClassFixture` lifecycle.

---

## Mock Requirements

None. No external services beyond the local PostgreSQL instance (already a story precondition, not a mockable dependency per Dev Notes: "no EF Core InMemory substitute for migration/naming verification — must hit real PostgreSQL").

---

## Required data-testid Attributes

Not applicable — backend-only story, no UI/DOM elements.

---

## Implementation Checklist

### Test: ExceptionHandlingMiddlewareTests (5 tests, AC #2)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

- [ ] Task 2: Create `AppDbContext` (zero `DbSet`s) so the test assembly compiles
- [ ] Task 3: Register `AddDbContext<AppDbContext>` in `Program.cs` with `DefaultConnection`
- [ ] Task 5: Add `ILogger<ExceptionHandlingMiddleware>` logging call before writing the response body; keep response body contract (`status`/`title`/`detail: null`) unchanged
- [ ] Verify `ExceptionHandlingMiddleware` registration order is unchanged (before `UseCors`/endpoint mapping) after `AddDbContext` wiring
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ExceptionHandlingMiddlewareTests`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AppDbContextMigrationTests (4 tests, AC #1)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextMigrationTests.cs`

- [ ] Task 1: Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API`
- [ ] Task 2: Create `AppDbContext.cs` and `ModelBuilderExtensions.cs` in `SiesaAgents.Infrastructure/Data/`
- [ ] Task 3: Register DbContext + connection string in `Program.cs` / `appsettings.json`
- [ ] Task 4: Run `dotnet ef migrations add InitialCreate --startup-project ../SiesaAgents.API --output-dir Data/Migrations` from `SiesaAgents.Infrastructure`
- [ ] Task 4: Run `dotnet ef database update --startup-project ../SiesaAgents.API` against local PostgreSQL
- [ ] Task 4: Remove `Data/Migrations/.gitkeep` once real migration files exist
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~AppDbContextMigrationTests`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: SnakeCaseNamingTests (5 tests, AC #3)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/SnakeCaseNamingTests.cs`

- [ ] Task 2: Implement `ModelBuilderExtensions.ApplySnakeCaseNaming()` (iterate `modelBuilder.Model.GetEntityTypes()`, convert PascalCase → snake_case for table/column names via `SetTableName`/`SetColumnName`)
- [ ] Task 2: Call `base.OnModelCreating(modelBuilder)`, then `modelBuilder.ApplyConfigurationsFromAssembly(...)`, then `modelBuilder.ApplySnakeCaseNaming()` as the LAST line of `OnModelCreating`
- [ ] Task 4: Apply migration so `__ef_migrations_history` exists with snake_case columns
- [ ] Confirm zero `DbSet<T>` properties remain on `AppDbContext` (scope boundary)
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~SnakeCaseNamingTests`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Restore/build the new test project (from backend/)
dotnet build tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj

# Run all failing tests for this story
dotnet test tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj

# Run a specific test class
dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ExceptionHandlingMiddlewareTests
dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~AppDbContextMigrationTests
dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~SnakeCaseNamingTests

# Run with detailed output
dotnet test tests/SiesaAgents.IntegrationTests --logger "console;verbosity=detailed"
```

**Precondition for `Data/*` tests to run at all (not just compile):** PostgreSQL must be running locally and reachable via `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (same connection string as `appsettings.Development.json`).

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

- ✅ 14 tests total (5 middleware + 4 migration + 5 snake_case) written across 3 files
- ✅ RED phase verified via `dotnet build` — compile fails with `CS0234` because `SiesaAgents.Infrastructure.Data.AppDbContext` does not exist (Task 2 deliverable), which is the correct "fails for the right reason" signal
- ✅ New test infrastructure created (`SiesaAgents.IntegrationTests` project, `TestApiFactory`, `InternalsVisibleTo`) — did not exist before this run
- ✅ No data factories/mocks required (no domain entities, no external services beyond local PostgreSQL)
- ✅ Implementation checklist created, mapped to Tasks 1–5 in the story file

### GREEN Phase (DEV Team — Next Steps)

1. Task 1 → Task 2 first (EF Design package + `AppDbContext`/`ModelBuilderExtensions`) — unblocks compilation of the whole test assembly
2. Task 3 (DI registration + connection string) — needed before any `Data/*` test can pass
3. Task 4 (generate + apply migration against local PostgreSQL) — turns `AppDbContextMigrationTests` and `SnakeCaseNamingTests` green
4. Task 5 (middleware logging hardening) — turns `ExceptionHandlingMiddlewareTests` green (response contract already exists per Story 1.1, only logging + DI coexistence to verify)
5. Run `dotnet test tests/SiesaAgents.IntegrationTests` after each task

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all 14 tests pass with local PostgreSQL running
2. Confirm `dotnet build SiesaAgents.sln` remains 0 warnings/0 errors
3. Re-verify scope boundary: no `DbSet<T>`, no `IEntityTypeConfiguration<T>`, no repository implementations added
4. Ensure tests still pass after cleanup

---

## Next Steps

1. Share this checklist and the 3 new test files with the dev workflow (manual handoff)
2. Run `dotnet build tests/SiesaAgents.IntegrationTests` to confirm RED phase (compile-blocked on `AppDbContext`)
3. Begin implementation using Tasks 1–5 in the story file as the execution order
4. Work one test file at a time (red → green)
5. When all 14 tests pass, refactor and mark story ready for review

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure, one assertion focus per test, deterministic checks against `information_schema` instead of brittle EF-internal reflection where avoidable
- **test-levels-framework.md** — API/Integration level chosen because this story's ACs are explicitly infrastructure/DB/middleware-level, not UI — no E2E or Component tests apply (backend-only, per Dev Notes scope boundary)
- **selector-resilience.md** — N/A (no UI); analogous discipline applied by asserting on stable contract fields (`status`/`title`/`detail`, `migration_id`/`product_version`) rather than incidental response formatting
- **timing-debugging.md** — All async I/O (`OpenAsync`, `ExecuteScalarAsync`, `GetAsync`) awaited explicitly; no hard waits/sleeps anywhere in the suite

---

## Notes

- This is a backend-only, non-UI story — the "network-first"/Playwright-centric parts of the default ATDD workflow do not apply; xUnit + `WebApplicationFactory<Program>` is the company-standard equivalent for API-level acceptance tests (per `company-standards.md` and `test-design-epic-1.md`).
- `InternalsVisibleTo("SiesaAgents.IntegrationTests")` was added to `SiesaAgents.API.csproj` as test-enabling infrastructure (required for `WebApplicationFactory<Program>` to see the `internal` top-level-statements `Program` class) — this is scaffolding, not story business logic, consistent with how Story 1.2's ATDD pass added `vitest.config.ts`.
- A new solution-level test project (`SiesaAgents.IntegrationTests`) was created and added to `SiesaAgents.sln` under the `tests` solution folder alongside the existing `SiesaAgents.UnitTests` — `dotnet build SiesaAgents.sln` should be re-verified by DEV after Task 2 lands (currently blocked by the intentional RED compile error).
- `TestApiFactory` injects the test-only `GET /api/v1/test-error` endpoint via `IStartupFilter` rather than editing `Program.cs`, so production route surface is untouched by ATDD tooling.
- The `AppDbContextMigrationTests`/`SnakeCaseNamingTests` connect to the real local PostgreSQL instance (no TestContainers/InMemory) per explicit Dev Notes guidance — CI/dev sandbox must have PostgreSQL running and reachable at the Story 1.1 connection string for these tests to execute (they are currently blocked earlier, at compile time, so this precondition does not yet apply until Task 2 is done).
- `ApplySnakeCaseNaming_IsCalledAsLastStatement_InOnModelCreating` uses source-text inspection (not IL reflection) to assert ordering, per the story's explicit non-negotiable constraint (test-design-epic-1.md §10, item 2) that `ApplySnakeCaseNaming()` must be the LAST call in `OnModelCreating`.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `./bmm/docs/tea-README.md` for workflow documentation
- Consult `./bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-07-01
