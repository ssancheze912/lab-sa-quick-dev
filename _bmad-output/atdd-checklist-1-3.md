# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-18
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit + Playwright)

---

## Story Summary

Story 1.3 wires PostgreSQL connectivity to the .NET 8 backend via EF Core and establishes the `AppDbContext` with snake_case naming convention. It creates an empty initial migration and hardens the `ExceptionHandlingMiddleware` to conform to Problem Details RFC 7807 (no stack trace leakage).

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When `dotnet ef database update` runs, Then `siesa_agents_db` is created and `__ef_migrations_history` table exists.
2. **AC2** — Given an unhandled exception occurs, When the error reaches the middleware, Then the response is HTTP 500 with RFC 7807 Problem Details (`status`, `title`, `detail`), `Content-Type: application/problem+json`, and NO `stackTrace`, `exception`, or `innerException` keys (NFR6).
3. **AC3** — Given the backend receives any request, When processed, Then `ApplySnakeCaseNaming()` is applied as the LAST call in `OnModelCreating` and all EF-managed column names are snake_case.
4. **AC4** — Given the `SiesaAgents.Infrastructure` project, When inspected, Then a `Migrations/` folder exists with at least one migration file.
5. **AC5** — Given the backend solution, When `dotnet build SiesaAgents.sln` runs, Then all projects compile with zero errors and `Npgsql.EntityFrameworkCore.PostgreSQL` is referenced in `SiesaAgents.Infrastructure`.

---

## Failing Tests Created (RED Phase)

### xUnit Integration Tests — AppDbContext (6 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `AppDbContext_CanBeInstantiated_WithInMemoryProvider`
  - **Status:** RED — `SiesaAgents.Infrastructure.Data.AppDbContext` class does not exist yet
  - **Verifies:** AC3 — AppDbContext constructor wiring (DI-compatible)

- **Test:** `AppDbContext_OnModelCreating_DoesNotThrow`
  - **Status:** RED — `AppDbContext` does not exist yet; `EnsureCreated()` cannot be called
  - **Verifies:** AC3 — OnModelCreating runs without exception

- **Test:** `AppDbContext_ModelCreating_RegistersSnakeCaseNamingConvention`
  - **Status:** RED — `AppDbContext` does not exist; `UseSnakeCaseNamingConvention()` not wired
  - **Verifies:** AC3 — UseSnakeCaseNamingConvention() is supported by the context

- **Test:** `Infrastructure_MigrationsFolder_ExistsWithAtLeastOneMigrationFile`
  - **Status:** RED — No migration class exists in `SiesaAgents.Infrastructure.Migrations` namespace
  - **Verifies:** AC4 — At least one migration class generated via `dotnet ef migrations add`

- **Test:** `Infrastructure_MigrationsFolder_ContainsInitialCreateMigration`
  - **Status:** RED — `InitialCreate` migration class does not exist
  - **Verifies:** AC4 — `InitialCreate` migration specifically exists

- **Test:** `Infrastructure_NpgsqlEntityFrameworkCorePostgreSQL_IsReferenced`
  - **Status:** RED — `Npgsql.EntityFrameworkCore.PostgreSQL` not yet in Infrastructure .csproj
  - **Verifies:** AC5 — NuGet package is referenced in Infrastructure project

- **Test:** `AppDbContext_DoesNotContain_ClienteOrContactoDbSets`
  - **Status:** RED (will pass once AppDbContext exists with no DbSet<>) — guards scope boundary
  - **Verifies:** AC3 scope note — ClienteEntity / ContactoEntity MUST NOT be defined in Story 1.3

### xUnit Integration Tests — ExceptionMiddleware (8 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Api/ExceptionMiddlewareTests.cs`

- **Test:** `ExceptionMiddleware_UnhandledException_Returns500StatusCode`
  - **Status:** RED — `Microsoft.AspNetCore.Mvc.Testing` not in UnitTests .csproj; `Program` not accessible
  - **Verifies:** AC2 — HTTP 500 returned for unhandled exception

- **Test:** `ExceptionMiddleware_UnhandledException_ReturnsProblemJsonContentType`
  - **Status:** RED — Same dependency + middleware may not return `application/problem+json`
  - **Verifies:** AC2 — Content-Type is application/problem+json

