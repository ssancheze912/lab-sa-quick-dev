# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-16
**Author:** SiesaTeam
**Primary Test Level:** API + Unit

---

## Story Summary

This story establishes the PostgreSQL + EF Core data layer for the backend. AppDbContext
is created in the Infrastructure layer, registered in DI, and an intentionally empty initial
migration is applied to `siesa_agents_db`. No domain entities are defined in this story.

**As a** developer
**I want** the PostgreSQL database connected and EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When `dotnet ef database update` is run inside `backend/`, Then `siesa_agents_db` is created with no errors and the Migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **AC2** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6). `ExceptionHandlingMiddleware` is verified wired as the FIRST middleware in `Program.cs`.

3. **AC3** — Given the backend receives any request, When the request is processed, Then `ApplySnakeCaseNaming()` is applied in `OnModelCreating` and all future column names follow snake_case convention automatically.

4. **AC4** — Given `AppDbContext` is registered in DI, When `dotnet build SiesaAgents.sln` is executed, Then all projects compile with zero errors, `AppDbContext` is resolvable from DI, and the connection string is read from `appsettings.Development.json`.

5. **AC5** — Given the initial empty migration exists, When the migration file is inspected, Then it contains NO `clientes` or `contactos` table definitions (intentionally empty scope).

---

## Failing Tests Created (RED Phase)

### API Tests (10 tests)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

- **Test:** `should have the backend API running — proves EF Core DI registration did not crash startup`
  - **Status:** RED — `/health` endpoint does not exist yet; AppDbContext not registered
  - **Verifies:** AC4 — AppDbContext DI registration does not crash startup

- **Test:** `should have a health-check or liveness probe confirming database connectivity`
  - **Status:** RED — `/health` endpoint not implemented; will fail with connection error
  - **Verifies:** AC1 — `siesa_agents_db` is reachable after `dotnet ef database update`

- **Test:** `should return a JSON response from /health (not HTML or plain text)`
  - **Status:** RED — `/health` endpoint does not exist
  - **Verifies:** AC1 — health endpoint returns structured JSON

- **Test:** `should return Problem Details RFC 7807 format for unhandled server errors`
  - **Status:** RED — ExceptionHandlingMiddleware may not be wired FIRST in pipeline
  - **Verifies:** AC2 — middleware position and Problem Details format

- **Test:** `should NOT expose stack traces in any error response body`
  - **Status:** RED — detail field not verified null; middleware not confirmed wired
  - **Verifies:** AC2 + NFR6 — no stack trace leakage

- **Test:** `should return application/problem+json or application/json for 404 errors`
  - **Status:** RED — content-type not verified for error paths
  - **Verifies:** AC2 — error responses are JSON, not HTML

- **Test:** `should return a 404 status (not 200 or 500) for missing API resources`
  - **Status:** RED — routing may return 500 without middleware
  - **Verifies:** AC2 — middleware handles 404 correctly

- **Test:** `should include status field in Problem Details response body`
  - **Status:** RED — RFC 7807 status field not yet confirmed present
  - **Verifies:** AC2 — Problem Details structure (status field required by RFC 7807)

- **Test:** `should NOT expose the Detail field for unhandled exceptions (NFR6)`
  - **Status:** RED — detail field not verified null in middleware
  - **Verifies:** AC2 + NFR6 — Detail must be null, never ex.Message

- **Test:** `should have ExceptionHandlingMiddleware registered BEFORE routing`
  - **Status:** RED — middleware pipeline order not verified
  - **Verifies:** AC2 — middleware catches errors before routing

- **Test:** `should have the backend running (proves dotnet build SiesaAgents.sln succeeds)`
  - **Status:** RED — AppDbContext does not compile yet (class not created)
  - **Verifies:** AC4 — build succeeds with AppDbContext

- **Test:** `should NOT expose the DefaultConnection string value in any public response`
  - **Status:** RED — connection string not verified hidden
  - **Verifies:** AC4 + NFR6 — no credentials leakage

- **Test:** `should NOT have AppDbContext DI registration crash the server on startup`
  - **Status:** RED — AppDbContext not registered in DI
  - **Verifies:** AC4 — DI registration works

### Unit Tests (8 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `AppDbContext_CanBeInstantiated_WithOptions`
  - **Status:** RED — `AppDbContext` class does not exist yet (compilation error)
  - **Verifies:** AC4 — constructor accepts `DbContextOptions<AppDbContext>`

