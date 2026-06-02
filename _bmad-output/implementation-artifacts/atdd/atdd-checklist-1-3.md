# ATDD Checklist — Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-05-20
**Author:** SiesaTeam
**Primary Test Level:** API / Integration (Playwright APIRequestContext + xUnit)

---

## Story Summary

Story 1.3 establishes the PostgreSQL data layer for the Siesa Agents CRM backend. It configures AppDbContext with EF Core (Npgsql provider), creates an initial empty migration (no entities), applies snake_case naming convention via `ApplySnakeCaseNaming()`, and implements an `ExceptionHandlingMiddleware` that returns RFC 7807 Problem Details without exposing stack traces or internal exception details.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update`, Then `siesa_agents_db` is created with no errors And the Migrations folder (`backend/src/SiesaAgents.Infrastructure/Data/Migrations/`) exists and contains one initial empty migration.

2. **AC2** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format with `status`, `title`, and `detail` fields And no `stackTrace` or exception type is exposed in the response body (NFR6).

3. **AC3** — Given any future entity is registered in `AppDbContext`, When EF Core generates or applies migrations, Then all table and column names follow snake_case convention because `ApplySnakeCaseNaming()` is called last in `OnModelCreating`.

4. **AC4** — Given the backend is running locally, When `AppDbContext.Database.CanConnectAsync()` is called from an integration test, Then it returns `true` against `siesa_agents_db`.

---

## Failing Tests Created (RED Phase)

### API Tests — Playwright APIRequestContext (4 tests)

**File:** `e2e/tests/database/database-foundation.spec.ts` (134 lines)

- **Test: API-F-03** — Error de backend devuelve Problem Details RFC 7807 sin stackTrace
  - **Status:** RED — Backend not running or `ExceptionHandlingMiddleware` not implemented; hitting a non-existent route does not return `application/problem+json` Content-Type
  - **Verifies:** AC2 / NFR6 — RFC 7807 fields present (status, title, detail); no stackTrace, exception, inner, or " at " in body

- **Test: DB-F-01** — Problem Details: campo status coincide con HTTP status y title no es un tipo de excepción
  - **Status:** RED — `ExceptionHandlingMiddleware` not implemented; title field would contain exception class name if middleware is absent
  - **Verifies:** AC2 — `body.status` is a number matching HTTP status code; `title` does not contain "Exception", "System.", or "Microsoft."

- **Test: DB-F-02** — Health check confirma que siesa_agents_db está accesible
  - **Status:** RED — `/health` endpoint does not exist yet; backend not running or DB not connected
  - **Verifies:** AC4 — `/health` returns 200, 204, or 503; if JSON body has `status`, it is not "Unhealthy"

- **Test: DB-F-03** — Content-Type de errores es application/problem+json (no plain JSON)
  - **Status:** RED — `ExceptionHandlingMiddleware` not implemented; error responses use default Content-Type (text/html or application/json)
  - **Verifies:** AC2 — Content-Type header contains `problem+json`; is not `application/json` or `application/json; charset=utf-8`

### Unit Tests — xUnit (4 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (195 lines)

- **Test: UNIT-F-04** — `InvokeAsync_UnhandledException_ReturnsProblemDetailsWithRequiredFields`
  - **Status:** RED — `SiesaAgents.API.Middleware.ExceptionHandlingMiddleware` class does not exist; compilation fails
  - **Verifies:** AC2 — HTTP 500 status; JSON body has `status` (number), `title` (non-empty string), `detail` (string)

- **Test: UNIT-F-05** — `InvokeAsync_UnhandledException_DoesNotExposeStackTraceOrExceptionType`
  - **Status:** RED — `ExceptionHandlingMiddleware` class does not exist; compilation fails
  - **Verifies:** AC2 / NFR6 — Body does not contain: stackTrace, stack_trace, StackTrace, InvalidOperationException, System., Exception, sensitive exception message, " at "

- **Test: UNIT-F-04b** — `InvokeAsync_ArgumentException_Returns400BadRequest`
  - **Status:** RED — `ExceptionHandlingMiddleware` class does not exist; compilation fails
  - **Verifies:** AC2 — `ArgumentException` maps to HTTP 400 with Problem Details body

- **Test: UNIT-F-04d** — `InvokeAsync_UnhandledException_SetsContentTypeToProblemJson`
  - **Status:** RED — `ExceptionHandlingMiddleware` class does not exist; compilation fails
  - **Verifies:** AC2 — Response `Content-Type` contains `problem+json`

### Unit Tests — xUnit (4 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` (87 lines)

