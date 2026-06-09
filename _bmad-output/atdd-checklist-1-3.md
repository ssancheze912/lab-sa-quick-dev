# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-09
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit)

---

## Story Summary

Story 1.3 establishes the PostgreSQL database connection and EF Core infrastructure for the Siesa Agents backend. It creates `AppDbContext` with snake_case naming convention, applies an initial empty migration, and verifies the Exception Handling Middleware returns Problem Details RFC 7807 format without exposing stack traces.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC#1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update`, Then `siesa_agents_db` is created with no errors and the EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **AC#2** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format with `status`, `title`, and `detail` fields, uses `Content-Type: application/problem+json`, and exposes NO stack traces or raw exception messages (NFR6).

3. **AC#3** — Given the backend receives any request, When EF Core models are configured via `OnModelCreating`, Then `modelBuilder.ApplySnakeCaseNaming()` is applied as the LAST call in `OnModelCreating`, ensuring all future column names follow snake_case convention automatically.

4. **AC#4** — Given the initial migration is created and applied, When the developer inspects the `siesa_agents_db` schema, Then only the `__ef_migrations_history` table exists — no domain tables (`clientes`, `contactos`) are present.

5. **AC#5** — Given the Infrastructure project references the Domain project and is wired to the API via DI, When the developer runs `dotnet build SiesaAgents.slnx`, Then all four Clean Architecture projects compile with zero errors.

---

## Failing Tests Created (RED Phase)

### E2E Tests (0 tests)

Not applicable — Story 1.3 is a backend-only story (`has_ui_component = false`). No E2E tests required.

---

### API Integration Tests (10 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionMiddlewareTests.cs`

- RED **Test:** `ExceptionMiddleware_ReturnsHttp500_WhenUnhandledExceptionOccurs`
  - **Status:** RED — Will fail if `ExceptionHandlingMiddleware` is not wired or test server not configured
  - **Verifies:** AC#2 — HTTP 500 status on unhandled exception
  - **Test Case:** TC-E1-P0-05a | **Priority:** P0

- RED **Test:** `ExceptionMiddleware_ReturnsApplicationProblemJson_ContentType`
  - **Status:** RED — Will fail if Content-Type header is not `application/problem+json`
  - **Verifies:** AC#2 — RFC 7807 Content-Type header
  - **Test Case:** TC-E1-P0-05b | **Priority:** P0

- RED **Test:** `ExceptionMiddleware_ResponseBody_ContainsStatusAndTitleFields`
  - **Status:** RED — Will fail if response body does not contain `"status"` and `"title"` JSON keys
  - **Verifies:** AC#2 — Problem Details required fields
  - **Test Case:** TC-E1-P0-05c | **Priority:** P0

- RED **Test:** `ExceptionMiddleware_ResponseBody_DoesNotExposeRawExceptionMessage`
  - **Status:** RED — Will fail if raw exception message leaks into response (NFR6 violation)
  - **Verifies:** AC#2 — No raw exception message exposed
  - **Test Case:** TC-E1-P0-05d | **Priority:** P0

- RED **Test:** `ExceptionMiddleware_ResponseBody_DoesNotContainStackTrace`
  - **Status:** RED — Will fail if `stackTrace`, `exception`, or `innerException` keys appear in response
  - **Verifies:** AC#2 — No stack trace in response (NFR6)
  - **Test Case:** TC-E1-P0-05e | **Priority:** P0

- RED **Test:** `ExceptionMiddleware_ProblemDetails_StatusFieldEquals500`
  - **Status:** RED — Will fail if deserialized `ProblemDetails.Status` is not 500
  - **Verifies:** AC#2 — Problem Details status field value
  - **Test Case:** TC-E1-P0-05f | **Priority:** P0