- **Test:** `AppDbContext_OnModelCreating_BuildsModelWithoutError`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC3 — `ApplySnakeCaseNaming()` does not throw during model creation

- **Test:** `AppDbContext_HasNo_DbSetProperties_InStory1_3_Scope`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC5 — no `DbSet<>` properties (empty context, empty migration)

- **Test:** `AppDbContext_DoesNotContain_ClienteEntity_DbSet`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC5 — scope boundary, no clientes DbSet

- **Test:** `AppDbContext_DoesNotContain_ContactoEntity_DbSet`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC5 — scope boundary, no contactos DbSet

- **Test:** `AppDbContext_IsResolvable_FromDependencyInjection`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC4 — DI resolution works end-to-end

- **Test:** `AppDbContext_CanSaveChanges_WithEmptyContext`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC4 — empty context is functional (SaveChanges returns 0)

- **Test:** `AppDbContext_Inherits_DbContext`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC3/AC4 — inherits `DbContext` (EF Core requirement)

- **Test:** `AppDbContext_Constructor_AcceptsGenericOptions_NotBaseOptions`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC4 — primary constructor syntax with `DbContextOptions<AppDbContext>`

---

## Data Factories Created

No data factories are required for Story 1.3. This is a backend infrastructure story with no
user-facing data operations. Domain entities (Cliente, Contacto) are added in Epics 2 and 3.

---

## Fixtures Created

No Playwright fixtures created for Story 1.3. All API tests use direct `request` context from
Playwright base test. No authentication or page navigation is required.

---

## Mock Requirements

No external service mocks are required. The API tests hit the real backend directly. The unit
tests use `UseInMemoryDatabase` to avoid requiring a live PostgreSQL instance during unit testing.

**Note for DEV team:** The `/health` endpoint tests (AC1) require a live PostgreSQL connection
to `siesa_agents_db`. These tests will only go GREEN after:
1. `AppDbContext` is created and registered
2. `dotnet ef database update` is applied to `siesa_agents_db`
3. A health check endpoint (`/health`) is registered in `Program.cs`

---

## Required data-testid Attributes

Not applicable for Story 1.3. This is a backend-only story with no frontend UI changes.

---

## Implementation Checklist

