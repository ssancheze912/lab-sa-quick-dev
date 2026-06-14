# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-14
**Author:** SiesaTeam (TEA Agent — sa-tea-atdd)
**Primary Test Level:** Unit (xUnit) + API Integration (Playwright)

---

## Story Summary

This story connects PostgreSQL and configures EF Core infrastructure so subsequent stories can define entities and run migrations against a working data layer.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update` from `backend/`, Then the `siesa_agents_db` database is created with no errors and the EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **AC2** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns a Problem Details RFC 7807 payload (with `status`, `title`, and `detail` fields) and no stack traces are exposed to the caller (NFR6). The existing `ExceptionHandlingMiddleware` must be correctly registered in `Program.cs`.

3. **AC3** — Given the backend receives any request that triggers EF Core activity, When the request is processed, Then `modelBuilder.UseSnakeCaseNamingConvention()` is applied inside `OnModelCreating` and all future column/table names follow snake_case convention automatically (no manual `[Column]` or `[Table]` attributes needed).

4. **AC4** — Given the EF Core migration tooling is configured, When the developer runs `dotnet ef migrations add InitialCreate`, Then an initial empty migration is generated with no domain tables (no `clientes`, no `contactos` tables) — only the EF Core migration history table.

5. **AC5** — Given the `AppDbContext` is registered in the DI container, When `dotnet build SiesaAgents.sln` is executed, Then the solution builds with zero errors and the connection string `ConnectionStrings:DefaultConnection` is read from `appsettings.Development.json`.

---

## Failing Tests Created (RED Phase)

### Unit Tests via xUnit — 10 tests

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `AppDbContext_CanBeInstantiated_WithInMemoryProvider`
  - **Status:** RED — `AppDbContext` type not resolvable if `SiesaAgents.Infrastructure` project is not yet wired or InMemory package missing
  - **Verifies:** AC3, AC5 — AppDbContext can be created with InMemory provider without exception

- **Test:** `OnModelCreating_AppliesSnakeCaseNaming_CanEnsureCreated`
  - **Status:** RED — Fails if `UseSnakeCaseNamingConvention()` or `ApplyConfigurationsFromAssembly()` is missing from `OnModelCreating`
  - **Verifies:** AC3 — snake_case naming convention applied correctly in model creation

- **Test:** `AppDbContext_HasNoEntityDbSets_InInitialMigration`
  - **Status:** RED — Fails if any domain entity (Cliente, Contacto) is accidentally registered on AppDbContext
  - **Verifies:** AC4 — Initial migration must be empty; no domain DbSet properties on AppDbContext

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ExceptionHandlingMiddlewareTests.cs`

- **Test:** `InvokeAsync_WhenExceptionThrown_ReturnsStatusCode500`
  - **Status:** RED — Fails if middleware is missing or does not set status 500
  - **Verifies:** AC2 — HTTP 500 returned for unhandled exceptions

- **Test:** `InvokeAsync_WhenExceptionThrown_ReturnsContentTypeProblemJson`
  - **Status:** RED — Fails if Content-Type is not `application/problem+json`
  - **Verifies:** AC2 — RFC 7807 media type set on error responses

- **Test:** `InvokeAsync_WhenExceptionThrown_ReturnsProblemDetailsWithStatusAndTitle`
  - **Status:** RED — Fails if response body lacks `status` and `title` RFC 7807 fields
  - **Verifies:** AC2 — Problem Details payload has required `status` and `title` fields

- **Test:** `InvokeAsync_WhenExceptionThrown_DoesNotExposeStackTrace`
  - **Status:** RED — Fails if stack trace fields (`StackTrace`, `at System.`, `at SiesaAgents.`) appear in response body
  - **Verifies:** AC2, NFR6 — No stack trace information exposed to caller