- RED **Test:** `ExceptionMiddleware_ProblemDetails_DetailFieldIsNull`
  - **Status:** RED — Will fail if `ProblemDetails.Detail` contains exception detail instead of null
  - **Verifies:** AC#2 — Detail is null, no exception detail exposed (NFR6)
  - **Test Case:** TC-E1-P0-05g | **Priority:** P0

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- RED **Test:** `AppDbContext_CanBeResolvedFromDI_WhenRegisteredWithInMemoryProvider`
  - **Status:** RED — `SiesaAgents.Infrastructure.Data.AppDbContext` does not exist yet
  - **Verifies:** AC#5 — AppDbContext registers and resolves from DI container
  - **Priority:** P1

- RED **Test:** `AppDbContext_HasNoDomainDbSets_RespectingScopeBoundary`
  - **Status:** RED — `AppDbContext` does not exist yet
  - **Verifies:** AC#4 — No domain DbSet properties in this story's scope
  - **Priority:** P1

- RED **Test:** `AppDbContext_OnModelCreating_DoesNotThrow_WithInMemoryDatabase`
  - **Status:** RED — `AppDbContext` does not exist yet
  - **Verifies:** AC#3 — OnModelCreating runs without errors (validates model configuration)
  - **Priority:** P1

**Integration Tests (require live PostgreSQL):**

- RED **Test:** `EfCoreMigration_CreatesSiesaAgentsDb_WithMigrationsHistoryTable` `[Trait("Category","Integration")]`
  - **Status:** RED — `AppDbContext` and migrations do not exist yet
  - **Verifies:** AC#1, TC-E1-P1-05 — Database and `__ef_migrations_history` table created
  - **Priority:** P1

- RED **Test:** `EfCoreMigration_DoesNotCreateDomainTables_InInitialMigration` `[Trait("Category","Integration")]`
  - **Status:** RED — `AppDbContext` and migrations do not exist yet
  - **Verifies:** AC#4 — Scope boundary: no `clientes` or `contactos` tables after initial migration
  - **Priority:** P1

- RED **Test:** `EfCoreMigration_HistoryTable_HasSnakeCaseColumnNames` `[Trait("Category","Integration")]`
  - **Status:** RED — `AppDbContext` + `EFCore.NamingConventions` package do not exist yet
  - **Verifies:** AC#3, TC-E1-P2-04 — `migration_id` and `product_version` columns in snake_case
  - **Priority:** P2

### Component Tests (0 tests)

Not applicable — Story 1.3 is a backend-only story (`has_ui_component = false`). No component tests required.

---

## Data Factories Created

Story 1.3 has no domain entities. No data factories are required. The existing `WebApplicationFactory<Program>` pattern is used for API integration tests.

---

## Fixtures Created

No custom test fixtures are required. Tests use:
- `WebApplication.CreateBuilder()` with test server for middleware tests
- `DbContextOptionsBuilder` with `UseInMemoryDatabase` for in-process AppDbContext tests
- `DbContextOptionsBuilder` with `UseNpgsql` for live PostgreSQL integration tests

---

## Mock Requirements

Story 1.3 has no external service dependencies beyond PostgreSQL. No service mocking is required.

### PostgreSQL (Integration Tests Only)

**Connection String:**
```
Host=localhost;Database=siesa_agents_db_test;Username=postgres;Password=postgres
```

**Notes:** Integration tests create isolated test databases (`siesa_agents_db_test`, `siesa_agents_db_scope_test`, `siesa_agents_db_naming_test`) and delete them in teardown (`EnsureDeletedAsync`). Requires PostgreSQL 18+ running locally with a `postgres` user having `CREATE DATABASE` privilege.

---

## Required data-testid Attributes

Not applicable — Story 1.3 is a pure backend story with no UI components.

---

## Implementation Checklist

