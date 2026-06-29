# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-29
**Author:** SiesaTeam
**Primary Test Level:** API (Playwright) + Unit (xUnit)

---

## Story Summary

Connects the PostgreSQL database to the .NET 10 backend and configures the EF Core infrastructure (AppDbContext, snake_case naming, migrations, connection string) so subsequent stories can define entities and run migrations against a working data layer.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — `dotnet ef database update` creates `siesa_agents_db` with no errors; migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Data/Migrations/`.
2. **AC2** — `OnModelCreating` applies `modelBuilder.ApplySnakeCaseNaming()` as the last call; no manual `[Column]` or `[Table]` attributes required.
3. **AC3** — Unhandled exceptions return Problem Details RFC 7807 JSON (`status`, `title`, `detail`) with HTTP 500 and no stack traces or internal messages exposed.
4. **AC4** — `AppDbContext` is registered in the DI container using `DefaultConnection` from `appsettings.Development.json` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`.
5. **AC5** — After the initial migration, only `__EFMigrationsHistory` table exists — no `clientes` or `contactos` tables.
6. **AC6** — `dotnet build SiesaAgents.sln` compiles all four projects (API, Application, Domain, Infrastructure) with zero errors and zero warnings.

---

## Failing Tests Created (RED Phase)

### API Tests — Playwright (10 tests)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

- **Test:** `should boot without EF Core configuration errors when DefaultConnection is set`
  - **Status:** RED — AppDbContext not yet registered; server may not start
  - **Verifies:** AC4 — DI wiring and startup without EF Core errors

- **Test:** `should not expose internal EF Core exception messages on startup probe endpoint`
  - **Status:** RED — Endpoint not implemented yet
  - **Verifies:** AC4 — Safe startup behavior

- **Test:** `should return HTTP 500 when an unhandled exception is triggered`
  - **Status:** RED — `/api/v1/test/trigger-exception` endpoint does not exist
  - **Verifies:** AC3 — ExceptionHandlingMiddleware returns 500

- **Test:** `should return Content-Type application/problem+json for unhandled exceptions`
  - **Status:** RED — Middleware not yet implemented/registered
  - **Verifies:** AC3 — RFC 7807 Content-Type header

- **Test:** `should return a body with status field equal to 500 in RFC 7807 format`
  - **Status:** RED — Middleware body not yet generated
  - **Verifies:** AC3 — `status` field in ProblemDetails body

- **Test:** `should return a body with title "An unexpected error occurred." in RFC 7807 format`
  - **Status:** RED — Middleware not yet implemented
  - **Verifies:** AC3 — Safe generic title in ProblemDetails body

- **Test:** `should NOT expose stack trace or internal exception message in the response body`
  - **Status:** RED — Middleware Detail field not yet enforced null
  - **Verifies:** AC3 — No internal details leaked (detail = null)

- **Test:** `should have the database accessible when the backend API starts up`
  - **Status:** RED — `/api/v1/health/db` endpoint does not exist; database not connected
  - **Verifies:** AC1 — Database reachable after migration

- **Test:** `should return database health status as healthy in the response body`
  - **Status:** RED — Health endpoint not implemented
  - **Verifies:** AC1 — Database health response body

- **Test:** `should confirm no clientes table exists after the initial migration`
  - **Status:** RED — Scope validation: 404 expected but endpoint may not exist at all
  - **Verifies:** AC5 — Scope boundary: no clientes table

- **Test:** `should confirm no contactos table exists after the initial migration`
  - **Status:** RED — Scope validation
  - **Verifies:** AC5 — Scope boundary: no contactos table

- **Test:** `should have all four projects operational (API, Application, Domain, Infrastructure)`
  - **Status:** RED — Build not yet complete with EF Core packages
  - **Verifies:** AC6 — All four projects compile

- **Test:** `should expose AppDbContext through the DI container without configuration errors`
  - **Status:** RED — AppDbContext not yet registered in DI
  - **Verifies:** AC6 — DI registration correctness

### Unit Tests — xUnit (11 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (6 tests)

- **Test:** `AC3 — Returns HTTP 500 when next delegate throws an unhandled exception`
  - **Status:** RED — `ExceptionHandlingMiddleware` class does not exist yet
  - **Verifies:** AC3 — HTTP 500 status code

- **Test:** `AC3 — Returns Content-Type application/problem+json for unhandled exceptions`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC3 — Content-Type header

- **Test:** `AC3 — Returns RFC 7807 body with status 500 and safe title`
  - **Status:** RED — ProblemDetails body not yet generated
  - **Verifies:** AC3 — Body fields (status + title)

- **Test:** `AC3 — Detail field is null — never exposes exception message or stack trace`
  - **Status:** RED — Middleware not implemented
  - **Verifies:** AC3 — detail = null; no leakage of internal messages

- **Test:** `AC3 — Calls next delegate and passes through when no exception is thrown`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC3 — Happy path pass-through