- **Test:** `ExceptionMiddleware_UnhandledException_ResponseBodyContainsStatusField`
  - **Status:** RED — Middleware missing or not returning RFC 7807 format
  - **Verifies:** AC2 — `status` field present in response body

- **Test:** `ExceptionMiddleware_UnhandledException_ResponseBodyContainsTitleField`
  - **Status:** RED — Middleware missing or not returning RFC 7807 format
  - **Verifies:** AC2 — `title` field present in response body

- **Test:** `ExceptionMiddleware_UnhandledException_ResponseBodyContainsDetailField`
  - **Status:** RED — Middleware missing or not returning RFC 7807 format
  - **Verifies:** AC2 — `detail` field present in response body

- **Test:** `ExceptionMiddleware_UnhandledException_ResponseBodyDoesNotContainStackTrace`
  - **Status:** RED — Default .NET exception handling exposes stack traces
  - **Verifies:** AC2 + NFR6 — `stackTrace` key ABSENT from response

- **Test:** `ExceptionMiddleware_UnhandledException_ResponseBodyDoesNotContainExceptionKey`
  - **Status:** RED — Default handling may expose raw exception details
  - **Verifies:** AC2 + NFR6 — `exception` key ABSENT from response

- **Test:** `ExceptionMiddleware_UnhandledException_ResponseBodyDoesNotContainInnerExceptionKey`
  - **Status:** RED — Default handling may expose inner exception
  - **Verifies:** AC2 + NFR6 — `innerException` key ABSENT from response

- **Test:** `ExceptionMiddleware_UnhandledException_StatusFieldValueIs500`
  - **Status:** RED — Middleware missing or status field not set to 500
  - **Verifies:** AC2 — `status` field equals 500

### Playwright API Tests (10 tests)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

- **Test:** `AC2 > should return HTTP 500 when an unhandled exception occurs`
  - **Status:** RED — `/api/v1/test-error` endpoint does not exist; middleware not wired
  - **Verifies:** AC2 — HTTP 500 from test endpoint

- **Test:** `AC2 > should return Content-Type: application/problem+json`
  - **Status:** RED — Content-Type not set to application/problem+json
  - **Verifies:** AC2 — Correct MIME type for RFC 7807

- **Test:** `AC2 > should include "status" field in Problem Details response body`
  - **Status:** RED — Middleware not producing RFC 7807 JSON
  - **Verifies:** AC2 — `status` field in body

- **Test:** `AC2 > should include "title" field in Problem Details response body`
  - **Status:** RED — Middleware not producing RFC 7807 JSON
  - **Verifies:** AC2 — `title` field in body

- **Test:** `AC2 > should include "detail" field in Problem Details response body`
  - **Status:** RED — Middleware not producing RFC 7807 JSON
  - **Verifies:** AC2 — `detail` field in body

- **Test:** `AC2 > should NOT expose stackTrace (NFR6)`
  - **Status:** RED — Default unhandled exception may expose stack trace
  - **Verifies:** AC2 + NFR6 — `stackTrace` absent

- **Test:** `AC2 > should NOT expose exception key (NFR6)`
  - **Status:** RED — Security guard
  - **Verifies:** AC2 + NFR6 — `exception` absent

- **Test:** `AC2 > should NOT expose innerException key (NFR6)`
  - **Status:** RED — Security guard
  - **Verifies:** AC2 + NFR6 — `innerException` absent

- **Test:** `AC2 > should return status value of 500 in Problem Details body`
  - **Status:** RED — Middleware not returning 500 in body
  - **Verifies:** AC2 — `status` value equals 500

- **Test:** `AC5 smoke > should have the backend running after DbContext registration`
  - **Status:** RED — Backend fails to start because AppDbContext / Npgsql not wired
  - **Verifies:** AC5 — Backend stays healthy post-DbContext DI registration

- **Test:** `AC5 smoke > should return a non-HTML response for a non-existent API endpoint`
  - **Status:** RED — Middleware not registered or returns HTML
  - **Verifies:** AC5 + AC2 — Problem Details active after DB wiring

---

## Data Factories Created

No domain data factories required for Story 1.3. This story creates infrastructure only (no domain entities).

---

## Fixtures Created

No new Playwright fixtures required. Tests use `request` fixture from `@playwright/test` built-in context.

For xUnit tests, `ExceptionMiddlewareTestFactory` (a `WebApplicationFactory<Program>` subclass) is defined inline in `ExceptionMiddlewareTests.cs` to override PostgreSQL dependency with no-op DI for in-process testing.