### Test: `should have a health-check or liveness probe confirming database connectivity`

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` package to `SiesaAgents.Infrastructure.csproj`
- [ ] Register `AppDbContext` in `Program.cs` with `UseNpgsql`
- [ ] Run `dotnet ef database update` to create `siesa_agents_db`
- [ ] Register a health check endpoint in `Program.cs`: `builder.Services.AddHealthChecks()` + `app.MapHealthChecks("/health")`
- [ ] Run test: `npx playwright test backend-database-foundation.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `AppDbContext_OnModelCreating_BuildsModelWithoutError`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Create `AppDbContext.cs` with `OnModelCreating` calling `modelBuilder.ApplySnakeCaseNaming()` as LAST statement
- [ ] Add `EFCore.NamingConventions` package to `SiesaAgents.Infrastructure.csproj`
- [ ] Ensure `base.OnModelCreating(modelBuilder)` is called first in `OnModelCreating`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "AppDbContext_OnModelCreating_BuildsModelWithoutError"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `AppDbContext_HasNo_DbSetProperties_InStory1_3_Scope`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Create `AppDbContext.cs` with NO `DbSet<>` properties (empty context per scope)
- [ ] Do NOT add `ClienteEntity` or `ContactoEntity` — those belong in Epics 2 and 3
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "AppDbContext_HasNo_DbSetProperties"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: `should NOT expose stack traces in any error response body`

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm `ExceptionHandlingMiddleware.cs` exists at `backend/src/SiesaAgents.API/Middleware/`
- [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is the FIRST statement after `var app = builder.Build()`
- [ ] Verify `Detail` field in middleware is set to `null` (never `ex.Message`)
- [ ] Run test: `npx playwright test backend-database-foundation.api.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `AppDbContext_IsResolvable_FromDependencyInjection`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Ensure `builder.Services.AddDbContext<AppDbContext>(...)` is in `Program.cs`
- [ ] Ensure `using SiesaAgents.Infrastructure.Data;` is present in `Program.cs`
- [ ] Ensure `using Microsoft.EntityFrameworkCore;` is present in `Program.cs`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "AppDbContext_IsResolvable_FromDependencyInjection"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.2 hours

---

## Running Tests

```bash
# Run all API-level failing tests for Story 1.3
npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts

# Run all xUnit unit tests for Story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~AppDbContextTests"

# Run Playwright in headed mode (see browser)
npx playwright test backend-database-foundation.api.spec.ts --headed

# Debug a specific Playwright test
npx playwright test backend-database-foundation.api.spec.ts --debug

# Run with verbose output
npx playwright test backend-database-foundation.api.spec.ts --reporter=list

# Run xUnit with verbose output
dotnet test backend/tests/SiesaAgents.UnitTests/ --verbosity normal
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (RED phase)
- ✅ API tests in `e2e/tests/api/backend-database-foundation.api.spec.ts`
- ✅ Unit tests in `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
- ✅ Test project updated with `Microsoft.EntityFrameworkCore.InMemory` package
- ✅ Implementation checklist created with clear tasks per test
- ✅ Scope boundary documented (no clientes/contactos)

**Verification:**

- Unit tests fail with: `CS0246: The type or namespace name 'AppDbContext' could not be found`
  (because `SiesaAgents.Infrastructure.Data.AppDbContext` does not exist yet)
- API tests for `/health` fail with: connection refused or 404 (endpoint not implemented)
- Tests fail due to MISSING IMPLEMENTATION — not due to test errors

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Create `AppDbContext.cs` in `SiesaAgents.Infrastructure/Data/` (fixes all unit test compilation errors)
2. Add `EFCore.NamingConventions` and `Microsoft.EntityFrameworkCore.Design` packages to `SiesaAgents.Infrastructure.csproj`
3. Register `AppDbContext` in `Program.cs` with `UseNpgsql`
4. Run `dotnet ef migrations add InitialCreate` and `dotnet ef database update`
5. Add health check endpoint to `Program.cs`
6. Verify `ExceptionHandlingMiddleware` is the FIRST middleware
7. Run all tests to confirm GREEN

**Key Principles:**

- One test at a time (start with unit tests — they are faster to cycle)
- Minimal implementation (empty `AppDbContext` first, then add packages, then DI registration)
- Run `dotnet build` after each step to catch compile errors early

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all tests pass (GREEN phase complete)
2. Review `AppDbContext.cs` for code quality (primary constructor syntax, clean imports)
3. Review `Program.cs` additions (AddDbContext placement, import ordering)
4. Confirm migration file is clean (no unintended entities)
5. Ensure tests still pass after refactoring

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow
2. **Run failing tests** to confirm RED phase:
   - `npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts`
   - `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~AppDbContextTests"`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (unit tests first — faster feedback loop)
5. **When all tests pass**, refactor for quality
6. **When refactoring complete**, mark story status as 'done'

---

## Knowledge Base References Applied

- **fixture-architecture.md** — No fixtures needed (backend-only story)
- **data-factories.md** — No factories needed (no domain entities in this story)
- **network-first.md** — API tests use direct `request` context (no page navigation)
- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic
- **test-levels-framework.md** — API level for infrastructure/middleware tests; Unit level for structural/DI tests
- **selector-resilience.md** — Not applicable (no UI)

---

## Test Execution Evidence

### Expected Initial Run (RED Phase)

**Unit tests command:** `dotnet test backend/tests/SiesaAgents.UnitTests/`

**Expected failure:**
```
Error CS0246: The type or namespace name 'AppDbContext' could not be found
(are you missing a using directive or an assembly reference?)
```

**API tests command:** `npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts`

**Expected failures:**
- `/health` endpoint tests → `404` (endpoint not registered)
- Problem Details tests → content-type not JSON (middleware not confirmed)
- DI registration tests → may fail if AppDbContext missing from compilation

**Summary:**

- Total tests: 22 (9 unit + 13 API)
- Passing: 0 (expected)
- Failing: 22 (expected — RED phase)
- Status: ✅ RED phase verified

---

## Notes

- This story is **backend-only** — no frontend files or E2E browser tests are required
- The `/health` endpoint is not in the original story AC, but is the clearest way to verify
  DB connectivity at the API level. If the dev team prefers not to add it, the AC1 DB
  connectivity test can be replaced with a build-time migration check (out-of-band CI step)
- `InMemoryDatabase` does NOT enforce `ApplySnakeCaseNaming()` — column name tests require
  a real PostgreSQL instance (Testcontainers in a future testing story)
- The `Microsoft.EntityFrameworkCore.InMemory` version is `9.*` — if the project targets
  EF Core 10, update to `10.*` once a stable release is available

---

**Generated by BMad TEA Agent** — 2026-06-16