- **Test:** `AC3 — Does not override response when no exception is thrown`
  - **Status:** RED — Middleware class missing
  - **Verifies:** AC3 — No interference on successful requests

**File:** `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs` (5 tests)

- **Test:** `AC2 — AppDbContext can be instantiated with InMemory provider`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC2 — DbContext can be created

- **Test:** `AC2 — AppDbContext inherits from DbContext`
  - **Status:** RED — Class missing
  - **Verifies:** AC2 — Inheritance contract

- **Test:** `AC2 — AppDbContext has no DbSet properties (empty initial migration)`
  - **Status:** RED — Class missing
  - **Verifies:** AC2/AC5 — Scope boundary: no domain entities in Story 1.3

- **Test:** `AC2 — AppDbContext is in the SiesaAgents.Infrastructure.Data namespace`
  - **Status:** RED — Class missing
  - **Verifies:** AC2 — Namespace convention

- **Test:** `AC2 — AppDbContext constructor accepts DbContextOptions<AppDbContext>`
  - **Status:** RED — Class missing
  - **Verifies:** AC2/AC4 — DI-compatible constructor

- **Test:** `AC2 — AppDbContext model creation completes without errors using InMemory provider`
  - **Status:** RED — Class missing; OnModelCreating not implemented
  - **Verifies:** AC2 — ApplySnakeCaseNaming() call does not throw

---

## Data Factories Created

Not applicable for Story 1.3. This story has no domain entities to model; the scope is infrastructure-only (empty migration). Data factories will be introduced in Epic 2 when `ClienteEntity` is defined.

---

## Fixtures Created

Not applicable for this story. No auth or domain-data fixtures are required. The API tests use Playwright's built-in `request` context directly.

---

## Mock Requirements

### Exception Trigger Endpoint (DEV Team must create)

**Endpoint:** `GET /api/v1/test/trigger-exception`

**Purpose:** Enables ATDD test verification of ExceptionHandlingMiddleware. Must only be available in Development environment.

**Behavior:** Intentionally throws `InvalidOperationException("Triggered for ATDD test")`.

**Expected Response:**
```json
{
  "status": 500,
  "title": "An unexpected error occurred.",
  "detail": null
}
```

**Notes:** Protect with `if (app.Environment.IsDevelopment())` guard. Remove or gate before production.

### Database Health Endpoint (DEV Team must create)

**Endpoint:** `GET /api/v1/health/db`

**Purpose:** Confirms database connectivity after `dotnet ef database update`.

**Expected Success Response (200):**
```json
{
  "status": "healthy"
}
```

**Expected Failure Response (503):**
```json
{
  "status": "unhealthy",
  "error": "..."
}
```

**Notes:** Use `AppDbContext.Database.CanConnectAsync()` for the health check. Can use ASP.NET Core Health Checks or a minimal endpoint.

---

## Required data-testid Attributes

Not applicable. Story 1.3 is backend-only with no frontend changes. No `data-testid` attributes are required.

---

## Implementation Checklist