---

## Mock Requirements

### PostgreSQL Database (xUnit tests only)

- **xUnit:** `AppDbContextTests` uses `UseInMemoryDatabase` — no real PostgreSQL required.
- **xUnit:** `ExceptionMiddlewareTests` uses `WebApplicationFactory<Program>` with DbContext descriptor removed from DI — no real PostgreSQL required.
- **Playwright:** Requires a running backend (`http://localhost:5000`). The backend must have been started with `dotnet run` and PostgreSQL available (for server startup), but the tests only probe the HTTP contract, not the DB directly.

---

## Required data-testid Attributes

Story 1.3 is purely backend infrastructure. No frontend components are created. No `data-testid` attributes are required.

---

## Implementation Checklist

### Test: AppDbContextTests (AC3, AC4, AC5)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Install `EFCore.NamingConventions` NuGet package: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
- [ ] Install `Npgsql.EntityFrameworkCore.PostgreSQL` if not present: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` inheriting `DbContext`
- [ ] Add constructor `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)`
- [ ] Override `OnModelCreating`: call `base.OnModelCreating(modelBuilder)`, then `modelBuilder.ApplyConfigurationsFromAssembly(...)`, LAST call: `modelBuilder.UseSnakeCaseNamingConvention()`
- [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
- [ ] Add project reference from `SiesaAgents.UnitTests` to `SiesaAgents.Infrastructure` in the test `.csproj`
- [ ] Run test: `dotnet test tests/SiesaAgents.UnitTests --filter "AppDbContextTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: ExceptionMiddlewareTests (AC2, NFR6)

**File:** `backend/tests/SiesaAgents.UnitTests/Api/ExceptionMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Add `Microsoft.AspNetCore.Mvc.Testing` to UnitTests project: `dotnet add tests/SiesaAgents.UnitTests package Microsoft.AspNetCore.Mvc.Testing`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` to API project: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design`
- [ ] Add project reference from `SiesaAgents.UnitTests` to `SiesaAgents.API` in the test `.csproj`
- [ ] Verify/create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (from Story 1.1)
- [ ] Ensure middleware returns `Content-Type: application/problem+json`
- [ ] Ensure response body shape: `{ "status": 500, "title": "Internal Server Error", "detail": "An unexpected error occurred." }`
- [ ] Ensure NO `stackTrace`, `exception`, `innerException` keys in response body
- [ ] Register middleware in `Program.cs` as FIRST middleware: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Register test endpoint `GET /api/v1/test-error` (or verify `ExceptionMiddlewareTestFactory` in the test file properly maps it)
- [ ] Add `<InternalsVisibleTo>` or set `Program` class as `public` if needed for `WebApplicationFactory<Program>` to resolve
- [ ] Run test: `dotnet test tests/SiesaAgents.UnitTests --filter "ExceptionMiddlewareTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Playwright backend-database-foundation.api.spec.ts (AC2, AC5)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Complete all implementation tasks above (AppDbContext + ExceptionHandlingMiddleware)
- [ ] Register `AppDbContext` in DI in `Program.cs` using `UseNpgsql(connectionString).UseSnakeCaseNamingConvention()`
- [ ] Ensure `GET /api/v1/test-error` endpoint is registered in `Program.cs` (or `ExceptionHandlingMiddleware` test wires it)
- [ ] Start backend: `cd backend && dotnet run --project src/SiesaAgents.API`
- [ ] Run test: `cd e2e && npx playwright test tests/api/backend-database-foundation.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours (assuming backend implementation complete)

---

## Running Tests

```bash
# Run all xUnit tests for Story 1.3
cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "AppDbContextTests|ExceptionMiddlewareTests"

# Run AppDbContext tests only
cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "AppDbContextTests"

# Run ExceptionMiddleware tests only
cd backend && dotnet test tests/SiesaAgents.UnitTests --filter "ExceptionMiddlewareTests"

# Run Playwright API tests for Story 1.3
cd e2e && npx playwright test tests/api/backend-database-foundation.api.spec.ts

# Run all backend unit tests
cd backend && dotnet test tests/SiesaAgents.UnitTests

# Run all Playwright API tests
cd e2e && npx playwright test tests/api/

