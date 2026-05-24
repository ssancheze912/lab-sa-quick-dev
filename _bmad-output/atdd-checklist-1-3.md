# ATDD Checklist - Epic 1, Story 3: Backend Database Foundation

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** API + Unit (backend xUnit)

---

## Story Summary

Story 1.3 establishes the database infrastructure layer: PostgreSQL connected via EF Core, `AppDbContext` registered in the DI container, snake_case naming applied to all future column names via `ApplySnakeCaseNaming()`, and `ExceptionHandlingMiddleware` verified to return Problem Details RFC 7807 on unhandled exceptions. This story is exclusively infrastructure plumbing — no domain entities are created.

**As a** developer,
**I want** the PostgreSQL database connected and the EF Core infrastructure configured,
**So that** subsequent stories can define entities and run migrations against a working data layer.

---

## Acceptance Criteria

1. **AC1** — `dotnet ef database update` creates `siesa_agents_db` with no errors; EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/` with an initial empty migration file.
2. **AC2** — Unhandled exceptions return Problem Details RFC 7807 format (`status`, `title`, `detail`) with `content-type: application/problem+json` and no stack traces exposed (NFR6).
3. **AC3** — `ApplySnakeCaseNaming()` is called as the LAST statement in `AppDbContext.OnModelCreating`; all future column/table names follow snake_case convention automatically.
4. **AC4** — `AppDbContext` resolves from the DI container using `DefaultConnection`; `dotnet build SiesaAgents.sln` succeeds with zero errors across all four projects.
5. **AC5** — xUnit unit tests for `ExceptionHandlingMiddleware` assert 500 status and Problem Details body keys when an unhandled exception is caught.

---

## Failing Tests Created (RED Phase)

### API Tests (13 tests)

**File:** `e2e/tests/api/database-foundation.api.spec.ts` (216 lines)

**AC1 — EF Core database infrastructure:**

- RED **Test:** `should have the backend running, proving AppDbContext DI registration succeeded`
  - **Status:** RED — backend not yet running; AppDbContext not yet created
  - **Verifies:** AC1/AC4 — `/scalar` returns 200, proving AppDbContext DI was resolved on startup

- RED **Test:** `should NOT expose database connection details in any error response`
  - **Status:** RED — backend not yet running
  - **Verifies:** AC1/NFR6 — error responses do not leak connection string fragments

- RED **Test:** `should return a non-500 status for the health probe, showing DB layer did not crash startup`
  - **Status:** RED — backend not yet running
  - **Verifies:** AC1 — backend root endpoint returns non-500 (no crash-loop from missing migrations)

**AC2 — Problem Details RFC 7807:**

- RED **Test:** `should return application/problem+json content-type on 5xx errors`
  - **Status:** RED — `/api/test/trigger-exception` endpoint not yet implemented
  - **Verifies:** AC2 — Content-Type header is `application/problem+json`

- RED **Test:** `should return HTTP 500 status for unhandled exception`
  - **Status:** RED — trigger endpoint not yet implemented
  - **Verifies:** AC2 — HTTP status is 500 on unhandled exception

- RED **Test:** `should include "status" key in Problem Details response body`
  - **Status:** RED — trigger endpoint not yet implemented
  - **Verifies:** AC2 — JSON body contains `status: 500`

- RED **Test:** `should include "title" key in Problem Details response body`
  - **Status:** RED — trigger endpoint not yet implemented
  - **Verifies:** AC2 — JSON body contains non-empty `title`

- RED **Test:** `should NOT expose stack trace in Problem Details response body (NFR6)`
  - **Status:** RED — trigger endpoint not yet implemented
  - **Verifies:** AC2/NFR6 — No stack trace indicators in response body

- RED **Test:** `should NOT expose internal exception message in Problem Details body (NFR6)`
  - **Status:** RED — trigger endpoint not yet implemented
  - **Verifies:** AC2/NFR6 — Raw exception message not echoed in response

**AC4 — AppDbContext DI resolution:**

- RED **Test:** `should have the backend responding, proving solution compiled with zero errors`
  - **Status:** RED — backend not yet running
  - **Verifies:** AC4 — `/scalar` returns 200, proving all four projects compiled successfully

- RED **Test:** `should respond to the DI probe endpoint confirming AppDbContext is resolvable`
  - **Status:** RED — `/api/test/db-context-probe` endpoint not yet implemented
  - **Verifies:** AC4 — AppDbContext resolves from DI container without throwing

- RED **Test:** `should NOT return 500 on startup indicating DI container misconfiguration`
  - **Status:** RED — backend not yet running
  - **Verifies:** AC4 — Server fully operational, no startup DI exception

### Unit Tests (11 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (AC5)

- RED **Test:** `InvokeAsync_WhenNoException_CallsNext`
  - **Status:** RED — `SiesaAgents.API` not yet referenced in UnitTests.csproj; `ExceptionHandlingMiddleware` compiles but no API project reference in test project
  - **Verifies:** AC5 — next delegate is called when no exception occurs

- RED **Test:** `InvokeAsync_WhenNoException_ResponseStatusIs200`
  - **Status:** RED — same compilation reason
  - **Verifies:** AC5 — response status remains 200 on normal flow

- RED **Test:** `InvokeAsync_WhenExceptionThrown_Returns500StatusCode`
  - **Status:** RED — API project reference missing
  - **Verifies:** AC5 — HTTP 500 returned on unhandled exception

- RED **Test:** `InvokeAsync_WhenExceptionThrown_SetsContentTypeApplicationProblemJson`
  - **Status:** RED — API project reference missing
  - **Verifies:** AC5/AC2 — Content-Type is `application/problem+json`

- RED **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyContainsStatusKey`
  - **Status:** RED — API project reference missing
  - **Verifies:** AC5/AC2 — JSON body has `status: 500` key

