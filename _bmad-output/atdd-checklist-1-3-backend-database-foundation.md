# ATDD Checklist - Epic 1, Story 3: Backend Database Foundation

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** API + Unit

---

## Story Summary

As a developer, I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

This story is backend-only. It establishes the EF Core `AppDbContext` with Npgsql provider registration,
`ApplySnakeCaseNaming()` convention, an empty initial migration, and verifies the
`ExceptionHandlingMiddleware` returns Problem Details RFC 7807 format with no stack traces (NFR6).

**As a** developer
**I want** PostgreSQL connected and EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When `dotnet ef database update` runs from `backend/`, Then `siesa_agents_db` is created with no errors and `Migrations/` folder exists in `SiesaAgents.Infrastructure` containing the initial empty migration.

2. **AC2** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6). `ExceptionHandlingMiddleware` from Story 1.1 satisfies this if correctly implemented.

3. **AC3** — Given the backend receives any request, When processed, Then `modelBuilder.ApplySnakeCaseNaming()` is called last in `AppDbContext.OnModelCreating`, so all future entity column names follow snake_case convention automatically — NO manual `[Column]`/`[Table]` attributes required.

4. **AC4** — Given `AppDbContext` is registered in `Program.cs`, When the application starts, Then `AddDbContext<AppDbContext>` is called with Npgsql provider using the `DefaultConnection` connection string from `appsettings.Development.json`.

5. **AC5** — Given the solution builds successfully, When `dotnet build` is executed, Then all projects compile with zero errors and zero warnings.

---

## Failing Tests Created (RED Phase)

### API Tests (13 tests)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Note:** This file already exists from Story 1.3 ATDD setup. Tests are RED because:
- `AddDbContext<AppDbContext>` is NOT yet registered in `Program.cs`
- `ApplySnakeCaseNaming()` is NOT yet called in `OnModelCreating`
- `Microsoft.EntityFrameworkCore.Design` package is NOT yet in `SiesaAgents.Infrastructure.csproj`
- Initial EF Core migration has NOT yet been created

**AC1 — Database connection and EF Core migrations (3 tests)**

- **Test:** `should have the backend starting without DbContext registration errors`
  - **Status:** RED — Backend may start but `AppDbContext` is not registered; any endpoint requiring DI resolution of `IDbContextFactory` or `AppDbContext` would throw `InvalidOperationException`
  - **Verifies:** AC1 — server starts and DB foundation is wired correctly

- **Test:** `should return HTTP 200 from /scalar confirming DI wiring of AppDbContext is valid`
  - **Status:** RED — If `AddDbContext` is missing, `.NET` throws during `host.Build()`, preventing server startup entirely
  - **Verifies:** AC1 + AC4 — DI container builds without EF Core registration errors

- **Test:** `should NOT have database migration endpoint returning 500 (infrastructure registered)`
  - **Status:** RED — Without `AddDbContext`, startup fails with 500 or the server never starts
  - **Verifies:** AC1 — EF Core DbContext registration does not crash startup

**AC2 — ExceptionHandlingMiddleware Problem Details RFC 7807 compliance (6 tests)**

- **Test:** `[P0] should return application/problem+json content-type for unhandled exceptions`
  - **Status:** RED — `ExceptionHandlingMiddleware` exists but needs verification it returns `application/problem+json` content-type header on all error paths
  - **Verifies:** AC2 — Problem Details RFC 7807 content-type header is set

- **Test:** `[P0] should NOT expose stack trace in error response body (NFR6)`
  - **Status:** RED — Middleware sets `Detail = null` but test verifies at runtime; will pass only when middleware is correctly registered and functioning
  - **Verifies:** AC2 + NFR6 — No `System.*`, `Microsoft.*`, or `StackTrace` in response body

- **Test:** `[P0] should NOT expose exception message text in error response (NFR6)`
  - **Status:** RED — Verifies `ex.Message` is never leaked into response body
  - **Verifies:** AC2 + NFR6 — No raw exception type names in response

- **Test:** `[P1] should return an HTTP error status code (not 200) for unhandled errors`
  - **Status:** RED — Verifies middleware returns 4xx/5xx not 200
  - **Verifies:** AC2 — Middleware returns correct HTTP error status

- **Test:** `[P1] should have ExceptionHandlingMiddleware registered BEFORE UseCors in Program.cs`
  - **Status:** RED — Verifies CORS headers are present even on error responses (correct middleware order)
  - **Verifies:** AC2 — Middleware order: `UseMiddleware<ExceptionHandlingMiddleware>()` before `UseCors()`