# Run in headed mode (Playwright)
cd e2e && npx playwright test tests/api/backend-database-foundation.api.spec.ts --headed

# Debug Playwright test
cd e2e && npx playwright test tests/api/backend-database-foundation.api.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- No domain factories or fixtures required for this infrastructure story
- Mock requirements documented (InMemory DB for xUnit; real backend for Playwright)
- Implementation checklist created

**Verification:**

- xUnit tests fail because `AppDbContext` class does not exist
- xUnit tests fail because `Microsoft.AspNetCore.Mvc.Testing` is not in the test project
- Playwright tests fail because `/api/v1/test-error` endpoint does not exist
- All failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify green
5. Check off the task in the implementation checklist
6. Move to next test and repeat

**Recommended order:**

1. Create `AppDbContext.cs` → pass `AppDbContext_CanBeInstantiated_WithInMemoryProvider`
2. Add snake_case convention → pass `AppDbContext_ModelCreating_RegistersSnakeCaseNamingConvention`
3. Add Npgsql package → pass `Infrastructure_NpgsqlEntityFrameworkCorePostgreSQL_IsReferenced`
4. Run `dotnet ef migrations add InitialCreate` → pass `Infrastructure_MigrationsFolder_ExistsWithAtLeastOneMigrationFile`
5. Add `Microsoft.AspNetCore.Mvc.Testing` to test project → enable ExceptionMiddleware tests
6. Verify/harden `ExceptionHandlingMiddleware` → pass all 8 ExceptionMiddlewareTests
7. Start backend and run Playwright tests → pass all 10 Playwright tests

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review `OnModelCreating` for correct ordering (LAST call is snake_case)
3. Ensure middleware registration order in `Program.cs` is correct
4. Extract any duplicated test infrastructure if needed
5. Run full test suite to verify nothing regressed

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase:
   - `cd backend && dotnet test tests/SiesaAgents.UnitTests`
   - `cd e2e && npx playwright test tests/api/backend-database-foundation.api.spec.ts`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality

---

## Knowledge Base References Applied

- **fixture-architecture.md** — `WebApplicationFactory<Program>` as in-process test fixture with DI override
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure, deterministic tests
- **test-levels-framework.md** — API Integration level selected (no UI; infrastructure/contract testing)
- **network-first.md** — Playwright `request` fixture used for HTTP contract testing (no navigation required)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**xUnit command:** `cd backend && dotnet test tests/SiesaAgents.UnitTests`

**Expected failures:**

- `AppDbContextTests` → compile error: `SiesaAgents.Infrastructure.Data.AppDbContext` not found (type does not exist)
- `ExceptionMiddlewareTests` → compile error: `Microsoft.AspNetCore.Mvc.Testing` not referenced; `WebApplicationFactory<Program>` not resolvable
- All 14 xUnit tests: FAIL (compilation errors = RED phase confirmed)

**Playwright command:** `cd e2e && npx playwright test tests/api/backend-database-foundation.api.spec.ts`

**Expected failures:**

- All 10 Playwright tests: FAIL — `/api/v1/test-error` returns 404 (endpoint not registered); `/scalar` may return connection refused if backend not started post-AppDbContext wiring
- Status: RED phase verified

**Summary:**

- Total tests: 24 (14 xUnit + 10 Playwright)
- Passing: 0 (expected)
- Failing: 24 (expected)
- Status: RED phase verified

---

## Notes

- Story 1.3 is purely backend infrastructure — no frontend components, no data-testid attributes required.
- The `ExceptionMiddlewareTestFactory` in `ExceptionMiddlewareTests.cs` removes the DbContext DI descriptor to avoid PostgreSQL dependency in CI. The `WebApplicationFactory` creates an in-process test server.
- The initial migration is intentionally empty (no domain tables). Tests guard the scope boundary: `AppDbContext_DoesNotContain_ClienteOrContactoDbSets` will fail if someone prematurely adds `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>`.
- `Program` class must be accessible to `WebApplicationFactory<Program>`. Add `public partial class Program {}` at the end of `Program.cs` if visibility is an issue (common in .NET minimal API pattern).
- The xUnit test project currently references `SiesaAgents.Application` and `SiesaAgents.Domain`. Task 5 of the story requires adding a reference to `SiesaAgents.Infrastructure` and `SiesaAgents.API`.

---

**Generated by BMad TEA Agent** — 2026-06-18