- **Test: UNIT-F-06** — `AppDbContext_OnModelCreating_DoesNotThrow`
  - **Status:** RED — `SiesaAgents.Infrastructure.Data.AppDbContext` class does not exist; compilation fails
  - **Verifies:** AC3 — `AppDbContext` can be instantiated with in-memory provider; `ApplySnakeCaseNaming()` does not throw during model building

- **Test: UNIT-F-06b** — `AppDbContext_InheritsFromDbContext`
  - **Status:** RED — `AppDbContext` class does not exist; compilation fails
  - **Verifies:** AC3 (structural) — `AppDbContext` inherits from `Microsoft.EntityFrameworkCore.DbContext`

- **Test: UNIT-F-06c** — `AppDbContext_Constructor_AcceptsTypedDbContextOptions`
  - **Status:** RED — `AppDbContext` class does not exist; compilation fails
  - **Verifies:** AC3 — Constructor signature accepts `DbContextOptions<AppDbContext>` (required for DI registration)

- **Test: UNIT-F-06d** — `AppDbContext_HasNoDbSetProperties_EmptyMigrationScope`
  - **Status:** RED — `AppDbContext` class does not exist; compilation fails
  - **Verifies:** Scope guard — No `DbSet<>` properties exist (ClienteEntity and ContactoEntity must NOT appear in this story)

### Integration Tests — xUnit (4 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/DatabaseFoundationTests.cs` (100 lines)

**Prerequisites:** Running PostgreSQL instance at `localhost:5432` with database `siesa_agents_db` (created by `dotnet ef database update`)

- **Test: INT-F-01** — `CanConnectAsync_ReturnsTrueForSiesaAgentsDb`
  - **Status:** RED — `AppDbContext` class does not exist OR `siesa_agents_db` database not yet created
  - **Verifies:** AC4 — `AppDbContext.Database.CanConnectAsync()` returns true

- **Test: INT-F-02** — `MigrationsHistory_ContainsExactlyOneEntry_AfterInitialMigration`
  - **Status:** RED — `__EFMigrationsHistory` table does not exist until `dotnet ef database update` is run
  - **Verifies:** AC1 — `__EFMigrationsHistory` has exactly 1 row after initial migration is applied

- **Test: INT-F-02b** — `MigrationsHistory_ContainsMigrationNamedInitialCreate`
  - **Status:** RED — `__EFMigrationsHistory` table does not exist; migration name must include "InitialCreate"
  - **Verifies:** AC1 — Migration ID contains "InitialCreate" (correct migration was applied)

- **Test: INT-F-01b** — `GetPendingMigrationsAsync_ReturnsEmpty_AfterDotnetEfDatabaseUpdate`
  - **Status:** RED — `AppDbContext` class does not exist OR pending migrations remain after failed database update
  - **Verifies:** AC1 — No pending migrations after `dotnet ef database update` completes

---

## Data Factories Created

No data factories required for this story. The database foundation story creates infrastructure only — no entity CRUD operations exist yet.

---

## Fixtures Created

No new Playwright fixtures required. The API tests in `database-foundation.spec.ts` use `{ request }` directly (Playwright APIRequestContext) with no UI navigation.

The xUnit integration tests construct `AppDbContext` directly from the connection string resolved via `IConfiguration` (environment variable `ConnectionStrings__DefaultConnection` or `appsettings.Test.json`).

---

## Mock Requirements

No mocks required. This story tests real backend infrastructure:

- API tests hit the actual running backend at `http://localhost:5000`
- Integration tests connect to the actual PostgreSQL instance at `localhost:5432`
- Unit tests use `DefaultHttpContext` with in-memory stream (no mocking framework needed)
- `AppDbContextTests` use `UseInMemoryDatabase` for model-building verification only

---

## Required data-testid Attributes

No frontend `data-testid` attributes required. Story 1.3 is backend-only (no UI changes).

---

## Implementation Checklist

