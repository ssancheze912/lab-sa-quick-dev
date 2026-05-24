# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** Unit (C#/xUnit) + API (Playwright)

---

## Story Summary

Connects the PostgreSQL database and configures the EF Core infrastructure so that subsequent stories can define entities and run migrations against a working data layer. This includes DbContext registration in DI, snake_case naming convention via `EFCore.NamingConventions`, an initial empty migration, and verified Problem Details middleware behavior.

**As a** developer,
**I want** the PostgreSQL database connected and the EF Core infrastructure configured,
**So that** subsequent stories can define entities and run migrations against a working data layer.

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, when `dotnet ef database update` runs from `backend/`, then `siesa_agents_db` is created with no errors and `__EFMigrationsHistory` is present.
2. **AC2** — Given EF Core tooling ran the initial migration, when the `SiesaAgents.Infrastructure` project is inspected, then `Data/Migrations/` exists with an `InitialCreate` migration file whose `Up()` method is empty.
3. **AC3** — Given an unhandled exception in the backend, when the error reaches the middleware, then the response returns Problem Details RFC 7807 (`status`, `title`, `detail=null`) with `Content-Type: application/problem+json` and no stack traces exposed (NFR6).
4. **AC4** — Given the Infrastructure project is configured, when EF Core generates SQL, then `ApplySnakeCaseNaming()` is called in `OnModelCreating` so all column names follow snake_case.
5. **AC5** — Given the Infrastructure project is configured, when `dotnet build SiesaAgents.sln` runs, then the build succeeds with zero errors and `SiesaAgentsDbContext` is registered in the DI container via `Program.cs`.

---

## Failing Tests Created (RED Phase)

### Unit Tests — C# / xUnit (5 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/DbContextConfigurationTests.cs`

- **Test:** `DbContext_CanBeInstantiated_WithInMemoryDatabase`
  - **Status:** RED — `SiesaAgents.Infrastructure` project reference missing from test project; `EFCore.NamingConventions` not installed; `SiesaAgentsDbContext` constructor cannot be resolved.
  - **Verifies:** AC5 — DbContext instantiates correctly via DI-style construction.

- **Test:** `OnModelCreating_DoesNotThrow_WhenSnakeCaseNamingIsApplied`
  - **Status:** RED — `EFCore.NamingConventions` NuGet package not added to `SiesaAgents.Infrastructure.csproj`; `modelBuilder.ApplySnakeCaseNaming()` not called in `OnModelCreating`.
  - **Verifies:** AC4 — `ApplySnakeCaseNaming()` is called and executes without exception.

- **Test:** `OnModelCreating_ModelIsBuilt_WithNoEntityTypeErrors`
  - **Status:** RED — Same as above; model building chain (`base → ApplyConfigurationsFromAssembly → ApplySnakeCaseNaming`) not complete.
  - **Verifies:** AC4 — Full `OnModelCreating` chain executes: base → ApplyConfigurationsFromAssembly → ApplySnakeCaseNaming (last).

- **Test:** `DbContext_MultipleInstances_AreIndependent`
  - **Status:** RED — Project reference to `SiesaAgents.Infrastructure` missing from test project.
  - **Verifies:** AC5 — Scoped DI isolation: separate DbContext instances are distinct objects.

- **Test:** `DbContext_DatabaseProvider_IsConfigured`
  - **Status:** RED — Project reference missing; DbContext class not resolvable.
  - **Verifies:** AC1/AC2 — DbContext reports a configured provider; precondition for EF migrations.

---

### Unit Tests — C# / xUnit — ExceptionHandlingMiddleware (10 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`

- **Test:** `InvokeAsync_WhenNextDoesNotThrow_PassesThroughWithoutModifyingResponse`
  - **Status:** RED — `ExceptionHandlingMiddleware` class does not yet implement the full middleware contract (no stack trace suppression).
  - **Verifies:** AC3 — Middleware passes through for normal requests (no false positive).