- **Test:** `InvokeAsync_WhenNoExceptionThrown_PassesThroughSuccessfully`
  - **Status:** RED — Fails if middleware disrupts successful request pipeline
  - **Verifies:** AC2 — Middleware passes through 200 OK responses unmodified

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ProgramWiringTests.cs`

- **Test:** `ServiceCollection_CanRegisterAppDbContext_WithNpgsqlProvider`
  - **Status:** RED — Fails until `AppDbContext` + Npgsql are resolvable in a service collection (mirrors Program.cs wiring)
  - **Verifies:** AC5 — AppDbContext can be registered via AddDbContext and resolved from DI container

- **Test:** `ServiceCollection_AppDbContext_IsRegisteredAsScopedLifetime`
  - **Status:** RED — Fails if AppDbContext is not registered with `ServiceLifetime.Scoped` (EF Core default via AddDbContext)
  - **Verifies:** AC5 — AppDbContext uses correct DI lifetime

### API Integration Tests via Playwright — 9 tests

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

- **Test:** `should return Content-Type application/problem+json when an unhandled error occurs`
  - **Status:** RED — Fails if ExceptionHandlingMiddleware is not registered; would return HTML ASP.NET error page
  - **Verifies:** AC2 — Middleware returns JSON, not HTML, for all error paths

- **Test:** `should return status 500 with Problem Details payload for unhandled exceptions`
  - **Status:** RED — Fails until `/api/atdd-trigger-exception-1-3` endpoint exists AND middleware returns structured body
  - **Verifies:** AC2 — 500 status with `status` + `title` fields in response body

- **Test:** `should NOT expose stack trace in the error response body`
  - **Status:** RED — Fails if stack trace keywords appear in 500 response body
  - **Verifies:** AC2, NFR6 — No `StackTrace`, `at System.`, `at SiesaAgents.` in response body

- **Test:** `should return detail as null in Problem Details — no internal message leaked`
  - **Status:** RED — Fails if `detail` field is not null (middleware must sanitize exception messages)
  - **Verifies:** AC2 — RFC 7807 `detail` field is explicitly null per architecture spec

- **Test:** `should include Content-Type application/problem+json header in 500 response`
  - **Status:** RED — Fails if Content-Type header is wrong on 500 responses
  - **Verifies:** AC2 — RFC 7807 media type header explicitly set by middleware

- **Test:** `should have the backend running (proves dotnet build succeeded with zero errors)`
  - **Status:** RED — Fails if backend does not start (build errors or DI container failure)
  - **Verifies:** AC5 — Successful build and startup with AppDbContext registered

- **Test:** `should serve the OpenAPI spec (proves AppDbContext registration did not break DI container)`
  - **Status:** RED — Fails if DI container build fails due to incorrect AppDbContext registration
  - **Verifies:** AC5 — DI container builds successfully with AppDbContext + other services

- **Test:** `should NOT return HTTP 500 on startup (proves connection string is readable from appsettings)`
  - **Status:** RED — Fails if backend crashes on startup due to configuration error
  - **Verifies:** AC5 — Connection string `DefaultConnection` readable from appsettings.Development.json

- **Test:** `should not return HTML error page for any error path (proves middleware intercepts before ASP.NET default handler)`
  - **Status:** RED — Fails if ExceptionHandlingMiddleware is not registered early in the pipeline
  - **Verifies:** AC2 — Middleware registered before developer exception page and routing

---

## Data Factories Created

No data factories are needed for this story. Story 1.3 is infrastructure-only (no domain entities). Tests use:
- EF Core InMemory provider for unit tests (no external data dependencies)
- Live backend HTTP calls for API integration tests (no user-created data)

---

## Fixtures Created

No new Playwright fixtures needed for this story. All API tests use the built-in `request` fixture from `@playwright/test`.

The existing `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage` fixtures for Story 1.2 — not applicable here.

---

## Mock Requirements

### Backend: Exception Trigger Endpoint (DEV team must create for AC2 full verification)

**Endpoint:** `GET /api/atdd-trigger-exception-1-3`

**Purpose:** A minimal test-only endpoint that deliberately throws an unhandled exception to trigger `ExceptionHandlingMiddleware`.

**Expected Success Response (after implementation):**

```json
{
  "status": 500,
  "title": "An unexpected error occurred.",
  "detail": null
}
```

**Implementation Hint:**

```csharp
// In Program.cs (temporary test endpoint — can be removed post-story)
app.MapGet("/api/atdd-trigger-exception-1-3", () => {
    throw new InvalidOperationException("ATDD test exception trigger for Story 1.3");
});
```

**Notes:** This endpoint is only needed to fully drive AC2 API tests to GREEN. It can be a permanent dev-environment-only route or removed after the story is accepted.

---

## Required data-testid Attributes

No `data-testid` attributes are required for this story. Story 1.3 is a backend-only story with no UI components. All tests operate at the API/unit level.

---

## Implementation Checklist

### Test: `AppDbContext_CanBeInstantiated_WithInMemoryProvider` (xUnit)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Add `Microsoft.EntityFrameworkCore.InMemory v10.*` to `SiesaAgents.UnitTests.csproj`
- [ ] Add `ProjectReference` to `SiesaAgents.Infrastructure.csproj` in the test project
- [ ] Verify `AppDbContext.cs` exists at `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "AppDbContext_CanBeInstantiated_WithInMemoryProvider"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `OnModelCreating_AppliesSnakeCaseNaming_CanEnsureCreated` (xUnit)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Verify `AppDbContext.OnModelCreating` calls `modelBuilder.UseSnakeCaseNamingConvention()`
- [ ] Verify `AppDbContext.OnModelCreating` calls `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)`
- [ ] Verify `EFCore.NamingConventions v9.*` is in `SiesaAgents.Infrastructure.csproj`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "OnModelCreating_AppliesSnakeCaseNaming"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `AppDbContext_HasNoEntityDbSets_InInitialMigration` (xUnit)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Confirm no `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` properties on `AppDbContext`
- [ ] Confirm `Migrations/` folder is absent OR contains only empty `InitialCreate` migration
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "AppDbContext_HasNoEntityDbSets"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Tests: `ExceptionHandlingMiddlewareTests` — all 5 tests (xUnit)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Verify `ExceptionHandlingMiddleware.cs` exists at `backend/src/SiesaAgents.API/Middleware/`
- [ ] Verify middleware sets `context.Response.ContentType = "application/problem+json"`
- [ ] Verify middleware sets `context.Response.StatusCode = 500`
- [ ] Verify middleware writes `ProblemDetails { Status = 500, Title = "...", Detail = null }`
- [ ] Verify middleware catches ALL exception types (`catch (Exception)`)
- [ ] Verify middleware does NOT write stack trace to response body
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Ensure registration is BEFORE `app.UseCors()` and before any `app.MapXxx()` calls
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "ExceptionHandlingMiddlewareTests"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Tests: `ProgramWiringTests` — 2 tests (xUnit)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/ProgramWiringTests.cs`

**Tasks to make these tests pass:**

- [ ] Add `Microsoft.EntityFrameworkCore.Design v10.*` to `SiesaAgents.API.csproj`
- [ ] Add `Microsoft.EntityFrameworkCore.Tools v10.*` to `SiesaAgents.Infrastructure.csproj`
- [ ] Add to `Program.cs`:
  ```csharp
  builder.Services.AddDbContext<AppDbContext>(options =>
      options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
  ```
- [ ] Add namespaces to `Program.cs`:
  ```csharp
  using SiesaAgents.Infrastructure.Data;
  using Microsoft.EntityFrameworkCore;
  ```
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "ProgramWiringTests"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Tests: AC2 Playwright API tests — 5 tests

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Register `ExceptionHandlingMiddleware` in `Program.cs` (see above)
- [ ] Add test endpoint `GET /api/atdd-trigger-exception-1-3` that throws an unhandled exception
- [ ] Verify response body from that endpoint contains `status: 500`, `title: "An unexpected error occurred."`, `detail: null`
- [ ] Verify response Content-Type is `application/problem+json`
- [ ] Verify response body contains no stack trace keywords
- [ ] Run tests: `cd e2e && npx playwright test tests/api/database-foundation.api.spec.ts --grep "AC2"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Tests: AC5 Playwright API tests — 4 tests

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Ensure `dotnet build SiesaAgents.sln` completes with zero errors
- [ ] Ensure `dotnet run --project src/SiesaAgents.API` starts without exceptions
- [ ] Verify `/scalar` returns HTTP 200
- [ ] Verify `/openapi/v1.json` returns HTTP 200 with JSON content
- [ ] Verify backend does NOT return HTTP 500 on startup
- [ ] Run tests: `cd e2e && npx playwright test tests/api/database-foundation.api.spec.ts --grep "AC5"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### AC1 + AC4: EF Core Migration (CLI verification — no automated test possible without live DB)

**Tasks to make AC1/AC4 verifiable:**

- [ ] From `backend/` directory, run:
  ```bash
  dotnet ef migrations add InitialCreate \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API
  ```
- [ ] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` folder was created
- [ ] Verify the generated migration has empty `Up()` and `Down()` methods (no domain tables)
- [ ] Verify `AppDbContextModelSnapshot.cs` was generated
- [ ] From `backend/` directory (with PostgreSQL running), run:
  ```bash
  dotnet ef database update \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API
  ```
- [ ] Verify `siesa_agents_db` database is created with no errors
- [ ] Verify no `clientes` or `contactos` tables exist in the database
- [ ] Commit the generated migration files

**Estimated Effort:** 1 hour (requires PostgreSQL running locally)

---

## Running Tests

```bash
# Run all xUnit unit tests for Story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests/ --logger "console;verbosity=normal"

# Run specific test class
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "ClassName=SiesaAgents.UnitTests.Infrastructure.AppDbContextTests"

# Run all Playwright API tests for Story 1.3
cd e2e && npx playwright test tests/api/database-foundation.api.spec.ts

# Run with headed browser (not applicable for API-only tests)
cd e2e && npx playwright test tests/api/database-foundation.api.spec.ts --reporter=list

# Debug specific test
cd e2e && npx playwright test tests/api/database-foundation.api.spec.ts --debug

# Run all tests for Epic 1
dotnet test backend/tests/SiesaAgents.UnitTests/ && cd e2e && npx playwright test tests/api/ tests/foundation/
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All xUnit tests written and in RED state (depend on missing wiring in Program.cs)
- All Playwright API tests written and in RED state (depend on missing test endpoint and middleware registration)
- Mock requirements documented (test exception trigger endpoint)
- No data-testid requirements (backend-only story)
- Implementation checklist created with clear tasks per test

**Verification:**

- xUnit tests fail at compile time or runtime if:
  - `Microsoft.EntityFrameworkCore.InMemory` is not added to test project
  - `AppDbContext` is not resolvable from Infrastructure project reference
  - `UseSnakeCaseNamingConvention()` is absent from `OnModelCreating`
  - `ExceptionHandlingMiddleware` does not return expected RFC 7807 payload
  - `AppDbContext` is not registered in DI

- Playwright API tests fail with:
  - `ERR_CONNECTION_REFUSED` if backend is not running
  - Wrong content type / HTML response body if middleware not registered
  - Missing `status`/`title` fields if Problem Details not correctly formatted

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist (start with xUnit unit tests)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in the implementation checklist
6. Move to next test and repeat

**Recommended Order:**
1. Add NuGet packages (InMemory, Design, Tools) — unblocks all xUnit tests
2. Verify `AppDbContext.cs` (already from Story 1.1 — should pass immediately)
3. Verify `ExceptionHandlingMiddleware.cs` (already from Story 1.1 — should pass immediately)
4. Wire `AddDbContext<AppDbContext>` in `Program.cs`
5. Register `UseMiddleware<ExceptionHandlingMiddleware>()` in `Program.cs`
6. Add test trigger endpoint for AC2 Playwright tests
7. Run EF Core migrations (AC1/AC4)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all tests pass (green phase complete)
2. Remove the `GET /api/atdd-trigger-exception-1-3` test endpoint if not wanted in production
3. Ensure `Program.cs` is clean and matches the spec in Dev Notes
4. Verify `Migrations/` folder is committed
5. Review `AppDbContext.cs` for any cleanup needed

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing xUnit tests to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests/`
3. Run failing Playwright tests: `cd e2e && npx playwright test tests/api/database-foundation.api.spec.ts`
4. Begin implementation using implementation checklist as guide
5. Work one test at a time (red to green for each)
6. When all tests pass, refactor `Program.cs` for clarity
7. When refactoring complete, manually update story status to 'in-progress' / 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — No custom fixtures needed; built-in `request` fixture from Playwright suffices for API-only tests
- **data-factories.md** — No data factories needed; infrastructure-only story with no domain entities
- **network-first.md** — Not applicable (API integration tests, no UI navigation)
- **test-quality.md** — Given-When-Then format applied, one assertion per test (atomic), deterministic tests
- **test-levels-framework.md** — Unit (xUnit) for logic/DI validation; API Integration (Playwright) for HTTP observable behavior
- **selector-resilience.md** — No UI selectors needed (backend-only story)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**xUnit Command:** `dotnet test backend/tests/SiesaAgents.UnitTests/`

**Expected Results (RED Phase):**

```
Total:  10
Passed: 0 (or partial if some infrastructure already wired from Story 1.1)
Failed: 10 (expected in RED phase — missing AddDbContext wiring, missing NuGet packages)
Status: RED phase — expected
```

**Playwright Command:** `cd e2e && npx playwright test tests/api/database-foundation.api.spec.ts`

**Expected Results (RED Phase):**

```
Total:  9
Passed: 0-3 (AC5 tests for /scalar may pass if Story 1.1 backend is running)
Failed: 6-9 (AC2 tests fail — middleware not wired or test endpoint missing)
Status: RED phase — expected
```

**Expected Failure Messages (xUnit):**

- `AppDbContextTests`: `System.TypeLoadException` if InMemory package missing, or test passes if AppDbContext already wired correctly from Story 1.1
- `ExceptionHandlingMiddlewareTests`: `NullReferenceException` or assertion failures if middleware returns unexpected response
- `ProgramWiringTests`: `InvalidOperationException: No service for type 'SiesaAgents.Infrastructure.Data.AppDbContext' has been registered` if AddDbContext call is missing from Program.cs

**Expected Failure Messages (Playwright):**

- AC2 tests: `expect(received).toContain(expected)` — expected `'application/problem+json'` but received HTML content-type, OR connection refused if backend not started
- AC5 tests: `expect(received).toBe(expected)` — expected `200` for `/scalar` if backend not started

---

## Notes

- Story 1.1 already created `AppDbContext.cs`, `ExceptionHandlingMiddleware.cs`, and `appsettings.Development.json` — those files should NOT be recreated
- The key missing wiring is: `AddDbContext<AppDbContext>` in `Program.cs` and `UseMiddleware<ExceptionHandlingMiddleware>()` in `Program.cs`
- AC1 and AC4 require a live PostgreSQL instance — they cannot be fully automated in CI without Docker/TestContainers
- The test endpoint `GET /api/atdd-trigger-exception-1-3` is optional for the story to be accepted — AC2 is fully covered by xUnit unit tests. The Playwright AC2 tests provide additional runtime confidence.
- Scope boundary is critical: Do NOT add `ClienteEntity`, `ContactoEntity`, or any domain DbSets — those belong to Epics 2 and 3

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-14
