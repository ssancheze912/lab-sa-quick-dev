# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit + WebApplicationFactory)

---

## Story Summary

Story 1.3 wires EF Core to a local PostgreSQL instance and produces the initial empty migration for the `siesa_agents_db` database. It also validates the `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 format on unhandled exceptions, with no stack trace exposure (NFR6). The story sets the foundation for all subsequent domain-entity migrations (Epics 2 and 3).

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When `dotnet ef database update` is run, Then `siesa_agents_db` is created with no errors and the EF Core migrations folder exists in `src/SiesaAgents.Infrastructure/Data/Migrations/`.

2. **AC2** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces exposed (NFR6). `Content-Type` must be `application/problem+json`.

3. **AC3** — Given the backend receives any request, When `OnModelCreating` is executed, Then `modelBuilder.ApplySnakeCaseNaming()` is applied as the LAST call and all EF-managed column names follow snake_case (e.g., `migration_id`, `product_version`).

4. **AC4** — Given `AppDbContext` is configured, When the application starts, Then the connection string `ConnectionStrings:DefaultConnection` from `appsettings.Development.json` is used, pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`.

5. **AC5** — Given the initial migration exists, When `dotnet ef database update` is run, Then no domain tables (`clientes`, `contactos`) are created — only `__ef_migrations_history` is present.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

Not applicable — Story 1.3 is a pure backend infrastructure story with no UI interactions.

### API Tests (10 tests)

**File 1:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `AppDbContext_WhenMigrationApplied_DatabaseAndMigrationsTableExist`
  - **Status:** RED — `CS0234`: `SiesaAgents.Infrastructure.Data` namespace does not exist (`AppDbContext` not yet created)
  - **Verifies:** AC1 (TC-E1-P1-05) — `siesa_agents_db` created, `__ef_migrations_history` table exists

- **Test:** `AppDbContext_WhenMigrationApplied_MigrationsHistoryColumnsAreSnakeCase`
  - **Status:** RED — Same root cause (`AppDbContext` missing) + requires migration to run
  - **Verifies:** AC3 (TC-E1-P2-04) — `migration_id`, `product_version` column names are snake_case

- **Test:** `AppDbContext_WhenApplicationStarts_IsResolvableFromDI`
  - **Status:** RED — `AppDbContext` not registered in DI (no `AddDbContext<AppDbContext>` in Program.cs)
  - **Verifies:** AC4 — AppDbContext DI registration wired correctly

- **Test:** `AppDbContext_WhenConfigured_ConnectionStringPointsToSiesaAgentsDb`
  - **Status:** RED — `AppDbContext` not resolvable from DI
  - **Verifies:** AC4 — Connection string contains `siesa_agents_db` and `localhost`

- **Test:** `AppDbContext_WhenInitialMigrationApplied_NoDomainTablesExist`
  - **Status:** RED — `AppDbContext` missing; migration cannot run
  - **Verifies:** AC5 — `clientes` and `contactos` tables absent after initial migration (scope boundary)