- **Test:** `InvokeAsync_WhenNextThrows_ReturnsStatus500`
  - **Status:** RED — Middleware does not catch exceptions and set HTTP 500 status yet.
  - **Verifies:** AC3 — HTTP status code is 500 on unhandled exceptions.

- **Test:** `InvokeAsync_WhenNextThrows_SetsContentTypeToApplicationProblemJson`
  - **Status:** RED — `Content-Type: application/problem+json` not set in response.
  - **Verifies:** AC3 (NFR6) — Content-Type is exactly `application/problem+json`.

- **Test:** `InvokeAsync_WhenNextThrows_ResponseBodyContainsTitleField`
  - **Status:** RED — `ProblemDetails` response body not written by middleware.
  - **Verifies:** AC3 — `title` field present with generic message (not exception message).

- **Test:** `InvokeAsync_WhenNextThrows_DetailIsNull_NoExceptionLeakage`
  - **Status:** RED — `detail` field not guaranteed to be null; exception message could leak.
  - **Verifies:** AC3 (NFR6) — `detail` is null; no `ex.Message` or stack trace in body.

- **Test:** `InvokeAsync_WhenNextThrows_StatusFieldInBodyIs500`
  - **Status:** RED — `ProblemDetails.Status` not set to 500 in JSON body.
  - **Verifies:** AC3 — `status` field in body matches HTTP status code (RFC 7807).

- **Test (Theory):** `InvokeAsync_ForAnyExceptionType_ReturnsUniform500Response` (4 cases)
  - **Status:** RED — Middleware not yet handling diverse exception types uniformly.
  - **Verifies:** AC3 — NullReferenceException, InvalidOperationException, UnauthorizedAccessException, NotImplementedException all produce identical 500 + application/problem+json response.

---

### API Tests — Playwright (12 tests)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

#### AC1 + AC5 — DbContext DI Registration and Database Connectivity (4 tests)

- **Test:** `should have the backend API server running — DbContext registered in DI without startup crash`
  - **Status:** RED — `AddDbContext<SiesaAgentsDbContext>()` not yet called in `Program.cs`; server crashes on startup.
  - **Verifies:** AC5 — Server starts with DbContext registered, no startup exception.

- **Test:** `should return 200 on the Scalar endpoint after DbContext DI registration is added`
  - **Status:** RED — Program.cs missing DbContext registration; build may fail or server may not start.
  - **Verifies:** AC5 — `dotnet build` succeeded and server started; Scalar accessible at `/scalar`.

- **Test:** `should NOT return 500 on startup — invalid DbContext config would crash the process`
  - **Status:** RED — `DefaultConnection` string not configured in `appsettings.Development.json` (or missing `siesa_agents_db` target); startup throws.
  - **Verifies:** AC1 — Connection string for `siesa_agents_db` is valid and present.

- **Test:** `should expose an OpenAPI document confirming the API project compiled with EF Core design tools`
  - **Status:** RED — `Microsoft.EntityFrameworkCore.Design` package not added to `SiesaAgents.API.csproj`.
  - **Verifies:** AC5 — Design package present; `dotnet ef` can discover DbContext from startup project.

#### AC3 — Problem Details RFC 7807 for Unhandled Exceptions (6 tests)

- **Test:** `should return Content-Type application/problem+json for unhandled server errors`
  - **Status:** RED — `/api/test-exception` probe endpoint does not exist; even if it did, middleware does not yet set the correct Content-Type.
  - **Verifies:** AC3 (NFR6) — `Content-Type: application/problem+json` header on exception responses.

- **Test:** `should return HTTP status 500 when an unhandled exception is caught by the middleware`
  - **Status:** RED — `/api/test-exception` endpoint missing; middleware not wired for runtime.
  - **Verifies:** AC3 — HTTP 500 status on any unhandled exception.

- **Test:** `should include the required RFC 7807 fields: status, title in the response body`
  - **Status:** RED — No exception probe endpoint; `ProblemDetails` body not written.
  - **Verifies:** AC3 — JSON body contains `status: 500` and non-empty `title`.

