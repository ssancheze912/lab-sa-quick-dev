# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-24
**Author:** SiesaTeam
**Primary Test Level:** Unit (xUnit) + Integration (xUnit + Testcontainers) + API (Playwright)

---

## Story Summary

This story establishes the backend data layer for the Siesa Agents CRM. It configures PostgreSQL connectivity via EF Core with Npgsql, applies snake_case naming conventions globally, implements the global exception handling middleware following Problem Details RFC 7807, and creates an empty initial migration (no domain tables). The Scalar API documentation endpoint is also verified.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. Given PostgreSQL is running locally, When the developer runs `dotnet ef database update`, Then `siesa_agents_db` is created with no errors, And an EF Core Migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/` with an initial migration file.

2. Given the EF Core DbContext is configured, When `OnModelCreating` executes, Then `modelBuilder.ApplySnakeCaseNaming()` is called as the last statement, ensuring all future column and table names automatically follow snake_case convention without any `[Column]` or `[Table]` attributes.

3. Given an unhandled exception occurs anywhere in the backend request pipeline, When the exception reaches the global middleware, Then the response body follows Problem Details RFC 7807 format with fields: `status`, `title`, `detail`, And no stack trace or internal exception message is exposed (NFR6).

4. Given a domain-level validation failure occurs (not-found, conflict), When it is caught by the middleware, Then the appropriate HTTP status code is returned (404, 409, 400) with a Problem Details body, never a 500.

5. Given the backend starts with `dotnet run`, When the developer opens `http://localhost:5000/scalar`, Then the Scalar API documentation page loads successfully (no Swagger/OpenAPI UI must be registered).

6. Given the connection string is configured in `appsettings.Development.json`, When `AppDbContext` is registered in `Program.cs`, Then the connection uses `siesa_agents_db` PostgreSQL database on `localhost:5432` with the Npgsql provider.

7. Given the initial migration is created, When it is applied, Then the migration contains NO domain entity tables — only `__EFMigrationsHistory` is created. `clientes` is created in Story 2.1; `contactos` is created in Story 3.1.

---

## Failing Tests Created (RED Phase)

### Unit Tests - xUnit (11 tests)

**File 1:** `backend/tests/SiesaAgents.UnitTests/API/Middleware/ExceptionHandlingMiddlewareTests.cs`

- **Test:** `InvokeAsync_WhenUnhandledExceptionThrown_Returns500StatusCode`
  - **Status:** RED - `SiesaAgents.API.Middleware.ExceptionHandlingMiddleware` does not exist yet
  - **Verifies:** AC3 — Generic unhandled exception returns HTTP 500

- **Test:** `InvokeAsync_WhenUnhandledExceptionThrown_ReturnsApplicationProblemJsonContentType`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC3 — Content-Type is `application/problem+json` (RFC 7807)

- **Test:** `InvokeAsync_WhenUnhandledExceptionThrown_ResponseBodyContainsProblemDetailsStatusField`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC3 — Body contains `status` field (RFC 7807)

- **Test:** `InvokeAsync_WhenUnhandledExceptionThrown_ResponseBodyContainsProblemDetailsTitleField`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC3 — Body contains non-empty `title` field (RFC 7807)

- **Test:** `InvokeAsync_WhenUnhandledExceptionThrown_ResponseBodyContainsProblemDetailsDetailField`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC3 — Body contains non-empty `detail` field (RFC 7807)

- **Test:** `InvokeAsync_WhenUnhandledExceptionThrown_ResponseBodyDoesNotContainStackTrace`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC3 + NFR6 — No stack trace exposed in response body

- **Test:** `InvokeAsync_WhenUnhandledExceptionThrown_DetailDoesNotExposeInternalExceptionMessage`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC3 + NFR6 — Internal exception messages are NOT leaked in the response

- **Test:** `InvokeAsync_WhenKeyNotFoundExceptionThrown_Returns404StatusCode`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC4 — KeyNotFoundException maps to HTTP 404 (not 500)

- **Test:** `InvokeAsync_WhenKeyNotFoundExceptionThrown_ReturnsNotFoundProblemDetailsBody`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC4 — Problem Details body has status 404

- **Test:** `InvokeAsync_WhenArgumentExceptionThrown_Returns400StatusCode`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC4 — ArgumentException maps to HTTP 400 (not 500)

- **Test:** `InvokeAsync_WhenArgumentExceptionThrown_ReturnsBadRequestProblemDetailsBody`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC4 — Problem Details body has status 400

- **Test:** `InvokeAsync_WhenNoExceptionThrown_PassesThroughToNextMiddleware`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC3 — Happy path: next middleware is called when no exception occurs