### Test: ExceptionMiddleware_ReturnsHttp500* (7 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Verify `ExceptionHandlingMiddleware.cs` wraps `await next(context)` in try/catch (Story 1.1 — confirm)
- [ ] Ensure catch block sets `Content-Type: application/problem+json`
- [ ] Ensure catch block returns HTTP 500 status
- [ ] Ensure `ProblemDetails.Detail = null` (never `ex.Message` or `ex.StackTrace`)
- [ ] Ensure `ProblemDetails.Status = 500` and `ProblemDetails.Title` is set
- [ ] Confirm middleware is registered BEFORE `app.UseCors()` and endpoint mapping in `Program.cs`
- [ ] Add `Microsoft.AspNetCore.TestHost` package if `GetTestClient()` is not available
- [ ] Run test: `dotnet test --filter "FullyQualifiedName~ExceptionMiddlewareTests"`
- [ ] All 7 tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AppDbContext_CanBeResolvedFromDI

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Inherit from `DbContext`, accept `DbContextOptions<AppDbContext>` via constructor
- [ ] Add `using SiesaAgents.Infrastructure.Data;` in test file (namespace must match)
- [ ] Register `AppDbContext` in `Program.cs` DI container using `AddDbContext<AppDbContext>`
- [ ] Run test: `dotnet test --filter "AppDbContext_CanBeResolvedFromDI"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AppDbContext_HasNoDomainDbSets_RespectingScopeBoundary

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] `AppDbContext` must NOT define any `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` properties
- [ ] Confirm no entity configurations exist in `Configurations/` folder (scope boundary)
- [ ] Run test: `dotnet test --filter "AppDbContext_HasNoDomainDbSets"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AppDbContext_OnModelCreating_DoesNotThrow

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` in `AppDbContext`
- [ ] Call `base.OnModelCreating(modelBuilder)` first
- [ ] Call `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())`
- [ ] Add `EFCore.NamingConventions` NuGet package to `SiesaAgents.Infrastructure`
- [ ] Call `modelBuilder.ApplySnakeCaseNaming()` as the LAST line (CRITICAL ordering)
- [ ] Run test: `dotnet test --filter "AppDbContext_OnModelCreating_DoesNotThrow"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: EfCoreMigration_CreatesSiesaAgentsDb (Integration)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.Infrastructure.csproj`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API.csproj`
- [ ] Run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `Migrations/` folder created with `InitialCreate` files
- [ ] Verify migration `Up()` and `Down()` are empty (no domain table code)
- [ ] Verify PostgreSQL is running at `localhost:5432` with `postgres`/`postgres` credentials
- [ ] Run test: `dotnet test --filter "Category=Integration"`
- [ ] `siesa_agents_db_test` created, `__ef_migrations_history` exists, deleted in teardown
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: EfCoreMigration_HistoryTable_HasSnakeCaseColumnNames (Integration, P2)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] `EFCore.NamingConventions` package installed and `ApplySnakeCaseNaming()` is the LAST call in `OnModelCreating`
- [ ] Migration re-created after `EFCore.NamingConventions` is added (naming affects migration output)
- [ ] `information_schema.columns` for `__ef_migrations_history` shows `migration_id` and `product_version`
- [ ] Run test: `dotnet test --filter "EfCoreMigration_HistoryTable_HasSnakeCaseColumnNames"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.0 hour

---

## Running Tests

```bash
# Run all Story 1.3 tests (unit + in-memory, skips integration)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~API.ExceptionMiddlewareTests|FullyQualifiedName~Infrastructure.AppDbContextTests"

# Run only P0 middleware tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ExceptionMiddlewareTests"

# Run only AppDbContext in-memory tests (no PostgreSQL needed)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~AppDbContextTests&Category!=Integration"

# Run only integration tests (requires live PostgreSQL)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "Category=Integration"

# Run all backend tests
dotnet test backend/

# Run with verbose output
dotnet test backend/tests/SiesaAgents.UnitTests/ --logger "console;verbosity=detailed"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- All 13 tests written and failing (RED)
- No custom fixtures required (standard `DbContextOptionsBuilder` + in-process test server)
- No data factories required (no domain entities in this story)
- Mock requirements documented (PostgreSQL connection string for integration tests)
- No data-testid attributes required (backend-only story)
- Implementation checklist created with clear tasks per test

**Verification:**

Build fails with:
```
error CS0234: The type or namespace name 'Infrastructure' does not exist in the namespace 'SiesaAgents'
```
This is the expected RED state. `AppDbContext` in `SiesaAgents.Infrastructure.Data` does not exist until Story 1.3 tasks are implemented.