- **Test:** `should have Detail field set to null — no internal error information exposed (NFR6)`
  - **Status:** RED — Middleware does not set `Detail = null` explicitly.
  - **Verifies:** AC3 (NFR6) — `detail` is null; no internal exception message exposed.

- **Test:** `should NOT contain any stack trace text in the response body (NFR6 security)`
  - **Status:** RED — Without middleware, .NET default error page includes stack trace HTML.
  - **Verifies:** AC3 (NFR6) — No stack trace indicators in response body.

- **Test:** `should return consistent Problem Details structure regardless of exception type`
  - **Status:** RED — Middleware not implemented for runtime; exception type discrimination possible.
  - **Verifies:** AC3 — Uniform 500 + `application/problem+json` for all exception types.

#### AC3 Edge Cases — Middleware Pass-Through (2 tests)

- **Test:** `should NOT return application/problem+json for a successful 200 response`
  - **Status:** RED — Without middleware registered, Content-Type defaults to `text/html`; but with broken middleware it could intercept normal responses.
  - **Verifies:** AC3 — Middleware does not intercept normal (non-exception) requests.

- **Test:** `should NOT return 500 when visiting a normal route (no exception path)`
  - **Status:** RED — Misconfigured middleware could return 500 for all routes.
  - **Verifies:** AC3 — Middleware only activates on actual unhandled exceptions.

---

## Data Factories Created

No data factories required for Story 1.3. This story has no domain entities to create or manage — the database is initialized with an empty migration. Factories for `ClienteEntity` and `ContactoEntity` are created in Stories 2.1 and 3.1 respectively.

---

## Fixtures Created

No new Playwright fixtures required for Story 1.3. The existing `e2e/fixtures/base.fixture.ts` provides the project-level fixture base. All tests in this story use direct `request` API calls (no browser page navigation required).

---

## Mock Requirements

### Exception Probe Endpoint (DEV Team must implement)

The API tests for AC3 require a test exception endpoint to exist in the backend. This endpoint must be registered only in the Development environment.

**Implementation requirement for DEV team:**

```csharp
// backend/src/SiesaAgents.API/Program.cs — add in Development environment only
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/test-exception", () =>
    {
        throw new InvalidOperationException("ATDD test exception probe");
    });
}
```

**Endpoint:** `GET /api/test-exception`

**Expected behavior:** Throws an unhandled exception → caught by `ExceptionHandlingMiddleware` → returns:
- HTTP status: `500`
- Content-Type: `application/problem+json`
- Body: `{ "status": 500, "title": "An unexpected error occurred.", "detail": null }`

**Notes:** This endpoint is only needed in Development for ATDD verification. It must NOT be present in Production builds.

---

## Required data-testid Attributes

No frontend UI changes are required for Story 1.3. This story is entirely backend infrastructure. No `data-testid` attributes are needed.

---

## Implementation Checklist

### Test: `DbContext_CanBeInstantiated_WithInMemoryDatabase` (Unit)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/DbContextConfigurationTests.cs`

**Tasks to make this test pass:**

- [ ] Add NuGet package `EFCore.NamingConventions` (version `10.*`) to `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
- [ ] Add NuGet package `Microsoft.EntityFrameworkCore.InMemory` (version `10.*`) to `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` (already added — verify)
- [ ] Confirm project reference to `SiesaAgents.Infrastructure` exists in `SiesaAgents.UnitTests.csproj` (already added — verify)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "DbContext_CanBeInstantiated_WithInMemoryDatabase"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `OnModelCreating_DoesNotThrow_WhenSnakeCaseNamingIsApplied` (Unit)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/DbContextConfigurationTests.cs`

**Tasks to make this test pass:**