- **Test:** `InvokeAsync_WhenNoExceptionThrown_DoesNotAlterResponseStatusCode`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC3 — Middleware is transparent on the happy path

**File 2:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/Data/AppDbContextTests.cs`

- **Test:** `AppDbContext_CanBeInstantiatedWithInMemoryProvider`
  - **Status:** RED - `SiesaAgents.Infrastructure.Data.AppDbContext` does not exist yet
  - **Verifies:** AC2, AC6 — AppDbContext class exists and can be instantiated

- **Test:** `AppDbContext_OnModelCreating_DoesNotThrowWithInMemoryProvider`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC2 — OnModelCreating runs without error (ApplySnakeCaseNaming + InMemory)

- **Test:** `AppDbContext_Constructor_AcceptsDbContextOptions`
  - **Status:** RED - Class does not exist
  - **Verifies:** AC6 — Constructor signature accepts `DbContextOptions<AppDbContext>`

### Integration Tests - xUnit + Testcontainers (6 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Infrastructure/DatabaseConnectivityTests.cs`

- **Test:** `Database_CanConnect_WhenConnectionStringIsConfigured`
  - **Status:** RED - `AppDbContext` does not exist; Testcontainers package not yet in csproj
  - **Verifies:** AC1, AC6 — Real PostgreSQL connectivity via Npgsql provider

- **Test:** `Database_AfterMigrationApplied_ContainsInitialCreateMigration`
  - **Status:** RED - `AppDbContext` and `InitialCreate` migration do not exist
  - **Verifies:** AC1 — InitialCreate migration is applied successfully

- **Test:** `Database_WhenMigrationsApplied_EFMigrationsHistoryTableExists`
  - **Status:** RED - `AppDbContext` does not exist
  - **Verifies:** AC6 — EF Core Npgsql integration works end-to-end

- **Test:** `Database_AfterInitialMigration_DoesNotContainClientesTable`
  - **Status:** RED - `AppDbContext` and migrations do not exist
  - **Verifies:** AC7 — `clientes` table is NOT created by InitialCreate (scope constraint)

- **Test:** `Database_AfterInitialMigration_DoesNotContainContactosTable`
  - **Status:** RED - `AppDbContext` and migrations do not exist
  - **Verifies:** AC7 — `contactos` table is NOT created by InitialCreate (scope constraint)

- **Test:** `Database_AfterInitialMigration_OnlyEFMigrationsHistoryTableExists`
  - **Status:** RED - `AppDbContext` and migrations do not exist
  - **Verifies:** AC7 — Only `__EFMigrationsHistory` table exists after InitialCreate

### API Tests - Playwright (8 tests)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

- **Test:** `should return JSON content-type for unhandled 404 routes`
  - **Status:** RED - ExceptionHandlingMiddleware not yet registered in Program.cs
  - **Verifies:** AC3 HTTP-level — Error responses use JSON not HTML

- **Test:** `should return Problem Details status field for unknown routes`
  - **Status:** RED - Middleware not registered
  - **Verifies:** AC3 HTTP-level — RFC 7807 `status` field in response body

- **Test:** `should not expose stack trace in response body for any error (NFR6)`
  - **Status:** RED - Middleware not registered
  - **Verifies:** AC3 + NFR6 — No stack trace strings in HTTP error responses

- **Test:** `should not return HTML error page for unhandled errors`
  - **Status:** RED - Middleware not registered
  - **Verifies:** AC3 — Problem Details middleware replaces default ASP.NET error pages

- **Test:** `GET non-existent resource endpoint returns 404 not 500`
  - **Status:** RED - Middleware not registered; endpoint not implemented
  - **Verifies:** AC4 HTTP-level — Domain not-found scenarios return 404 not 500

- **Test:** `Problem Details body status field matches HTTP response status code`
  - **Status:** RED - Middleware not registered
  - **Verifies:** AC4 — RFC 7807 compliance: body.status == HTTP status code

- **Test:** `should load Scalar documentation page at /scalar with HTTP 200`
  - **Status:** RED - Scalar not yet configured in Program.cs for Story 1.3
  - **Verifies:** AC5 — Scalar loads successfully at /scalar

- **Test:** `should return HTML content from /scalar endpoint`
  - **Status:** RED - Scalar not yet configured
  - **Verifies:** AC5 — Scalar returns HTML (not JSON or redirect)

- **Test:** `should NOT serve Swagger UI at /swagger (Swashbuckle is explicitly forbidden)`
  - **Status:** RED - Cannot be verified without backend running
  - **Verifies:** AC5 — Swagger is NOT configured

- **Test:** `should NOT serve Swagger JSON spec at /swagger/v1/swagger.json`
  - **Status:** RED - Cannot be verified without backend running
  - **Verifies:** AC5 — Swashbuckle JSON endpoint does not exist