Middleware tests compile but will fail at runtime if `ExceptionHandlingMiddleware` is not correctly wired with the test server.

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with P0 middleware tests — already partly implemented in Story 1.1)
2. **Task 1 (Task 5 in story):** Verify `ExceptionHandlingMiddleware.cs` matches the required pattern — run 7 middleware tests
3. **Task 2:** Create `AppDbContext.cs` in `SiesaAgents.Infrastructure/Data/` — run in-memory tests
4. **Task 3:** Add NuGet packages (`EFCore.NamingConventions`, `Microsoft.EntityFrameworkCore.Design`) — rebuild
5. **Task 4:** Create and apply initial migration — run integration tests (requires PostgreSQL)
6. **Task 5:** Verify snake_case column naming — run P2 integration test

**Key Principles:**

- One test at a time (start with P0, then P1, then P2)
- Minimal implementation (no domain entities in this story)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

After all 13 tests pass:

1. Review `AppDbContext.cs` for readability and alignment with company standards
2. Confirm `ApplySnakeCaseNaming()` is LAST call in `OnModelCreating` (critical architectural rule)
3. Ensure no hardcoded connection strings in source code (use `appsettings.Development.json`)
4. Confirm `ExceptionHandlingMiddleware` does not log raw `ex.Message` to response (only to ILogger)
5. Run full test suite to confirm all still pass

---

## Next Steps

1. Share this checklist with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ExceptionMiddlewareTests|FullyQualifiedName~AppDbContextTests"`
3. Begin implementation starting with Task 5 (verify middleware — AC#2, fastest to green)
4. Then Task 2 (create `AppDbContext`) — unlocks all in-memory tests
5. Then Tasks 1, 3, 4 (NuGet packages + migration + DB) — unlocks integration tests
6. When all tests pass, refactor code for quality
7. Update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Minimal test fixtures using standard .NET `DbContextOptionsBuilder` (no Playwright fixtures needed for backend-only story)
- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic isolation, auto-cleanup in teardown (`EnsureDeletedAsync`)
- **test-levels-framework.md** — API Integration level selected (business logic, service contracts); E2E/Component not applicable (no UI)
- **network-first.md** — Not applicable (no browser navigation in backend tests)
- **data-factories.md** — Not applicable (no domain entities in Story 1.3 scope)

---

## Test Execution Evidence

### Initial Build Status (RED Phase Verification)

**Command:** `dotnet build backend/tests/SiesaAgents.UnitTests/`

**Results:**

```
error CS0234: The type or namespace name 'Infrastructure' does not exist in the namespace 'SiesaAgents'
Build FAILED — 1 Error, 0 Warnings
```

**Summary:**

- Total tests: 13
- Passing: 0 (expected — RED phase)
- Failing: 13 (expected)
- Status: RED phase confirmed

**Expected Failure Messages:**

- `AppDbContextTests.cs(13,19): error CS0234` — `SiesaAgents.Infrastructure.Data.AppDbContext` does not exist (Tasks 1-4 not implemented)
- `ExceptionMiddlewareTests.*` — Will fail at runtime if test server infrastructure is not correctly configured

---

## Notes

- Story 1.3 is **pure backend** — `has_ui_component = false`. No Playwright E2E or React component tests apply.
- `ExceptionHandlingMiddleware` was created in Story 1.1 (Task 4). The 7 P0 middleware tests verify it meets the Problem Details RFC 7807 contract exactly.
- Integration tests (`[Trait("Category", "Integration")]`) require a live PostgreSQL instance. They should be excluded from fast unit test runs and included in CI integration stage.
- The `EFCore.NamingConventions` package is a **separate** dependency from `Npgsql.EntityFrameworkCore.PostgreSQL`. It must be explicitly added.
- `ApplySnakeCaseNaming()` MUST be the absolute last call in `OnModelCreating`. This is a critical architectural rule documented in company standards.
- Test databases for integration tests use unique names (`siesa_agents_db_test`, etc.) to avoid collisions with the development database.

---

**Generated by BMad TEA Agent** — 2026-06-09