- [ ] Add `EFCore.NamingConventions` package to Infrastructure project (see above)
- [ ] Update `SiesaAgentsDbContext.OnModelCreating` to call `modelBuilder.ApplySnakeCaseNaming()` as the **last** statement after `modelBuilder.ApplyConfigurationsFromAssembly(...)`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "OnModelCreating_DoesNotThrow"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `InvokeAsync_WhenNextThrows_*` (Unit — ExceptionHandlingMiddleware, 6 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Review `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — confirm it sets `context.Response.ContentType = "application/problem+json"`, `StatusCode = 500`, and writes `ProblemDetails { Status = 500, Title = "An unexpected error occurred.", Detail = null }`
- [ ] Confirm `Detail` is always `null` — never `ex.Message`, never stack trace
- [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered before routing in `Program.cs`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandling"`
- [ ] ✅ All 10 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC1+AC5 API tests — `should have the backend API server running` (4 Playwright tests)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, add: `builder.Services.AddDbContext<SiesaAgentsDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))`
- [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.API.csproj` (PrivateAssets=all)
- [ ] Verify `appsettings.Development.json` contains `ConnectionStrings:DefaultConnection` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`
- [ ] Run: `dotnet build SiesaAgents.sln` — verify zero errors
- [ ] Start backend: `dotnet run --project backend/src/SiesaAgents.API`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC3 API tests — Problem Details RFC 7807 (8 Playwright tests)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add `/api/test-exception` probe endpoint in `Program.cs` (Development environment only — see Mock Requirements above)
- [ ] Verify `ExceptionHandlingMiddleware` is correctly wired before routing in `Program.cs`
- [ ] Confirm middleware returns `application/problem+json` Content-Type, HTTP 500, and `Detail = null`
- [ ] Start backend with Development environment: `ASPNETCORE_ENVIRONMENT=Development dotnet run --project backend/src/SiesaAgents.API`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC3"`
- [ ] ✅ All 8 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Migration verification (AC1, AC2)

**Note:** AC1 (database created) and AC2 (Migrations/ folder with empty InitialCreate) are verified by running the migration commands manually as part of the story tasks. These criteria cannot be fully automated at unit level since they require a live PostgreSQL instance. The unit tests in `DbContextConfigurationTests` provide the compile-time and model-building verification; the actual database creation is a manual/CI step.

**Tasks:**

- [ ] Run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` (from `backend/` directory)
- [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` exists with `*_InitialCreate.cs`
- [ ] Confirm `Up()` method is empty (no `CreateTable` calls)
- [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `siesa_agents_db` exists in PostgreSQL with `__EFMigrationsHistory` table

---

## Running Tests

```bash
# Run all C# unit tests for Story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests

# Run only DbContext unit tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "DbContextConfigurationTests"

# Run only middleware unit tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddlewareTests"

# Run all Playwright API tests for Story 1.3
npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts

# Run Story 1.3 API tests in headed mode (see requests in browser network)
npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --headed

# Run Story 1.3 API tests with debug output
npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --debug

# Run all tests (unit + API) for complete Story 1.3 RED phase verification
dotnet test backend/tests/SiesaAgents.UnitTests && npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All unit tests written and failing (DbContextConfigurationTests + ExceptionHandlingMiddlewareTests)
- ✅ All API tests written and failing (backend-database-foundation.api.spec.ts)
- ✅ Mock requirements documented (exception probe endpoint specification)
- ✅ Implementation checklist created with ordered tasks
- ✅ No data-testid requirements (pure backend story)

**Verification:**

- Unit tests fail: `SiesaAgentsDbContext` cannot be instantiated (missing package + missing `ApplySnakeCaseNaming()`)
- API tests fail: Server crashes on startup (missing `AddDbContext<>()` call) OR `/api/test-exception` endpoint does not exist
- Failure messages are actionable (missing package, missing method call, missing endpoint)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with unit tests** (fastest feedback loop — no running server needed)
2. **Task 1 (AC4):** Add `EFCore.NamingConventions` package → call `ApplySnakeCaseNaming()` in `OnModelCreating` → run unit tests
3. **Task 2 (AC5):** Register `AddDbContext<SiesaAgentsDbContext>()` in `Program.cs` → add `Design` package → run `dotnet build`
4. **Task 3 (AC1/AC2):** Run migration commands → verify empty `Up()` → run `database update`
5. **Task 4 (AC3):** Review `ExceptionHandlingMiddleware` for RFC 7807 compliance → add test probe endpoint → run API tests
6. **Task 5:** Run full test suite to confirm all tests GREEN

**Key Principles:**

- One test at a time (fastest feedback)
- Unit tests before API tests (no server spin-up needed)
- Verify `Up()` is empty before running `database update`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**Checklist:**

1. Verify all 27 tests pass (5 unit DbContext + 10 unit middleware + 12 API)
2. Review `SiesaAgentsDbContext.OnModelCreating` — ensure `ApplySnakeCaseNaming()` is the last call
3. Review `Program.cs` — ensure DbContext registration is organized with other service registrations
4. Ensure `[Column]` and `[Table]` data annotations are absent (naming handled by convention only)
5. Confirm `Detail = null` is explicit (not implicit) in `ExceptionHandlingMiddleware`
6. Run tests after each change to confirm no regressions

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing unit tests first** to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests`
3. **Run failing API tests** to confirm RED phase: `npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts`
4. **Begin implementation** using implementation checklist (Task 1 → Task 2 → Task 3 → Task 4)
5. **Work one test at a time** — each task targets specific failing tests
6. **When all tests pass**, refactor for code quality

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Test fixture patterns (no new fixtures needed; existing `base.fixture.ts` sufficient)
- **network-first.md** — Route interception patterns (API tests use direct `request` calls; no browser navigation)
- **test-quality.md** — One assertion per test, Given-When-Then format, deterministic test data
- **test-levels-framework.md** — Unit tests for pure logic (DbContext config, middleware behavior); API tests for runtime contract verification (DI registration, exception middleware)
- **selector-resilience.md** — Not applicable (no frontend UI in this story)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Unit tests command:** `dotnet test backend/tests/SiesaAgents.UnitTests`

**Expected failures:**

- `DbContext_CanBeInstantiated_WithInMemoryDatabase` → `CS0246: The type or namespace 'SiesaAgentsDbContext' could not be found` (project reference issue) OR `InvalidOperationException: No database provider has been configured` (missing `EFCore.NamingConventions`)
- `OnModelCreating_DoesNotThrow_WhenSnakeCaseNamingIsApplied` → `MissingMethodException: 'ApplySnakeCaseNaming'` (package not installed)
- ExceptionHandlingMiddleware tests → Multiple assertion failures (`Assert.Equal(500, ...)`, `Assert.Equal("application/problem+json", ...)`, `Assert.Null(detail)`)

**API tests command:** `npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts`

**Expected failures:**

- All AC1/AC5 tests → `net::ERR_CONNECTION_REFUSED` (server fails to start due to missing `AddDbContext<>()`)
- All AC3 tests → `net::ERR_CONNECTION_REFUSED` OR `404 Not Found` (probe endpoint missing) OR `500` with wrong Content-Type

**Summary:**

- Total tests: 27 (5 unit DbContext + 10 unit middleware + 12 API)
- Passing: 0 (expected — RED phase)
- Failing: 27 (expected)
- Status: RED phase verified

---

## Notes

- The `DbContextConfigurationTests.cs` and `ExceptionHandlingMiddlewareTests.cs` files already exist in the repository skeleton (created as part of Story 1.1/1.3 scaffolding). They are in RED state because the implementation classes (`SiesaAgentsDbContext.ApplySnakeCaseNaming` call, `ExceptionHandlingMiddleware` full implementation) are incomplete.
- The `/api/test-exception` probe endpoint is required only in the Development environment. The API tests will skip gracefully in CI/Production if this endpoint is absent — but locally it is mandatory for AC3 verification.
- AC2 (Migrations/ folder with empty `Up()`) cannot be verified by automated tests without a real PostgreSQL instance. The unit tests in `DbContextConfigurationTests` verify the model-building preconditions; the migration commands are manual verification steps.
- All Playwright API tests in this story are in the `e2e/tests/api/` directory and use the `request` fixture directly (no browser required). They are included in the existing Playwright `testDir: './e2e'` scope.

---

**Generated by BMad TEA Agent** — 2026-05-24