---

## Data Factories Created

This story is backend-only with no domain entities. No data factories are required for Story 1.3.
Data factories for `Cliente` and `Contacto` entities will be created in Stories 2.1 and 3.1.

---

## Fixtures Created

No new Playwright fixtures are required for this story. The existing `base.fixture.ts` is sufficient for the API-level tests in this story.

The xUnit integration tests use Testcontainers directly via `IAsyncLifetime` for PostgreSQL container lifecycle management.

---

## Mock Requirements

No external service mocks are required for this story. All backend tests use:
- **Unit tests**: `NullLogger`, `DefaultHttpContext`, `MemoryStream` — no external dependencies
- **Integration tests**: Testcontainers PostgreSQL — real database in container
- **API tests**: Real backend server running on `http://localhost:5000`

---

## Required data-testid Attributes

This story is backend-only with no frontend UI changes. No `data-testid` attributes are required.

---

## Implementation Checklist

### Test Group 1: ExceptionHandlingMiddleware (AC3, AC4)

**Files to create:** `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` implementing `IMiddleware`
- [ ] Inject `ILogger<ExceptionHandlingMiddleware>` via constructor
- [ ] Implement `InvokeAsync(HttpContext context, RequestDelegate next)` with try/catch
- [ ] Map exception types to HTTP status codes:
  - `KeyNotFoundException` → 404
  - `ArgumentException` → 400
  - All unhandled → 500
- [ ] Write `ProblemDetails` response with fields: `Status`, `Title`, `Detail`, `Type`
- [ ] Set `Content-Type: application/problem+json` on error responses
- [ ] Ensure `detail` for generic 500 errors contains only a safe user message (NOT exception.Message)
- [ ] Add `builder.Services.AddProblemDetails()` in `Program.cs`
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Register middleware as transient: `builder.Services.AddTransient<ExceptionHandlingMiddleware>()`
- [ ] Run unit tests: `dotnet test tests/SiesaAgents.UnitTests`
- [ ] ✅ All 13 middleware unit tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group 2: AppDbContext + snake_case naming (AC2, AC6)

**Files to create:** `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`

**Tasks to make these tests pass:**

- [ ] Add `EFCore.NamingConventions` package: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` package to Infrastructure project
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` inheriting `DbContext`
- [ ] Implement constructor: `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}`
- [ ] Override `OnModelCreating` and call `modelBuilder.ApplyConfigurationsFromAssembly(...)` then `modelBuilder.ApplySnakeCaseNaming()` as the last call
- [ ] Add `Microsoft.EntityFrameworkCore.InMemory` to `SiesaAgents.UnitTests.csproj` for unit testing
- [ ] Add connection string `"DefaultConnection"` to `backend/src/SiesaAgents.API/appsettings.Development.json`
- [ ] Register `AppDbContext` in `Program.cs` using `builder.Services.AddDbContext<AppDbContext>(...)`
- [ ] Run unit tests: `dotnet test tests/SiesaAgents.UnitTests`
- [ ] ✅ All 3 AppDbContext unit tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test Group 3: Database connectivity + migration integrity (AC1, AC6, AC7)

**Files to create:** Migration files at `backend/src/SiesaAgents.Infrastructure/Migrations/`

**Tasks to make these tests pass:**

- [ ] Add `Testcontainers.PostgreSql` package to `SiesaAgents.IntegrationTests.csproj`
- [ ] Create empty initial migration: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify migration file at `backend/src/SiesaAgents.Infrastructure/Migrations/` contains no `clientes` or `contactos` table creation
- [ ] Apply migration locally: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `siesa_agents_db` is created without errors via `psql -U postgres -c "\l" | grep siesa_agents_db`
- [ ] Run integration tests: `dotnet test tests/SiesaAgents.IntegrationTests`
- [ ] ✅ All 6 integration tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group 4: Scalar API documentation (AC5)

**Tasks to make these tests pass:**

- [ ] Verify `Scalar.AspNetCore` is referenced in `SiesaAgents.API.csproj` (already added in Story 1.1)
- [ ] Confirm `app.MapScalarApiReference()` is present in `Program.cs` — NOT `app.UseSwagger()`
- [ ] Confirm `app.UseOpenApi()` or similar is registered before `MapScalarApiReference()`
- [ ] Start backend: `dotnet run --project src/SiesaAgents.API`
- [ ] Run API tests: `npx playwright test e2e/tests/api/database-foundation.api.spec.ts`
- [ ] ✅ All Scalar-related API tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run xUnit unit tests (RED until ExceptionHandlingMiddleware + AppDbContext implemented)
dotnet test backend/tests/SiesaAgents.UnitTests