### Test Group: UNIT-F-04, UNIT-F-05 — ExceptionHandlingMiddlewareTests

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Implement constructor accepting `RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger`
- [ ] Implement `InvokeAsync(HttpContext context)` with try/catch wrapping `await _next(context)`
- [ ] On exception: set `context.Response.StatusCode` using exception-type switch (ArgumentException → 400, KeyNotFoundException → 404, InvalidOperationException → 409, default → 500)
- [ ] On exception: set `context.Response.ContentType = "application/problem+json"`
- [ ] On exception: serialize `ProblemDetails` with `status`, `title`, `detail` fields ONLY (never include ex.StackTrace, ex.GetType().Name, or ex.Message)
- [ ] Register in `Program.cs` before `app.UseCors()`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Add `Microsoft.AspNetCore.Http` and `Microsoft.Extensions.Logging.Abstractions` to UnitTests .csproj (already done)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"`
- [ ] All 4 middleware tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: UNIT-F-06 — AppDbContextTests

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Inherit from `DbContext`; inject `DbContextOptions<AppDbContext>` via constructor
- [ ] Override `OnModelCreating`: call `base.OnModelCreating(modelBuilder)` first
- [ ] Call `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)` in OnModelCreating
- [ ] Call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement in `OnModelCreating`
- [ ] Do NOT add any `DbSet<>` properties (no entities in this story)
- [ ] Add `Microsoft.EntityFrameworkCore.InMemory` package to `SiesaAgents.UnitTests.csproj` (already done)
- [ ] Add `ProjectReference` to `SiesaAgents.Infrastructure` from `SiesaAgents.UnitTests.csproj` (already done)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~AppDbContextTests"`
- [ ] All 4 AppDbContext tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: INT-F-01, INT-F-02 — DatabaseFoundationTests

**File:** `backend/tests/SiesaAgents.IntegrationTests/DatabaseFoundationTests.cs`

**Tasks to make these tests pass:**