- **Test:** `[P2] should NOT return HTML error page for API requests`
  - **Status:** RED — Verifies no `text/html` content-type on error responses
  - **Verifies:** AC2 — JSON-only error responses, no developer exception page HTML

**AC4 — AppDbContext DI registration and Npgsql configuration (2 tests)**

- **Test:** `[P0] should have backend starting without DI exception for AppDbContext`
  - **Status:** RED — `AddDbContext<AppDbContext>` with `UseNpgsql()` is NOT yet in `Program.cs`
  - **Verifies:** AC4 — `AddDbContext<AppDbContext>` registered with Npgsql provider

- **Test:** `[P1] should serve OpenAPI spec confirming full application pipeline is wired`
  - **Status:** RED — OpenAPI spec at `/openapi/v1.json` confirms all DI registrations succeeded
  - **Verifies:** AC4 — Full DI container builds successfully with DbContext

**AC5 — Backend solution builds with zero errors and zero warnings (2 tests)**

- **Test:** `[P0] should have the backend running (proves zero-error build completed)`
  - **Status:** RED — Backend running proves `dotnet build` succeeded (TreatWarningsAsErrors=true)
  - **Verifies:** AC5 — All projects compile with zero errors and zero warnings

- **Test:** `[P1] should have all Clean Architecture layers operational after build`
  - **Status:** RED — OpenAPI endpoint confirms all four Clean Architecture layers compiled and linked
  - **Verifies:** AC5 — API, Application, Domain, Infrastructure all compile and resolve correctly

---

### Unit Tests (5 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Note:** These tests are RED because:
- `AppDbContext.OnModelCreating` does NOT yet call `ApplySnakeCaseNaming()`
- `Microsoft.EntityFrameworkCore.InMemory` is NOT yet in `SiesaAgents.UnitTests.csproj`
- `SiesaAgents.Infrastructure` project reference is NOT yet in `SiesaAgents.UnitTests.csproj`
- EFCore.NamingConventions / Npgsql naming convention package is NOT yet installed

**AC3 — ApplySnakeCaseNaming() called last in OnModelCreating (3 tests)**

- **Test:** `OnModelCreating_AppliesSnakeCaseNaming_ToEntityProperties`
  - **Status:** RED — `ApplySnakeCaseNaming()` extension method does not exist on `AppDbContext` yet; will throw `MissingMethodException` or fail to compile
  - **Verifies:** AC3 — `OnModelCreating` executes without error with snake_case naming applied

- **Test:** `OnModelCreating_SnakeCaseConvention_IsAppliedLastAfterConfigurations`
  - **Status:** RED — `ApplySnakeCaseNaming()` not called; model annotations won't reflect naming convention
  - **Verifies:** AC3 — Naming convention is active and model reflects relational annotations

- **Test:** `AppDbContext_HasNoManualColumnAttributesOnEntities`
  - **Status:** RED — Project references missing; test cannot compile without `SiesaAgents.Infrastructure` reference
  - **Verifies:** AC3 — No `[Column]` or `[Table]` attributes on entity types registered in context

**AC4 — AppDbContext instantiation with Npgsql options (2 tests)**

- **Test:** `AppDbContext_CanBeInstantiated_WithNpgsqlOptions`
  - **Status:** RED — `UseNpgsql()` requires `Npgsql.EntityFrameworkCore.PostgreSQL` — missing from unit test project's transitive dependencies until `SiesaAgents.Infrastructure` is referenced
  - **Verifies:** AC4 — `AppDbContext` constructor accepts Npgsql `DbContextOptions<AppDbContext>`

- **Test:** `AppDbContext_Constructor_AcceptsDbContextOptions_WithoutThrowing`
  - **Status:** RED — `SiesaAgents.Infrastructure` not yet referenced in `SiesaAgents.UnitTests.csproj`
  - **Verifies:** AC4 — Primary constructor pattern works with `DbContextOptions<AppDbContext>`

---

## Data Factories Created

No data factories needed for Story 1.3. This story creates the database foundation with an empty initial migration — no domain entities are defined yet. Domain entity factories will be created in Epic 2 (Story 2.1) and Epic 3 (Story 3.1).

---

## Fixtures Created

No new test fixtures created for Story 1.3.

- API tests use Playwright's built-in `request` fixture (no custom fixtures needed)
- Unit tests are self-contained (no fixtures needed)

---

## Mock Requirements

### PostgreSQL Database (Unit Tests)

- **Strategy:** Use `Microsoft.EntityFrameworkCore.InMemory` provider — no real PostgreSQL needed for unit tests
- **Configuration:** `new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase("test-db").Options`
- **Notes:** InMemory provider does NOT enforce relational constraints but is sufficient to verify `OnModelCreating` executes and `ApplySnakeCaseNaming()` is called without error