**File 2:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ExceptionHandlingMiddlewareIntegrationTests.cs`

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_Returns500`
  - **Status:** RED — `WebApplicationFactory<Program>` requires `public partial class Program { }` in API project (not yet added) and `ThrowingEndpointApplicationFactory` middleware injection requires EF Core wiring for app to start
  - **Verifies:** AC2 (TC-E1-P0-05) — HTTP 500 returned

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_ContentTypeIsProblemJson`
  - **Status:** RED — Same root cause as above
  - **Verifies:** AC2 (TC-E1-P0-05) — `Content-Type: application/problem+json`

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_ResponseContainsStatusField`
  - **Status:** RED — Same root cause
  - **Verifies:** AC2 (TC-E1-P0-05) — JSON body contains `"status": 500`

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_ResponseContainsTitleField`
  - **Status:** RED — Same root cause
  - **Verifies:** AC2 (TC-E1-P0-05) — JSON body contains non-empty `title`

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_ResponseContainsDetailField`
  - **Status:** RED — Same root cause
  - **Verifies:** AC2 (TC-E1-P0-05) — JSON body contains `detail` field (null value is acceptable)

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_NoStackTraceExposed`
  - **Status:** RED — Same root cause
  - **Verifies:** AC2 (TC-E1-P0-05) + NFR6 — No `stackTrace`, `exception`, `innerException` in response

- **Test:** `ExceptionHandlingMiddleware_WhenRegisteredBeforeEndpoints_CatchesException`
  - **Status:** RED — Same root cause
  - **Verifies:** AC2 — Middleware ordering: `UseMiddleware<ExceptionHandlingMiddleware>()` before `app.Map*()`

### Component Tests (0 tests)

Not applicable — Story 1.3 is pure backend infrastructure.

---

## Data Factories Created

Not applicable for Story 1.3 — no domain entities are defined. No factory data setup is needed.

---

## Fixtures Created

Not applicable for Story 1.3 — `WebApplicationFactory<Program>` is used directly as an `IClassFixture<>` to provide test isolation and auto-cleanup via xUnit lifetime management.

---

## Mock Requirements

No external service mocks required. The tests connect to a real local PostgreSQL instance (or can be upgraded to TestContainers in a future sprint for CI isolation).

### PostgreSQL Database (Local)

**Requirement:** PostgreSQL 18+ running on `localhost:5432` with a user that has `CREATE DATABASE` privileges.

**Connection:** `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`

**Notes:** The integration tests call `MigrateAsync()` which auto-creates the database. Tests are idempotent — running migrations multiple times is safe.

---

## Required data-testid Attributes

Not applicable — Story 1.3 is a pure backend infrastructure story with no frontend UI elements.

---

## Implementation Checklist

### Test: `AppDbContext_WhenApplicationStarts_IsResolvableFromDI`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with constructor accepting `DbContextOptions<AppDbContext>`
- [ ] Add `using Microsoft.EntityFrameworkCore;` to the file
- [ ] In `src/SiesaAgents.API/Program.cs`, add `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));`
- [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `src/SiesaAgents.API/SiesaAgents.API.csproj`
- [ ] Add `Microsoft.EntityFrameworkCore.Tools` package to `src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
- [ ] Add `public partial class Program { }` at bottom of `Program.cs` (required for `WebApplicationFactory<Program>` in tests)
- [ ] Run test: `dotnet test --filter "AppDbContext_WhenApplicationStarts_IsResolvableFromDI"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: `AppDbContext_WhenConfigured_ConnectionStringPointsToSiesaAgentsDb`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Ensure `AppDbContext` is registered in DI (previous test's tasks)
- [ ] Verify `appsettings.Development.json` contains `"ConnectionStrings": { "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres" }`
- [ ] Run test: `dotnet test --filter "AppDbContext_WhenConfigured_ConnectionStringPointsToSiesaAgentsDb"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `AppDbContext_WhenMigrationApplied_DatabaseAndMigrationsTableExist`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Complete AppDbContext registration (previous tasks)
- [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` in `AppDbContext` — call `base.OnModelCreating(modelBuilder)` first, then `modelBuilder.ApplySnakeCaseNaming()` as the LAST call
- [ ] Run from `backend/`: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created with the migration files
- [ ] Run test: `dotnet test --filter "AppDbContext_WhenMigrationApplied_DatabaseAndMigrationsTableExist"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `AppDbContext_WhenMigrationApplied_MigrationsHistoryColumnsAreSnakeCase`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Ensure `modelBuilder.ApplySnakeCaseNaming()` is the LAST call in `OnModelCreating` (critical)
- [ ] Re-run migration with `ApplySnakeCaseNaming()` active
- [ ] Run test: `dotnet test --filter "AppDbContext_WhenMigrationApplied_MigrationsHistoryColumnsAreSnakeCase"`
- [ ] ✅ Test passes — columns `migration_id`, `product_version` verified (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `AppDbContext_WhenInitialMigrationApplied_NoDomainTablesExist`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Ensure `AppDbContext` has NO `DbSet<>` properties (no domain entities yet)
- [ ] Run test: `dotnet test --filter "AppDbContext_WhenInitialMigrationApplied_NoDomainTablesExist"`
- [ ] ✅ Test passes — no `clientes` or `contactos` tables (green phase)

**Estimated Effort:** 0.25 hours

---

### Tests: All `ExceptionHandlingMiddlewareIntegrationTests` (7 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ExceptionHandlingMiddlewareIntegrationTests.cs`

**Tasks to make these tests pass:**

- [ ] Add `public partial class Program { }` at the bottom of `src/SiesaAgents.API/Program.cs` to expose `Program` as a public type for `WebApplicationFactory<Program>`
- [ ] Verify `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered BEFORE `app.MapScalarApiReference()` and any `app.Map*()` calls in `Program.cs`
- [ ] Confirm `ExceptionHandlingMiddleware` returns JSON with `status`, `title`, `detail` fields and sets `Content-Type: application/problem+json`
- [ ] Confirm `detail` is always `null` (no exception message exposed)
- [ ] Run tests: `dotnet test --filter "ExceptionHandlingMiddlewareIntegrationTests"`
- [ ] ✅ All 7 integration tests pass (green phase)

**Estimated Effort:** 1.0 hour

---

## Running Tests

```bash
# Run all ATDD tests for Story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "AppDbContextTests|ExceptionHandlingMiddlewareIntegrationTests"

# Run only AppDbContext tests (AC1, AC3, AC4, AC5)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "AppDbContextTests"

# Run only exception middleware integration tests (AC2 / TC-E1-P0-05)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "ExceptionHandlingMiddlewareIntegrationTests"

# Run all backend tests
dotnet test backend/tests/SiesaAgents.UnitTests/

# Run with verbose output to see failure messages
dotnet test backend/tests/SiesaAgents.UnitTests/ --logger "console;verbosity=detailed"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (12 tests across 2 files)
- ✅ Build fails with `CS0234` — `SiesaAgents.Infrastructure.Data` namespace missing (AppDbContext not yet created)
- ✅ No fixtures/factories needed (infrastructure story, no domain data)
- ✅ Mock requirements documented (local PostgreSQL)
- ✅ Required NuGet packages added to test project
- ✅ Implementation checklist created with clear tasks per test

**Verification:**

- `dotnet build backend/tests/SiesaAgents.UnitTests/` fails with:
  `error CS0234: The type or namespace name 'Data' does not exist in the namespace 'SiesaAgents.Infrastructure'`
- Failure is due to missing `AppDbContext` implementation, not test bugs
- All failures are clear, actionable, and directly traceable to missing AC implementation

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Implement `AppDbContext` in `SiesaAgents.Infrastructure.Data` namespace
2. Register `AddDbContext<AppDbContext>` in `Program.cs`
3. Add `public partial class Program { }` at the bottom of `Program.cs`
4. Override `OnModelCreating` with `modelBuilder.ApplySnakeCaseNaming()` as the LAST call
5. Run `dotnet ef migrations add InitialCreate`
6. Run `dotnet test` to verify tests go GREEN one by one

**Key Principles:**

- One test at a time — implement minimal code per test
- `ApplySnakeCaseNaming()` MUST be the absolute last line in `OnModelCreating` (AC3 fails otherwise)
- No `DbSet<>` properties in `AppDbContext` — domain entities are deferred to Epics 2 and 3 (AC5)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 12 ATDD tests pass
2. Review `AppDbContext` for future extensibility (comments for Epic 2/3 `DbSet<>` additions)
3. Ensure `OnModelCreating` ordering is maintainable (comment explaining why `ApplySnakeCaseNaming()` must be last)
4. Run `dotnet test` after any refactoring to confirm no regressions

---

## Next Steps

1. Share this checklist with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `dotnet build backend/tests/SiesaAgents.UnitTests/`
3. Begin implementation using the implementation checklist above (start with `AppDbContext` creation)
4. Work one test at a time (red → green for each)
5. When all 12 tests pass, refactor for quality
6. When refactoring complete, manually update story status to 'done'

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic tests, explicit failure messages
- **test-levels-framework.md** — Story 1.3 is pure backend infrastructure; API Integration tests (xUnit) are the appropriate level — no E2E or Component tests needed
- **fixture-architecture.md** — `IClassFixture<WebApplicationFactory<Program>>` provides test lifecycle management with auto-cleanup
- **data-factories.md** — Not applicable; no domain entities in this story

---

## Test Execution Evidence

### Initial Build (RED Phase Verification)

**Command:** `dotnet build backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`

**Results:**

```
Build FAILED.

error CS0234: The type or namespace name 'Data' does not exist in the namespace
'SiesaAgents.Infrastructure' (are you missing an assembly reference?)
[SiesaAgents.UnitTests.csproj]

1 Error(s)
```

**Summary:**

- Total tests: 12 (5 in AppDbContextTests + 7 in ExceptionHandlingMiddlewareIntegrationTests)
- Passing: 0 (expected)
- Failing: 12 (expected — RED phase)
- Status: RED phase verified

**Expected Failure Messages:**

- `AppDbContextTests.*` — `CS0234`: `SiesaAgents.Infrastructure.Data` namespace missing (AppDbContext not created)
- `ExceptionHandlingMiddlewareIntegrationTests.*` — Runtime failure: `WebApplicationFactory<Program>` cannot start because `AppDbContext` is not registered in DI; also requires `public partial class Program { }`

---

## Notes

- Story 1.3 is backend-only — no frontend tests needed. The test pyramid for this story is entirely API Integration level (xUnit).
- The `ThrowingEndpointApplicationFactory` in `ExceptionHandlingMiddlewareIntegrationTests.cs` uses a middleware override pattern to inject the test error endpoint without modifying `Program.cs`. This follows the principle of not contaminating production code with test-only endpoints.
- The `AppDbContextTests` require a running PostgreSQL instance. For CI isolation, upgrade to `TestContainers` (Postgres image) as noted in the test-design document.
- `ApplySnakeCaseNaming()` MUST be the last call in `OnModelCreating` — not second-to-last, not before `base.OnModelCreating()`. The `TC-E1-P2-04` test (`MigrationsHistoryColumnsAreSnakeCase`) will catch any ordering violation.
- The `ExceptionHandlingMiddlewareIntegrationTests` replaces the need for a dedicated `/api/v1/test-error` production endpoint — the test factory injects it at the middleware level only during test execution.

---

**Generated by BMad TEA Agent** — 2026-06-28
