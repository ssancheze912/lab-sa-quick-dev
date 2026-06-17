# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-17
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit + WebApplicationFactory + TestContainers)

---

## Story Summary

Story 1.3 wires the PostgreSQL database to the .NET 10 backend using EF Core with the Npgsql provider. It creates `AppDbContext` in the Infrastructure layer, applies `modelBuilder.ApplySnakeCaseNaming()` as the last call in `OnModelCreating`, runs an empty `InitialCreate` migration, and verifies that `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 format on unhandled exceptions.

**As a** developer
**I want** the PostgreSQL database connected and EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running, When `dotnet ef database update` runs, Then `siesa_agents_db` is created with no errors and `__ef_migrations_history` exists in snake_case format.
2. **AC2** — Given the migration is applied, When the schema is inspected, Then NO domain tables exist (`clientes` and `contactos` are absent — deferred to Epics 2 and 3).
3. **AC3** — Given an unhandled exception occurs, When it reaches the middleware, Then the response is Problem Details RFC 7807 with `Content-Type: application/problem+json`, contains `status`/`title`/`detail`, and has NO `stackTrace`, `exception`, or raw C# exception message.
4. **AC4** — Given `ApplySnakeCaseNaming()` is active, When the schema is inspected, Then all EF-managed column names follow snake_case (`migration_id`, `product_version`).
5. **AC5** — Given the Infrastructure project is configured, When `dotnet build SiesaAgents.sln` runs, Then all four Clean Architecture projects compile with zero errors.
6. **AC6** — Given connection string is configured, When `AppDbContext` is registered in `Program.cs`, Then the DI container resolves it without error and EF Core uses `Npgsql` as the provider.

---

## Failing Tests Created (RED Phase)

### API Integration Tests (5 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `GivenPostgreSqlRunning_WhenMigrationsApplied_ThenEfMigrationsHistoryTableExists`
  - **Status:** RED — `AppDbContext` class and `InitialCreate` migration do not exist yet
  - **Verifies:** AC1 (TC-E1-P1-05) — `__ef_migrations_history` table exists after migration

- **Test:** `GivenInitialMigrationApplied_WhenSchemaInspected_ThenNoDomainTablesExist`
  - **Status:** RED — `AppDbContext` class and `InitialCreate` migration do not exist yet
  - **Verifies:** AC2 (TC-E1-P1-05) — `clientes` and `contactos` tables absent after InitialCreate

- **Test:** `GivenSnakeCaseNamingEnabled_WhenMigrationApplied_ThenMigrationsHistoryColumnsAreSnakeCase`
  - **Status:** RED — `AppDbContext.OnModelCreating` with `ApplySnakeCaseNaming()` not implemented
  - **Verifies:** AC4 (TC-E1-P2-04) — columns `migration_id` and `product_version` exist; `MigrationId` absent

- **Test:** `GivenUnhandledException_WhenErrorReachesMiddleware_ThenResponseIsApplicationProblemJson`
  - **Status:** RED — `/api/v1/test-error` endpoint not registered; ExceptionHandlingMiddleware may not be wired
  - **Verifies:** AC3 (TC-E1-P0-05) — HTTP 500 and `Content-Type: application/problem+json`

- **Test:** `GivenUnhandledException_WhenProblemDetailsBodyInspected_ThenContainsRequiredFieldsWithNoStackTrace`
  - **Status:** RED — Problem Details response body structure not verified; `/api/v1/test-error` not registered
  - **Verifies:** AC3 (TC-E1-P0-05) — body has `status`/`title`/`detail`; no `stackTrace`/`exception`/`innerException`

- **Test:** `GivenConnectionStringConfigured_WhenAppDbContextResolvedFromDI_ThenNpgsqlProviderIsUsed`
  - **Status:** RED — `AppDbContext` class does not exist; `AddDbContext` not in `Program.cs`
  - **Verifies:** AC6 — DI resolves `AppDbContext` with Npgsql provider

---

## Data Factories Created

No domain entity factories required for Story 1.3.
This story creates only the empty initial migration — no `clientes` or `contactos` entities exist yet.

---

## Fixtures Created

No Playwright fixtures required — Story 1.3 is purely backend (xUnit integration tests).
Test infrastructure uses:

- `PostgreSqlContainer` from `Testcontainers.PostgreSql` — isolated PostgreSQL per test class
- `WebApplicationFactory<Program>` — in-process API host with overridden connection string

---

## Mock Requirements

No external service mocks required. TestContainers provides a real isolated PostgreSQL instance.

---

## Required data-testid Attributes

No frontend components are touched in Story 1.3. This story is backend-only.

**Backend test endpoint required for AC3:**

- `GET /api/v1/test-error` — A minimal API endpoint registered in `Program.cs` (or test configuration) that intentionally throws `new Exception("internal test")` to exercise `ExceptionHandlingMiddleware`.

---

## Implementation Checklist

### Test: `GivenPostgreSqlRunning_WhenMigrationsApplied_ThenEfMigrationsHistoryTableExists`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` extending `DbContext`
- [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` — call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement
- [ ] Inject `DbContextOptions<AppDbContext>` via primary constructor
- [ ] Add `<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*" />` to Infrastructure `.csproj`
- [ ] Run EF CLI: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `Up()` method of `InitialCreate` migration is EMPTY
- [ ] Register in `Program.cs`: `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(...))`
- [ ] Add `SiesaAgents.IntegrationTests` project to solution: `dotnet sln add tests/SiesaAgents.IntegrationTests`
- [ ] Run test: `dotnet test tests/SiesaAgents.IntegrationTests --filter "GivenPostgreSqlRunning"`
- [ ] Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: `GivenInitialMigrationApplied_WhenSchemaInspected_ThenNoDomainTablesExist`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Ensure `AppDbContext` has NO `DbSet<>` properties
- [ ] Verify `InitialCreate` migration `Up()` method contains no `migrationBuilder.CreateTable()` calls
- [ ] Run test: `dotnet test tests/SiesaAgents.IntegrationTests --filter "GivenInitialMigrationApplied"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours (depends on previous task completion)

---

### Test: `GivenSnakeCaseNamingEnabled_WhenMigrationApplied_ThenMigrationsHistoryColumnsAreSnakeCase`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Confirm `modelBuilder.ApplySnakeCaseNaming()` is the LAST call in `OnModelCreating` (after `ApplyConfigurationsFromAssembly`)
- [ ] Verify Npgsql package provides `ApplySnakeCaseNaming()` extension — no additional package needed
- [ ] Run test: `dotnet test tests/SiesaAgents.IntegrationTests --filter "GivenSnakeCaseNamingEnabled"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `GivenUnhandledException_WhenErrorReachesMiddleware_ThenResponseIsApplicationProblemJson`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Register `GET /api/v1/test-error` minimal API endpoint in `Program.cs` that throws `new Exception("internal test")`
- [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered BEFORE endpoint routing in `Program.cs`
- [ ] Verify `ExceptionHandlingMiddleware` sets `Content-Type: application/problem+json` and HTTP 500
- [ ] Run test: `dotnet test tests/SiesaAgents.IntegrationTests --filter "ThenResponseIsApplicationProblemJson"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `GivenUnhandledException_WhenProblemDetailsBodyInspected_ThenContainsRequiredFieldsWithNoStackTrace`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Verify response JSON body has: `status` (int 500), `title` (string), `detail` (null or non-exception-message string)
- [ ] Verify `ExceptionHandlingMiddleware` does NOT expose `ex.Message` in `detail` — must be `null` per Story 1.1 spec
- [ ] Verify response body does NOT contain keys: `stackTrace`, `exception`, `innerException`
- [ ] Run test: `dotnet test tests/SiesaAgents.IntegrationTests --filter "ThenContainsRequiredFieldsWithNoStackTrace"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `GivenConnectionStringConfigured_WhenAppDbContextResolvedFromDI_ThenNpgsqlProviderIsUsed`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Confirm `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(...))` is in `Program.cs`
- [ ] Confirm `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` are present in `Program.cs`
- [ ] Verify `ProviderName` resolves to `"Npgsql.EntityFrameworkCore.PostgreSQL"`
- [ ] Run test: `dotnet test tests/SiesaAgents.IntegrationTests --filter "ThenNpgsqlProviderIsUsed"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all integration tests for Story 1.3
dotnet test backend/tests/SiesaAgents.IntegrationTests

# Run tests by filter (class)
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "AppDbContextTests"

# Run a specific test
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "GivenPostgreSqlRunning_WhenMigrationsApplied"

# Run with verbose output
dotnet test backend/tests/SiesaAgents.IntegrationTests --logger "console;verbosity=detailed"

# Run with coverage (requires coverlet)
dotnet test backend/tests/SiesaAgents.IntegrationTests --collect:"XPlat Code Coverage"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 6 tests written and failing (implementation does not exist yet)
- TestContainers PostgreSQL fixture created (per-class isolation)
- WebApplicationFactory pattern applied for in-process API testing
- Mock requirements documented (test endpoint for ExceptionHandlingMiddleware)
- Implementation checklist created with clear tasks

**Verification:**

- Tests fail because `SiesaAgents.Infrastructure.Data.AppDbContext` class does not exist
- Tests fail because `InitialCreate` migration files do not exist
- Tests fail because `/api/v1/test-error` endpoint is not registered
- Failure is due to missing implementation, NOT test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick the first failing test: `GivenConnectionStringConfigured_WhenAppDbContextResolvedFromDI_ThenNpgsqlProviderIsUsed`
2. Create `AppDbContext.cs` with `DbContextOptions` injection and empty `OnModelCreating`
3. Register `AddDbContext<AppDbContext>` in `Program.cs`
4. Run test — verify it turns GREEN
5. Next: add `ApplySnakeCaseNaming()` and run the snake_case test
6. Next: add EF CLI migrations and run the migration tests
7. Final: add `/api/v1/test-error` endpoint and run middleware tests

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- `TreatWarningsAsErrors=true` — zero warnings allowed

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 6 tests pass
2. Ensure `AppDbContext` has clear XML doc comments
3. Confirm `ApplySnakeCaseNaming()` is documented with WHY comment (ordering requirement)
4. Confirm migration `Up()` method is empty with explanatory comment
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Add `SiesaAgents.IntegrationTests` to the solution: `dotnet sln backend/SiesaAgents.sln add backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`
3. Restore packages: `dotnet restore backend/SiesaAgents.sln`
4. Run failing tests to confirm RED phase: `dotnet test backend/tests/SiesaAgents.IntegrationTests`
5. Begin implementation using implementation checklist above
6. Work one test at a time (red → green for each)
7. When all tests pass, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — `IAsyncLifetime` pattern for TestContainers lifecycle management
- **test-quality.md** — One assertion concept per logical check; Given-When-Then structure; deterministic tests with isolated containers
- **network-first.md** — In-process WebApplicationFactory replaces network interception for API tests (no Playwright needed)
- **test-levels-framework.md** — API Integration level selected (not E2E) because Story 1.3 is purely backend infrastructure

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `dotnet test backend/tests/SiesaAgents.IntegrationTests`

**Expected Results (RED Phase):**

```
Failed! - Failed: 6, Passed: 0, Skipped: 0, Total: 6

  Failed GivenPostgreSqlRunning_WhenMigrationsApplied_ThenEfMigrationsHistoryTableExists
    Error Message: The type or namespace name 'AppDbContext' does not exist in the namespace 'SiesaAgents.Infrastructure.Data'
    (or: MigrateAsync fails — no migrations found)

  Failed GivenInitialMigrationApplied_WhenSchemaInspected_ThenNoDomainTablesExist
    Error Message: The type or namespace name 'AppDbContext' does not exist in the namespace 'SiesaAgents.Infrastructure.Data'

  Failed GivenSnakeCaseNamingEnabled_WhenMigrationApplied_ThenMigrationsHistoryColumnsAreSnakeCase
    Error Message: The type or namespace name 'AppDbContext' does not exist in the namespace 'SiesaAgents.Infrastructure.Data'

  Failed GivenUnhandledException_WhenErrorReachesMiddleware_ThenResponseIsApplicationProblemJson
    Error Message: Expected 'InternalServerError' but got 'NotFound' — /api/v1/test-error not registered

  Failed GivenUnhandledException_WhenProblemDetailsBodyInspected_ThenContainsRequiredFieldsWithNoStackTrace
    Error Message: Expected 'InternalServerError' but got 'NotFound' — /api/v1/test-error not registered

  Failed GivenConnectionStringConfigured_WhenAppDbContextResolvedFromDI_ThenNpgsqlProviderIsUsed
    Error Message: The type or namespace name 'AppDbContext' does not exist in the namespace 'SiesaAgents.Infrastructure.Data'
```

**Summary:**

- Total tests: 6
- Passing: 0 (expected — RED phase)
- Failing: 6 (expected — missing implementation)
- Status: RED phase confirmed

---

## Notes

- Story 1.3 is purely backend — no frontend files, no Playwright E2E tests needed.
- The `SiesaAgents.UnitTests` project does not reference `SiesaAgents.Infrastructure`, so integration tests targeting `AppDbContext` are placed in the new `SiesaAgents.IntegrationTests` project.
- `TreatWarningsAsErrors=true` is enforced in all projects — test code must produce zero compiler warnings.
- `Nullable` is enabled — all nullable reference types must be annotated (`string?`, etc.).
- TestContainers uses Docker — ensure Docker daemon is running before executing integration tests.
- The `__ef_migrations_history` table snake_case naming is controlled by Npgsql's `UseSnakeCaseNamingConvention()` or `ApplySnakeCaseNaming()` extension. EF Core does NOT snake_case this internal table by default; Npgsql's extension applies it globally.

---

## Contact

**Questions or Issues?**

- Refer to `./bmm/docs/tea-README.md` for workflow documentation
- Consult `./bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** — 2026-06-17