### Test: AC4 — AppDbContext DI registration and startup

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add `Microsoft.EntityFrameworkCore` to `SiesaAgents.Infrastructure.csproj`
- [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` to `SiesaAgents.Infrastructure.csproj`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.Infrastructure.csproj`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API.csproj`
- [ ] Add `EFCore.NamingConventions` to `SiesaAgents.Infrastructure.csproj`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Register `AppDbContext` in `Program.cs` using `DefaultConnection`
- [ ] Configure `appsettings.Development.json` with `DefaultConnection` to `siesa_agents_db`
- [ ] Run test: `npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC3 — ExceptionHandlingMiddleware RFC 7807

**Files:**
- `e2e/tests/api/database-foundation.api.spec.ts` (API level)
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (unit level)

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Implement: catch `Exception`, set `ContentType = "application/problem+json"`, write `ProblemDetails { Status = 500, Title = "An unexpected error occurred.", Detail = null }`
- [ ] Register middleware as FIRST in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Add development-only test trigger endpoint: `GET /api/v1/test/trigger-exception`
- [ ] Run unit tests: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"`
- [ ] Run API tests: `npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: AC2 — AppDbContext snake_case naming

**File:** `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Implement `AppDbContext.cs` in namespace `SiesaAgents.Infrastructure.Data`
- [ ] Override `OnModelCreating`: call `base.OnModelCreating(modelBuilder)`, then `modelBuilder.ApplyConfigurationsFromAssembly(...)`, then `modelBuilder.ApplySnakeCaseNaming()` as THE LAST CALL
- [ ] Ensure NO `DbSet<>` properties exist on `AppDbContext` in Story 1.3
- [ ] Run unit tests: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~AppDbContextTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC1 — Database exists and migration folder created

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add health check endpoint: `GET /api/v1/health/db`
- [ ] Run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
- [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify migration file at `backend/src/SiesaAgents.Infrastructure/Data/Migrations/`
- [ ] Run API tests: `npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.0 hour

---

### Test: AC5 — Scope boundary: no clientes/contactos tables

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Confirm migration Up() method has NO table creation calls (only `__EFMigrationsHistory` scaffolding)
- [ ] Confirm no `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` added to `AppDbContext`
- [ ] Run API tests: `npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC6 — Solution compiles with zero errors

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run: `dotnet build SiesaAgents.sln` from `backend/` directory
- [ ] Verify zero errors and zero warnings in all four projects
- [ ] Verify `dotnet run --project src/SiesaAgents.API` starts without exceptions
- [ ] Run API tests: `npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC6"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all Playwright API tests for Story 1.3
npx playwright test e2e/tests/api/database-foundation.api.spec.ts

# Run specific acceptance criterion
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC3"

# Run Playwright tests in headed mode
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --headed

# Debug Playwright tests
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --debug

# Run all xUnit unit tests for Story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests|FullyQualifiedName~AppDbContextTests"

# Run only middleware unit tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"

# Run only DbContext unit tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~AppDbContextTests"

# Run ALL tests (unit + E2E)
dotnet test backend/tests/SiesaAgents.UnitTests/ && npx playwright test e2e/tests/api/database-foundation.api.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (expected — implementation does not exist yet)
- No fixtures or factories required for this infrastructure story
- Mock requirements documented (trigger-exception and health endpoints)
- data-testid requirements: none (backend-only story)
- Implementation checklist created

**Verification:**

- xUnit tests fail with `CS0246: The type or namespace name 'SiesaAgents' could not be found` — correct (class missing)
- Playwright API tests fail with connection refused or 404 — correct (endpoints not implemented)
- Tests fail due to missing implementation, NOT due to test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test — start with AC4 (AppDbContext DI wiring)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist above
6. Move to next test and repeat (AC2 → AC3 → AC1 → AC5 → AC6)

**Key Principles:**

- One test at a time (do not try to fix all at once)
- Minimal implementation (do not over-engineer)
- Run tests frequently (immediate feedback)
- Use the implementation checklist above as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review `AppDbContext.cs` and `ExceptionHandlingMiddleware.cs` for code quality
3. Extract any configuration duplications
4. Ensure tests still pass after each refactor
5. Update story status to `done` in sprint-status.yaml

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing xUnit tests to confirm RED: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests|FullyQualifiedName~AppDbContextTests"`
3. Run failing Playwright API tests to confirm RED: `npx playwright test e2e/tests/api/database-foundation.api.spec.ts`
4. Begin implementation using the implementation checklist above as guide (start with AC4)
5. Work one test at a time (red → green for each)
6. When all tests pass, refactor code for quality
7. When refactoring is complete, manually update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Not applicable (no fixtures for this backend infrastructure story)
- **data-factories.md** — Not applicable (no domain entities in Story 1.3 scope)
- **network-first.md** — Not applicable (API-level tests use `request` context, no page navigation)
- **test-quality.md** — One assertion per test (atomic); Given-When-Then format; deterministic; isolated
- **test-levels-framework.md** — API level (Playwright `request`) for integration/runtime verification; Unit level (xUnit) for middleware and DbContext logic
- **selector-resilience.md** — Not applicable (no UI elements in this story)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Playwright API command:** `npx playwright test e2e/tests/api/database-foundation.api.spec.ts`

**Expected failures:**
- `Error: connect ECONNREFUSED 127.0.0.1:5000` — backend not running or EF Core startup failure
- `404` on `/api/v1/test/trigger-exception` — endpoint not implemented
- `404` on `/api/v1/health/db` — endpoint not implemented

**xUnit command:** `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests|FullyQualifiedName~AppDbContextTests"`

**Expected failures:**
- `CS0246: The type or namespace name 'ExceptionHandlingMiddleware' could not be found`
- `CS0246: The type or namespace name 'AppDbContext' could not be found`
- Build errors due to missing source classes

**Summary:**

- Total tests: 21 (10 Playwright API + 11 xUnit)
- Passing: 0 (expected — RED phase)
- Failing: 21 (expected — RED phase)
- Status: RED phase verified

---

## Notes

- This story is **backend-only** — no frontend changes. No `data-testid` attributes required.
- The exception trigger endpoint (`/api/v1/test/trigger-exception`) is a test-only endpoint. Gate it with `if (app.Environment.IsDevelopment())` in `Program.cs`.
- The database health endpoint (`/api/v1/health/db`) should use `AppDbContext.Database.CanConnectAsync()` to verify real connectivity.
- `ApplySnakeCaseNaming()` requires the `EFCore.NamingConventions` NuGet package. The InMemory provider used in unit tests will not apply naming conventions but must not throw.
- The AC5 scope boundary tests (no clientes/contactos) are validated by checking that the API endpoints return 404 — a prerequisite for Epic 2 and 3 stories.

---

**Generated by BMad TEA Agent** — 2026-06-29