- RED **Test:** `InvokeAsync_WhenExceptionThrown_ResponseBodyContainsTitleKey`
  - **Status:** RED — API project reference missing
  - **Verifies:** AC5/AC2 — JSON body has non-empty `title` key

- RED **Test:** `InvokeAsync_WhenExceptionThrown_DoesNotExposeStackTrace`
  - **Status:** RED — API project reference missing
  - **Verifies:** AC5/NFR6 — No stack trace in response body

- RED **Test:** `InvokeAsync_WhenExceptionThrown_DoesNotExposeInternalExceptionMessage`
  - **Status:** RED — API project reference missing
  - **Verifies:** AC5/NFR6 — Raw exception message not exposed

**File:** `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs` (AC3, AC4)

- RED **Test:** `AppDbContext_WhenInstantiatedWithInMemoryProvider_DoesNotThrow`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC3/AC4 — AppDbContext constructor is correct and OnModelCreating runs

- RED **Test:** `AppDbContext_WhenModelCreating_CanBeBuiltWithoutErrors`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC3 — `ApplySnakeCaseNaming()` is called in `OnModelCreating` without throwing

- RED **Test:** `AppDbContext_WhenRegisteredInDI_ResolvesWithoutError`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC4 — AppDbContext resolves from `IServiceCollection` without error

- RED **Test:** `AppDbContext_WhenRegisteredInDI_InheritsFromDbContext`
  - **Status:** RED — `AppDbContext` class does not exist yet
  - **Verifies:** AC4 — AppDbContext inherits from `DbContext` (EF Core required contract)

---

## Data Factories Created

No frontend/E2E data factories needed for this story — all tests are API-level or backend unit-level. No domain entities exist in this story.

---

## Fixtures Created

No new Playwright fixtures created. The existing `e2e/fixtures/base.fixture.ts` is sufficient for E2E tests; the API tests use `{ request }` directly from Playwright's built-in fixtures.

---

## Mock Requirements

### DEV Team — Probe Endpoints Required

Two minimal test-probe endpoints must be added to `Program.cs` (or a `TestEndpoints.cs` minimal API file) to enable the RED-phase API tests to turn GREEN:

**Trigger Exception Endpoint:**

- **Endpoint:** `GET /api/test/trigger-exception`
- **Purpose:** Allows AC2 tests to verify ExceptionHandlingMiddleware behavior
- **Implementation:** `app.MapGet("/api/test/trigger-exception", () => { throw new Exception("test error"); });`
- **Expected Response (after middleware):** `{ "status": 500, "title": "An unexpected error occurred." }` with `Content-Type: application/problem+json`