- [ ] Complete Task 1 and Task 2 above (AppDbContext + connection string + DI registration)
- [ ] Add `"DefaultConnection"` to `backend/src/SiesaAgents.API/appsettings.Development.json`: `Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres`
- [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API -o Data/Migrations` from `backend/`
- [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created with `*_InitialCreate.cs` and `AppDbContextModelSnapshot.cs`
- [ ] Add `SiesaAgents.IntegrationTests` project to solution: already done in `SiesaAgents.slnx`
- [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/` — exit code must be 0
- [ ] Ensure PostgreSQL is running locally and `siesa_agents_db` database is accessible
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests/`
- [ ] All 4 database integration tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: API-F-03, DB-F-01, DB-F-02, DB-F-03 — Playwright API Tests

**File:** `e2e/tests/database/database-foundation.spec.ts`

**Tasks to make these tests pass:**

- [ ] Complete all implementation tasks above (AppDbContext + ExceptionHandlingMiddleware)
- [ ] Register `ExceptionHandlingMiddleware` in `Program.cs` before `app.UseCors()`
- [ ] Register `app.MapHealthChecks("/health")` (or equivalent) so DB-F-02 can hit `/health` — or confirm backend starts successfully with DB connection (a 200 response from any valid endpoint is sufficient for DB-F-02 implicit check)
- [ ] Start the backend: `cd backend && dotnet run --project src/SiesaAgents.API`
- [ ] Confirm backend responds on `http://localhost:5000`
- [ ] Run test: `npx playwright test e2e/tests/database/database-foundation.spec.ts`
- [ ] All 4 Playwright API tests pass (green phase)

**Estimated Effort:** 0.5 hours (assuming backend implementation is complete)

---

## Running Tests

```bash
# Run all Story 1.3 failing tests — Playwright API tests
npx playwright test e2e/tests/database/database-foundation.spec.ts

# Run unit tests for ExceptionHandlingMiddleware
dotnet test backend/tests/SiesaAgents.UnitTests/ \
  --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"

# Run unit tests for AppDbContext
dotnet test backend/tests/SiesaAgents.UnitTests/ \
  --filter "FullyQualifiedName~AppDbContextTests"

# Run all unit tests for Story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests/ \
  --filter "FullyQualifiedName~Middleware|FullyQualifiedName~Infrastructure"

# Run integration tests (requires PostgreSQL running + dotnet ef database update applied)
dotnet test backend/tests/SiesaAgents.IntegrationTests/

# Run Playwright API tests in headed mode
npx playwright test e2e/tests/database/database-foundation.spec.ts --headed

# Debug a specific Playwright test
npx playwright test e2e/tests/database/database-foundation.spec.ts --debug

# Run all backend tests
dotnet test backend/

# Run all Story 1.3 tests (backend + E2E combined)
dotnet test backend/ && npx playwright test e2e/tests/database/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (compilation errors expected until implementation exists)
- No external mock services required
- `appsettings.Test.json` provided for integration tests
- `SiesaAgents.IntegrationTests.csproj` created and added to `SiesaAgents.slnx`
- `SiesaAgents.UnitTests.csproj` updated with required package and project references
- Implementation checklist created

**Verification of RED Phase:**

Expected failures before implementation:
- `AppDbContextTests.cs` — compilation error: `The type or namespace name 'Data' does not exist in the namespace 'SiesaAgents.Infrastructure'`
- `ExceptionHandlingMiddlewareTests.cs` — compilation error: `The type or namespace name 'Middleware' does not exist in the namespace 'SiesaAgents.API'`
- `DatabaseFoundationTests.cs` — compilation error: `The type or namespace name 'Data' does not exist in the namespace 'SiesaAgents.Infrastructure'`
- `database-foundation.spec.ts` API-F-03 — `Error: connect ECONNREFUSED 127.0.0.1:5000` or HTTP 200 JSON (not problem+json)

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Create `AppDbContext.cs` in `SiesaAgents.Infrastructure/Data/` (unblocks UNIT-F-06 and INT tests)
2. Create `ExceptionHandlingMiddleware.cs` in `SiesaAgents.API/Middleware/` (unblocks UNIT-F-04/05)
3. Add connection string to `appsettings.Development.json` and register DbContext in `Program.cs`
4. Run `dotnet ef migrations add InitialCreate` and `dotnet ef database update`
5. Register `ExceptionHandlingMiddleware` in `Program.cs`
6. Run all tests — verify GREEN

**Key Principles:**

- One test at a time (start with unit tests — they compile-check first)
- Minimal implementation (don't add entities or complex logic)
- `ApplySnakeCaseNaming()` MUST be the last call in `OnModelCreating`
- Never serialize `ex.StackTrace` or `ex.GetType().Name` in middleware

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (compilation success + all assertions green)
2. Review `ExceptionHandlingMiddleware` for null safety and async correctness
3. Ensure `AppDbContext` follows Clean Architecture layering rules
4. Confirm `dotnet build SiesaAgents.slnx` exits with code 0 (BUILD-F-02 check)
5. Code review against `company-standards.md` backend critical rules

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `dotnet build backend/ 2>&1 | grep -c "error CS"`
3. Begin implementation starting with `AppDbContext.cs` (highest unblocking value)
4. Work one test group at a time: UNIT-F-06 → UNIT-F-04/05 → INT-F-01/02 → API-F-03
5. After all unit tests pass, run integration tests (requires PostgreSQL)
6. After all tests pass, run Playwright API tests (requires backend running)
7. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic test design
- **fixture-architecture.md** — Direct `AppDbContext` construction in integration tests (no Playwright fixture needed for xUnit)
- **network-first.md** — API tests use `request.get()` directly (no page navigation, no interception needed)
- **test-levels-framework.md** — Unit tests for middleware/DbContext logic; integration tests for real DB connection; API tests for end-to-end Problem Details contract

---

## Notes

- **Scope guard:** `UNIT-F-06d` (`AppDbContext_HasNoDbSetProperties_EmptyMigrationScope`) will fail if `ClienteEntity` or `ContactoEntity` are added to `AppDbContext` in this story. This is intentional — it enforces the scope note in the story.
- **Integration test isolation:** `DatabaseFoundationTests` requires a real PostgreSQL instance. These tests are excluded from fast-feedback unit test runs. Use `--filter "FullyQualifiedName~AppDbContextTests"` for in-memory tests only.
- **Health endpoint:** `DB-F-02` checks `/health`. If the health endpoint is not registered in `Program.cs`, this test will fail with connection refused or 404. Registering `app.MapHealthChecks("/health")` with `services.AddHealthChecks().AddDbContextCheck<AppDbContext>()` is the recommended approach.
- **EF Core Npgsql:** `ApplySnakeCaseNaming()` is provided by the `Npgsql.EntityFrameworkCore.PostgreSQL` package already referenced in `SiesaAgents.Infrastructure.csproj`. No additional packages are needed for this convention.
- **UnitTests.csproj update:** The file has been updated to add references to `SiesaAgents.API`, `SiesaAgents.Infrastructure`, `Microsoft.EntityFrameworkCore.InMemory`, and `Microsoft.Extensions.Logging.Abstractions`. The `SiesaAgents.API` reference is needed for `ExceptionHandlingMiddleware` and `DefaultHttpContext` usage.

---

**Generated by BMad TEA Agent** — 2026-05-20