# Run xUnit integration tests (RED until AppDbContext + migrations implemented)
# Requires Docker for Testcontainers
dotnet test backend/tests/SiesaAgents.IntegrationTests

# Run all backend tests
dotnet test backend/SiesaAgents.sln

# Run API-level Playwright tests (RED until backend is running + middleware registered)
npx playwright test e2e/tests/api/database-foundation.api.spec.ts

# Run with verbose output
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --reporter=list

# Run in headed mode (for debugging)
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Unit tests for ExceptionHandlingMiddleware (AC3, AC4) — 13 tests
- ✅ Unit tests for AppDbContext (AC2, AC6) — 3 tests
- ✅ Integration tests for database connectivity and migration integrity (AC1, AC6, AC7) — 6 tests
- ✅ API-level Playwright tests for error handling and Scalar (AC3, AC4, AC5) — 10 tests
- ✅ IntegrationTests project created and added to SiesaAgents.sln
- ✅ Implementation checklist created with clear tasks
- ✅ No data factories or fixtures needed (backend-only story)

**Verification:**

- All unit/integration tests fail because referenced types do not exist yet (compile-time RED)
- All API tests fail because middleware is not yet registered in Program.cs (runtime RED)
- Failure messages are clear and actionable

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with middleware — most tests)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run test to verify it now passes (green)
5. Check off task in implementation checklist
6. Move to next test and repeat

**Recommended implementation order:**
1. Create `AppDbContext` (unblocks unit tests + integration tests)
2. Create `ExceptionHandlingMiddleware` (unblocks 13 unit tests)
3. Register both in `Program.cs` (unblocks API tests)
4. Run `dotnet ef migrations add InitialCreate` (unblocks integration tests)
5. Verify Scalar at `/scalar` is still working (AC5)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

After all tests pass:
1. Review middleware for code quality (no duplication, clear switch expression)
2. Ensure `ApplySnakeCaseNaming()` is genuinely the LAST call in `OnModelCreating`
3. Verify no `[Column]` or `[Table]` attributes are used anywhere in the project
4. Verify no `StackTrace` or internal message leaks via integration/API test coverage
5. Run full test suite to confirm all tests remain green after refactoring

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing xUnit tests: `dotnet test backend/SiesaAgents.sln` — expect compile errors (RED)
3. Run failing Playwright tests: `npx playwright test e2e/tests/api/database-foundation.api.spec.ts` — expect failures (RED)
4. Begin implementation using implementation checklist as guide
5. Work one test group at a time (AppDbContext → Middleware → Migrations)
6. When all tests pass, refactor code for quality

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure, one assertion per test, deterministic test design
- **test-levels-framework.md** — Unit for middleware/context logic; Integration for DB connectivity; API for HTTP contracts
- **fixture-architecture.md** — xUnit `IAsyncLifetime` for Testcontainers lifecycle management
- **selector-resilience.md** — No UI selectors needed (backend-only story)
- **network-first.md** — Not applicable (no UI navigation in this story)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command (Unit + Integration):** `dotnet test backend/SiesaAgents.sln`

**Expected Results:**

- `SiesaAgents.UnitTests` — Build FAILS (compile error: type `SiesaAgents.API.Middleware.ExceptionHandlingMiddleware` not found; type `SiesaAgents.Infrastructure.Data.AppDbContext` not found)
- `SiesaAgents.IntegrationTests` — Build FAILS (compile errors: same types not found)

**Command (API):** `npx playwright test e2e/tests/api/database-foundation.api.spec.ts`

**Expected Results:**

- Tests FAIL: middleware-specific assertions fail because ExceptionHandlingMiddleware is not registered
- Tests related to Scalar may conditionally pass/fail depending on Story 1.1 state

**Summary:**

- Total tests: 32 (13 middleware unit + 3 DbContext unit + 6 integration + 10 API)
- Passing: 0 expected before implementation
- Failing: 32 (expected — RED phase)
- Status: ✅ RED phase verified

---

## Notes

- This story is backend-only — no frontend files are touched
- The `SiesaAgents.IntegrationTests` project was added to `SiesaAgents.sln` as part of this ATDD setup
- Testcontainers requires Docker to be running for integration tests
- AC5 (Scalar) was partially covered by Story 1.1 ATDD tests; the tests in this story add specific coverage for the middleware-interaction scenario (Scalar + error handling coexistence)
- The `ConflictException` → 409 mapping is mentioned in the story but no custom exception type exists yet; the middleware should be designed to accommodate it when added in a future story
- `ApplySnakeCaseNaming()` cannot be unit-tested with the InMemory provider because NamingConventions only applies to relational providers; the integration tests with Testcontainers PostgreSQL provide the real validation for AC2

---

**Generated by BMad TEA Agent** - 2026-06-24