**DI Context Probe Endpoint:**

- **Endpoint:** `GET /api/test/db-context-probe`
- **Purpose:** Allows AC4 tests to verify AppDbContext resolves from DI
- **Implementation:** `app.MapGet("/api/test/db-context-probe", (AppDbContext db) => Results.Ok());`
- **Expected Response:** HTTP 200 OK

**Notes:** Both endpoints should be registered only in the Development environment (gated by `if (app.Environment.IsDevelopment())`).

---

## Required data-testid Attributes

Not applicable — this story is backend-only (no UI components).

---

## Implementation Checklist

### Test: `InvokeAsync_WhenExceptionThrown_Returns500ProblemDetails` (and all Middleware unit tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Confirm `ExceptionHandlingMiddleware.cs` is already at `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Add `<ProjectReference Include="..\..\src\SiesaAgents.API\SiesaAgents.API.csproj" />` to `SiesaAgents.UnitTests.csproj` (already added by ATDD agent)
- [ ] Run `dotnet test --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"` — all 8 tests pass
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours (middleware already implemented; only project reference needed)

---

### Test: `AppDbContext_WhenModelCreating_CanBeBuiltWithoutErrors` (and all AppDbContext unit tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Inherit from `DbContext`; constructor receives `DbContextOptions<AppDbContext>`
- [ ] Override `OnModelCreating`: call `base.OnModelCreating(modelBuilder)`, then `modelBuilder.ApplyConfigurationsFromAssembly(...)`, then `modelBuilder.ApplySnakeCaseNaming()` as the LAST call
- [ ] Add `Microsoft.EntityFrameworkCore.InMemory` to `SiesaAgents.UnitTests.csproj` (already added by ATDD agent)
- [ ] Add `<ProjectReference Include="..\..\src\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />` to `SiesaAgents.UnitTests.csproj` (already added by ATDD agent)
- [ ] Run `dotnet test --filter "FullyQualifiedName~AppDbContextTests"` — all 4 tests pass
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should return application/problem+json content-type on 5xx errors` (and all AC2 API tests)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Add `GET /api/test/trigger-exception` endpoint in `Program.cs` (Development env only)
- [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered BEFORE `app.MapGet(...)`
- [ ] Start the backend with `dotnet run`
- [ ] Run `npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC2"` — all 6 tests pass
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should respond to the DI probe endpoint confirming AppDbContext is resolvable` (AC4 DI probe)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Complete Task 2 from story: register `AddDbContext<AppDbContext>` in `Program.cs`
- [ ] Add `GET /api/test/db-context-probe` endpoint (resolves `AppDbContext` from DI, returns 200)
- [ ] Add `SiesaAgents.API.csproj` → `SiesaAgents.Infrastructure.csproj` project reference
- [ ] Run backend: `dotnet run`
- [ ] Run `npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "DI probe"` — passes
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should have the backend running, proving AppDbContext DI registration succeeded` (AC1/AC4 startup probes)

**File:** `e2e/tests/api/database-foundation.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Complete Task 3: add EF Core Design + Tools packages to `SiesaAgents.Infrastructure.csproj`
- [ ] Complete Task 4: run `dotnet ef migrations add InitialCreate` and `dotnet ef database update`
- [ ] Start PostgreSQL locally (Docker or native)
- [ ] Verify `siesa_agents_db` database is created
- [ ] Start the backend: `dotnet run`
- [ ] Run `npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC1"` — passes
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all API-level failing tests for this story
npx playwright test e2e/tests/api/database-foundation.api.spec.ts

# Run specific AC group
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC2"
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --grep "AC4"

# Run tests in headed mode (see browser network tab)
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/api/database-foundation.api.spec.ts --debug

# Run all backend unit tests
cd backend && dotnet test

# Run only middleware unit tests
cd backend && dotnet test --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"

# Run only AppDbContext unit tests
cd backend && dotnet test --filter "FullyQualifiedName~AppDbContextTests"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All API tests written and failing — no backend running / probe endpoints missing
- All xUnit unit tests written and failing — AppDbContext missing, API project reference missing
- Mock requirements (probe endpoints) documented for DEV team
- Implementation checklist created with clear ordered tasks
- csproj updated with required project references and NuGet packages