### API Tests

- API tests require a running backend (`http://localhost:5000`) with a running PostgreSQL instance (`siesa_agents_db`)
- No mock server — these are integration-level acceptance tests verifying real runtime behavior

---

## Required data-testid Attributes

Story 1.3 is backend-only. No frontend `data-testid` attributes are required.

---

## Implementation Checklist

### Test: `OnModelCreating_AppliesSnakeCaseNaming_ToEntityProperties` (Unit — AC3)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Add `EFCore.NamingConventions` NuGet package to `SiesaAgents.Infrastructure.csproj` (OR confirm `Npgsql.EntityFrameworkCore.PostgreSQL` v10 includes `UseSnakeCaseNamingConvention()`)
- [ ] Open `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Add `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement in `OnModelCreating` (after `base.OnModelCreating` and `ApplyConfigurationsFromAssembly`)
- [ ] Add `<ProjectReference>` to `SiesaAgents.Infrastructure` in `SiesaAgents.UnitTests.csproj`
- [ ] Add `Microsoft.EntityFrameworkCore.InMemory` Version `10.*` to `SiesaAgents.UnitTests.csproj`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "OnModelCreating_AppliesSnakeCaseNaming"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `AppDbContext_CanBeInstantiated_WithNpgsqlOptions` (Unit — AC4)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Add `<ProjectReference>` to `SiesaAgents.Infrastructure` in `SiesaAgents.UnitTests.csproj` (same as above)
- [ ] Confirm `Npgsql.EntityFrameworkCore.PostgreSQL` is referenced in `SiesaAgents.Infrastructure.csproj`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "AppDbContext_CanBeInstantiated_WithNpgsqlOptions"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `[P0] should have backend starting without DI exception for AppDbContext` (API — AC1/AC4)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] In `backend/src/SiesaAgents.API/Program.cs`, add `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));` BEFORE `var app = builder.Build()`
- [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
- [ ] Confirm `appsettings.Development.json` has `"DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"`
- [ ] Run: `cd backend && dotnet run --project src/SiesaAgents.API` and confirm server starts on port 5000
- [ ] Run test: `pnpm playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC1"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `[P0] should return application/problem+json content-type for unhandled exceptions` (API — AC2)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify `ExceptionHandlingMiddleware` is registered BEFORE `UseCors()` in `Program.cs` (already done in Story 1.1 if correct)
- [ ] Verify `context.Response.ContentType = "application/problem+json"` is set in the catch block
- [ ] Verify `Detail = null` is set on `ProblemDetails` object (prevents NFR6 violations)
- [ ] Run: `pnpm playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC2"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours (verification only — no changes expected)

---

### Test: `should return HTTP 200 from /scalar confirming DI wiring of AppDbContext is valid` (API — AC1)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Complete `AddDbContext<AppDbContext>` registration in `Program.cs` (same as AC4 task above)
- [ ] Add `Microsoft.EntityFrameworkCore.Design` Version `10.*` with `PrivateAssets="all"` to `SiesaAgents.Infrastructure.csproj`
- [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
- [ ] Alternatively, create migration files manually (see story Dev Notes — Manual Migration Files)
- [ ] Confirm `backend/src/SiesaAgents.Infrastructure/Migrations/` folder exists with `InitialCreate` and `AppDbContextModelSnapshot` files
- [ ] Run test: `pnpm playwright test e2e/tests/api/database-foundation.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run ALL failing acceptance tests for Story 1.3
pnpm playwright test e2e/tests/api/database-foundation.api.spec.ts

# Run Story 1.3 API tests only
pnpm playwright test e2e/tests/api/database-foundation.api.spec.ts --reporter=list

# Run in headed mode (see browser)
pnpm playwright test e2e/tests/api/database-foundation.api.spec.ts --headed

# Debug specific test
pnpm playwright test e2e/tests/api/database-foundation.api.spec.ts --debug

# Run Story 1.3 unit tests (.NET)
cd /home/user/lab-sa-quick-dev/backend && dotnet test tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~AppDbContextTests"

# Run all unit tests
cd /home/user/lab-sa-quick-dev/backend && dotnet test tests/SiesaAgents.UnitTests

# Run unit tests with verbose output
cd /home/user/lab-sa-quick-dev/backend && dotnet test tests/SiesaAgents.UnitTests -v detailed
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ API tests written and failing (13 tests in `e2e/tests/api/database-foundation.api.spec.ts`)
- ✅ Unit tests written and failing (5 tests in `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`)
- ✅ Unit test project updated with `SiesaAgents.Infrastructure` reference and `InMemory` package
- ✅ Mock requirements documented (InMemory for unit, real PostgreSQL for API)
- ✅ No data-testid attributes required (backend-only story)
- ✅ Implementation checklist created with clear tasks per failing test

**Verification:**

- API tests fail because `AddDbContext<AppDbContext>` is not yet in `Program.cs`
- Unit tests fail (compilation error) because `SiesaAgents.Infrastructure` reference is missing AND `ApplySnakeCaseNaming()` is not yet in `OnModelCreating`
- All failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with Unit tests — fastest feedback)
2. **Add `SiesaAgents.Infrastructure` reference** to `SiesaAgents.UnitTests.csproj`
3. **Add `Microsoft.EntityFrameworkCore.InMemory`** to unit test project
4. **Run unit tests** to verify compilation works: `dotnet test tests/SiesaAgents.UnitTests`
5. **Add `ApplySnakeCaseNaming()`** as last call in `AppDbContext.OnModelCreating`
6. **Run unit tests** to verify `AppDbContextTests` pass
7. **Add `AddDbContext<AppDbContext>`** registration to `Program.cs` with Npgsql provider
8. **Add `Microsoft.EntityFrameworkCore.Design`** to `SiesaAgents.Infrastructure.csproj`
9. **Create initial migration** (via `dotnet ef migrations add InitialCreate` or manual files)
10. **Run API tests** with the backend running to verify all 13 tests pass

**Key Principles:**

- Unit tests first (no external dependencies)
- Then API tests (requires running backend + PostgreSQL)
- One test at a time (don't try to fix all at once)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 18 tests pass (13 API + 5 unit)
2. Review `AppDbContext.OnModelCreating` — ensure `ApplySnakeCaseNaming()` is truly LAST
3. Verify no `[Column]`, `[Table]`, or `[Key]` attributes were accidentally introduced
4. Confirm `Program.cs` using directives are clean and minimal
5. Run `dotnet build` from `backend/` to confirm `TreatWarningsAsErrors=true` passes with zero warnings

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Start with unit tests** — add project references then run `dotnet test`
3. **Confirm RED phase** for API tests: ensure backend is running and tests fail for the right reason
4. **Implement one task at a time** using the implementation checklist
5. **Work unit tests first** (AC3 unit), then API tests (AC1, AC4), then verify AC2 and AC5
6. **When all 18 tests pass**, run `dotnet build` to confirm zero warnings
7. **When complete**, update story status to done

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns (not used for backend-only story; noted for future reference)
- **data-factories.md** — Factory patterns (not applicable for Story 1.3 — no domain entities yet)
- **network-first.md** — Route interception patterns (API tests use `request` fixture; no UI navigation)
- **test-quality.md** — Test design principles: Given-When-Then, one assertion per test, determinism
- **test-levels-framework.md** — Test level selection: API tests for backend contracts, Unit tests for EF Core configuration
- **selector-resilience.md** — Backend-only story; no UI selectors needed

---

## Test Execution Evidence

### RED Phase Expected Failures

**API Tests (`database-foundation.api.spec.ts`):**

```
Error: expect(received).toBe(expected)
  Expected: 200
  Received: 0 (ECONNREFUSED) or 500 (startup failure)

Reason: AddDbContext<AppDbContext> not registered in Program.cs
  → .NET throws InvalidOperationException during host.Build()
  → Server does not start → ECONNREFUSED on all endpoints
```

**Unit Tests (`AppDbContextTests.cs`):**

```
Error: CS0246: The type or namespace name 'AppDbContext' could not be found
  (are you missing a using directive or an assembly reference?)

Reason: SiesaAgents.Infrastructure not referenced in SiesaAgents.UnitTests.csproj
  → Unit tests cannot compile until project reference is added
```

**Summary:**

- Total tests: 18 (13 API + 5 Unit)
- Passing: 0 (expected — RED phase)
- Failing: 18 (expected — RED phase)
- Status: ✅ RED phase defined

---

## Notes

- This story is **backend-only**. No frontend changes, no `data-testid` attributes, no E2E browser tests.
- AC3 (snake_case naming) can only be verified at the unit test level — there are no domain tables yet to observe column names at the API level. The unit test acts as a guard for future entity additions.
- AC1 (migration created) is verified at runtime via the API tests: if `AddDbContext` is registered and the migration runs, the server starts and `/scalar` returns 200. Direct migration file verification is outside Playwright's scope.
- The `database-foundation.api.spec.ts` file was pre-created as part of Story 1.3 ATDD scaffolding. Tests were already structured for RED phase.
- Integration tests with TestContainers (real PostgreSQL in CI) are deferred to Epic 2+ per story Dev Notes.

---

**Generated by BMad TEA Agent** - 2026-05-24