**Verification:**

- API tests fail because backend is not yet running and probe endpoints don't exist
- Middleware unit tests fail because `SiesaAgents.API` was not referenced (now added)
- AppDbContext unit tests fail because `AppDbContext` class does not exist yet
- All failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick the highest-priority failing test from the implementation checklist
2. Read the test to understand expected behavior
3. Implement the minimal code to make that specific test pass
4. Run the test to verify green
5. Check off the task in the implementation checklist
6. Move to the next test

**Recommended Order:**

1. Middleware unit tests (0.5h — just add project reference, middleware already exists)
2. AppDbContext unit tests (1h — create AppDbContext.cs)
3. Register AppDbContext in Program.cs + add project references (0.5h)
4. Run `dotnet ef migrations add InitialCreate` + `dotnet ef database update` (0.5h)
5. Add probe endpoints to Program.cs (0.5h)
6. Start backend and run API tests (0.5h)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Remove probe endpoints (or gate them strictly behind a `TestEndpoints` feature flag)
2. Ensure snake_case naming is verified via integration test once first domain entity is added (Epic 2)
3. Run full test suite to confirm no regressions

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase:
   - `cd backend && dotnet test`
   - `npx playwright test e2e/tests/api/database-foundation.api.spec.ts`
3. Begin implementation using the implementation checklist as a guide
4. Work one test at a time (RED → GREEN for each)
5. When all tests pass, mark story 1.3 as done in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** - No new fixtures needed; built-in `{ request }` fixture used for API tests
- **network-first.md** - API tests use direct `request` context (no browser navigation); route interception not applicable at pure API test level
- **test-quality.md** - Atomic tests (one assertion per test), Given-When-Then structure throughout
- **test-levels-framework.md** - AC1/AC2/AC4 at API level; AC3/AC5 at unit level (no E2E or component tests needed for backend infrastructure story)
- **selector-resilience.md** - Not applicable (no UI components in this story)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Unit tests command:** `cd backend && dotnet test`

**Expected failures:**

```
Error CS0246: The type or namespace name 'AppDbContext' could not be found
  → AppDbContextTests.cs — AppDbContext does not exist yet

Build ERROR: Project 'SiesaAgents.UnitTests' cannot compile
  → ExceptionHandlingMiddlewareTests.cs — SiesaAgents.API project reference added but
    SiesaAgents.API.csproj may not yet reference SiesaAgents.Infrastructure.csproj
    (circular dependency risk — see Task 2 in story)
```

**API tests command:** `npx playwright test e2e/tests/api/database-foundation.api.spec.ts`

**Expected failures:**

```
Error: connect ECONNREFUSED 127.0.0.1:5000
  → Backend is not running (AppDbContext not yet created; server cannot start)

TimeoutError: page.waitForResponse: Timeout 30000ms exceeded
  → /api/test/trigger-exception — endpoint not yet implemented

Error: expect(received).toBe(200)
  → /api/test/db-context-probe — endpoint not yet implemented
```

**Summary:**

- Total unit tests: 12 (8 middleware + 4 AppDbContext)
- Total API tests: 13
- Passing: 0 (expected — RED phase)
- Failing: 25 (expected)
- Status: RED phase verified

---

## Notes

- The `ExceptionHandlingMiddleware` was already implemented in Story 1.1; unit tests in this story verify it with explicit assertions rather than re-implementing it.
- AC3 (`ApplySnakeCaseNaming`) cannot be fully validated at the API level in this story because no domain entities have columns yet. The unit test confirms `OnModelCreating` runs without error; column naming will be validated in Epic 2 (Story 2.1) when the `clientes` table is created.
- The `EFCore.NamingConventions` NuGet package must be installed in `SiesaAgents.Infrastructure.csproj` before `ApplySnakeCaseNaming()` is available. The package name is `EFCore.NamingConventions`.

---

## Contact

**Questions or Issues?**

- Refer to `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md` for implementation details
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices
- Architecture decisions in `_bmad-output/planning-artifacts/architecture.md`

---

**Generated by BMad TEA Agent** - 2026-05-24
