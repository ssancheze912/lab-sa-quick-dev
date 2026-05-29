# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-05-29
**Author:** sa-tea-atdd
**Primary Test Level:** API Integration (Playwright) + Unit (xUnit)

---

## Story Summary

As a developer, I want the PostgreSQL database connected and the EF Core infrastructure configured, so that subsequent stories can define entities and run migrations against a working data layer.

**As a** developer
**I want** PostgreSQL connected and EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update`, Then the `siesa_agents_db` database is created with no errors, And the EF Core migrations folder exists in `SiesaAgents.Infrastructure`.

2. **AC2** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format (status, title, detail) with no stack traces exposed (NFR6).

3. **AC3** — Given the backend receives any request, When the request is processed, Then `ApplySnakeCaseNaming()` is applied in `OnModelCreating` and all future column names will follow snake_case convention automatically.

---

## Failing Tests Created (RED Phase)

### API Integration Tests (15 tests — Playwright)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts` (EXISTING — already generated)

> This file was created in a prior session. The tests target test-probe endpoints (`/api/v1/test-probes/throw-unhandled`, `/api/v1/test-probes/throw-not-found`, `/api/v1/test-probes/throw-validation`) that do not exist yet.

**Describe: AC2 — Unhandled exception returns Problem Details 500 (RFC 7807)** (6 tests)

- `[P0] should return HTTP 500 when an unhandled exception is triggered`
  - **Status:** RED — `/api/v1/test-probes/throw-unhandled` endpoint not implemented
  - **Verifies:** AC2 — 500 HTTP status code

- `[P0] should return Content-Type application/problem+json for unhandled exception`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 — RFC 7807 Content-Type header

- `[P0] should include status field equal to 500 in Problem Details body`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 — body.status === 500

- `[P0] should include a non-empty title field in the Problem Details body`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 — body.title is non-empty string

- `[P0] should NOT expose stack trace in Problem Details detail field (NFR6)`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 / NFR6 — no "   at " in response body

- `[P1] should NOT return HTML error page for unhandled exception`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 — Content-Type is not text/html

**Describe: AC2 — NotFoundException returns Problem Details 404** (4 tests)

- `[P0] should return HTTP 404 when NotFoundException is thrown`
  - **Status:** RED — probe endpoint + NotFoundException class missing
  - **Verifies:** AC2 — 404 HTTP status code

- `[P0] should return Content-Type application/problem+json for NotFoundException`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 — RFC 7807 Content-Type

- `[P0] should include status: 404 in Problem Details body for NotFoundException`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 — body.status === 404

- `[P1] should NOT expose stack trace for NotFoundException (NFR6)`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 / NFR6 — no stack trace

**Describe: AC2 — ValidationException returns Problem Details 400** (4 tests)

- `[P0] should return HTTP 400 when ValidationException is thrown`
  - **Status:** RED — probe endpoint + ValidationException class missing
  - **Verifies:** AC2 — 400 HTTP status code

- `[P0] should return Content-Type application/problem+json for ValidationException`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 — RFC 7807 Content-Type

- `[P0] should include status: 400 in Problem Details body for ValidationException`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 — body.status === 400

- `[P1] should NOT expose stack trace for ValidationException (NFR6)`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 / NFR6 — no stack trace

**Describe: AC2 — Problem Details RFC 7807 structural compliance** (3 tests)

- `[P1] Problem Details body for 500 should not contain stackTrace field at root level`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 / NFR6 — no `stackTrace` JSON property

- `[P1] Problem Details body for 500 should not contain exception message that leaks internals`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 / NFR6 — detail field is null for 500 responses

- `[P2] Problem Details response for all probes should be valid JSON`
  - **Status:** RED — probe endpoint missing
  - **Verifies:** AC2 — response body is parseable JSON

---

### Unit Tests — Middleware (12 tests — xUnit)

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (NEW)

**Group: AC2 — Generic unhandled exception → 500** (6 tests)

- `InvokeAsync_GenericException_Returns500StatusCode`
  - **Status:** RED — `ExceptionHandlingMiddleware` constructor signature must be `(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)` + `NotFoundException`/`ValidationException` dispatch not implemented
  - **Verifies:** AC2 — 500 HTTP status on generic exception

- `InvokeAsync_GenericException_SetsContentTypeApplicationProblemJson`
  - **Status:** RED — same reasons as above
  - **Verifies:** AC2 — Content-Type header set correctly

- `InvokeAsync_GenericException_BodyContainsStatus500`
  - **Status:** RED — middleware + domain exceptions not implemented
  - **Verifies:** AC2 — body.status === 500

- `InvokeAsync_GenericException_BodyContainsNonEmptyTitle`
  - **Status:** RED — middleware not updated to full spec
  - **Verifies:** AC2 — title field non-empty

- `InvokeAsync_GenericException_BodyDoesNotContainStackTrace`
  - **Status:** RED — middleware not updated
  - **Verifies:** AC2 / NFR6 — no stack trace in response body

- `InvokeAsync_GenericException_DetailFieldIsNull`
  - **Status:** RED — middleware + domain exceptions missing
  - **Verifies:** AC2 / NFR6 — detail is null for 500

**Group: AC2 — NotFoundException → 404** (4 tests)

- `InvokeAsync_NotFoundException_Returns404StatusCode`
  - **Status:** RED — `NotFoundException` class does not exist in `SiesaAgents.Domain.Exceptions`
  - **Verifies:** AC2 — 404 HTTP status

- `InvokeAsync_NotFoundException_SetsContentTypeApplicationProblemJson`
  - **Status:** RED — same
  - **Verifies:** AC2 — Content-Type header

- `InvokeAsync_NotFoundException_BodyContainsStatus404`
  - **Status:** RED — same
  - **Verifies:** AC2 — body.status === 404

- `InvokeAsync_NotFoundException_BodyDoesNotContainStackTrace`
  - **Status:** RED — same
  - **Verifies:** AC2 / NFR6 — no stack trace

**Group: AC2 — ValidationException → 400** (4 tests)

- `InvokeAsync_ValidationException_Returns400StatusCode`
  - **Status:** RED — `ValidationException` class does not exist in `SiesaAgents.Domain.Exceptions`
  - **Verifies:** AC2 — 400 HTTP status

- `InvokeAsync_ValidationException_SetsContentTypeApplicationProblemJson`
  - **Status:** RED — same
  - **Verifies:** AC2 — Content-Type header

- `InvokeAsync_ValidationException_BodyContainsStatus400`
  - **Status:** RED — same
  - **Verifies:** AC2 — body.status === 400

- `InvokeAsync_ValidationException_BodyDoesNotContainStackTrace`
  - **Status:** RED — same
  - **Verifies:** AC2 / NFR6 — no stack trace

**Group: AC2 — Happy path (no exception)** (1 test)

- `InvokeAsync_NoException_DoesNotAlterResponse`
  - **Status:** RED — middleware constructor signature mismatch
  - **Verifies:** AC2 — middleware passes through cleanly on normal requests

---

### Unit Tests — Infrastructure / AppDbContext (6 tests — xUnit)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` (NEW)

**Group: AC1 / AC3 — AppDbContext instantiation** (2 tests)

- `AppDbContext_WithInMemoryOptions_CanBeInstantiated`
  - **Status:** RED — `AppDbContext` class does not exist in `SiesaAgents.Infrastructure.Data`
  - **Verifies:** AC1 — DbContext is constructable via DI pattern

- `AppDbContext_EnsureCreated_SucceedsWithInMemoryProvider`
  - **Status:** RED — `AppDbContext` class missing
  - **Verifies:** AC1 — EF Core can create the database schema

**Group: AC3 — ApplySnakeCaseNaming** (2 tests)

- `AppDbContext_OnModelCreating_AppliesSnakeCaseNamingToProperties`
  - **Status:** RED — `AppDbContext` missing; `EFCore.NamingConventions` package not installed
  - **Verifies:** AC3 — `ApplySnakeCaseNaming()` does not raise model-building errors

- `AppDbContext_OnModelCreating_ConvertsCreatedAtToSnakeCase`
  - **Status:** RED — same
  - **Verifies:** AC3 — naming convention active and model builds cleanly

**Group: AC1 — Empty initial migration** (2 tests)

- `AppDbContext_InitialMigration_HasNoEntitySets`
  - **Status:** RED — `AppDbContext` missing
  - **Verifies:** AC1 — Story 1.3 creates zero domain entity types (empty migration)

- `AppDbContext_MultipleInstances_AreIndependent`
  - **Status:** RED — `AppDbContext` missing
  - **Verifies:** AC1 — DI registration pattern is correct (no shared state)

---

## Required Implementation Changes (to go GREEN)

### Domain Layer (`SiesaAgents.Domain`)

- [ ] Create `backend/src/SiesaAgents.Domain/Exceptions/NotFoundException.cs`
  ```csharp
  namespace SiesaAgents.Domain.Exceptions;
  public class NotFoundException : Exception
  {
      public NotFoundException(string message) : base(message) { }
      public NotFoundException(string entityName, object id)
          : base($"{entityName} with id '{id}' was not found.") { }
  }
  ```
- [ ] Create `backend/src/SiesaAgents.Domain/Exceptions/ValidationException.cs`
  ```csharp
  namespace SiesaAgents.Domain.Exceptions;
  public class ValidationException : Exception
  {
      public ValidationException(string message) : base(message) { }
  }
  ```

### Infrastructure Layer (`SiesaAgents.Infrastructure`)

- [ ] Add `EFCore.NamingConventions` NuGet package to `SiesaAgents.Infrastructure.csproj`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` NuGet package to `SiesaAgents.API.csproj`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (inherits `DbContext`; calls `modelBuilder.ApplySnakeCaseNaming()` as the last line in `OnModelCreating`)

### API Layer (`SiesaAgents.API`)

- [ ] Update `ExceptionHandlingMiddleware.cs` constructor to accept `(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)` — current constructor uses primary constructor pattern without logger; update to match the IMiddleware or explicit constructor tested by xUnit
- [ ] Add `NotFoundException` → 404 catch block in `ExceptionHandlingMiddleware.InvokeAsync`
- [ ] Add `ValidationException` → 400 catch block in `ExceptionHandlingMiddleware.InvokeAsync`
- [ ] Add test probe endpoints to enable Playwright API tests:
  - `GET /api/v1/test-probes/throw-unhandled` — throws a generic Exception
  - `GET /api/v1/test-probes/throw-not-found` — throws NotFoundException
  - `GET /api/v1/test-probes/throw-validation` — throws ValidationException
- [ ] Register `ExceptionHandlingMiddleware` and `AppDbContext` in `Program.cs`
- [ ] Add `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` (already done per file read)

### Test Project (`SiesaAgents.UnitTests`)

- [ ] `SiesaAgents.UnitTests.csproj` updated to reference API + Infrastructure projects and add `Microsoft.EntityFrameworkCore.InMemory` (already done in this RED phase)

---

## Data Factories Created

None required for Story 1.3. This is a pure backend infrastructure story with no domain entities or user data.

---

## Fixtures Created

### Playwright API Tests

No new fixtures created. Tests use Playwright's `request` context directly (no browser).

---

## Mock Requirements

No mocks required. Tests use:
- **xUnit unit tests:** `DefaultHttpContext` + `MemoryStream` response body (no real HTTP server)
- **Playwright API tests:** Real HTTP requests to `http://localhost:5000` (backend must be running)
- **AppDbContext tests:** `UseInMemoryDatabase` (no PostgreSQL required)

---

## Required `data-testid` Attributes

None. Story 1.3 is a pure backend story with no UI components.

---

## Implementation Checklist (RED → GREEN)

### Phase 1 — Domain exceptions (unblocks middleware tests)

- [ ] Create `NotFoundException.cs` in `SiesaAgents.Domain/Exceptions/`
- [ ] Create `ValidationException.cs` in `SiesaAgents.Domain/Exceptions/`
- [ ] Run unit tests: `dotnet test --filter "ExceptionHandlingMiddlewareTests"`
- [ ] Verify 0 compile errors (tests still fail at runtime — RED expected)

### Phase 2 — AppDbContext (unblocks infrastructure + migration tests)

- [ ] Add `EFCore.NamingConventions` to `SiesaAgents.Infrastructure.csproj`
- [ ] Create `AppDbContext.cs` in `SiesaAgents.Infrastructure/Data/`
- [ ] Run unit tests: `dotnet test --filter "AppDbContextTests"`
- [ ] Tests pass → GREEN for AC1 / AC3 unit coverage

### Phase 3 — Middleware update (unblocks middleware unit tests)

- [ ] Update `ExceptionHandlingMiddleware` to accept logger + handle `NotFoundException` → 404, `ValidationException` → 400
- [ ] Register middleware in `Program.cs`
- [ ] Run unit tests: `dotnet test --filter "ExceptionHandlingMiddlewareTests"`
- [ ] Tests pass → GREEN for AC2 unit coverage

### Phase 4 — Migration (validates AC1 end-to-end)

- [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
- [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `siesa_agents_db` is created and migration folder exists

### Phase 5 — Playwright API tests (validates AC2 HTTP contract)

- [ ] Add test probe endpoints to `SiesaAgents.API`
- [ ] Start backend: `dotnet run --project src/SiesaAgents.API`
- [ ] Run Playwright tests: `pnpm playwright test e2e/tests/api/backend-database-foundation.api.spec.ts`
- [ ] All P0/P1/P2 tests pass → GREEN for AC2 HTTP contract

---

## Running Tests

```bash
# Run all Story 1.3 unit tests (xUnit)
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "Middleware|Infrastructure"

# Run middleware unit tests only
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "ExceptionHandlingMiddlewareTests"

# Run AppDbContext unit tests only
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "AppDbContextTests"

# Run Playwright API tests (requires backend running on :5000)
pnpm playwright test e2e/tests/api/backend-database-foundation.api.spec.ts

# Run with priority filter (P0 only)
pnpm playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "\[P0\]"

# Full run with HTML report
pnpm playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- 15 Playwright API tests in `e2e/tests/api/backend-database-foundation.api.spec.ts` (pre-existing file)
- 12 xUnit middleware unit tests in `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` (NEW)
- 6 xUnit AppDbContext unit tests in `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` (NEW)
- `SiesaAgents.UnitTests.csproj` updated with required package references

**Total tests in RED phase: 33**

**Verification (all tests fail for the right reasons):**
- `ExceptionHandlingMiddlewareTests` — fail to compile: `NotFoundException`/`ValidationException` types not found
- `AppDbContextTests` — fail to compile: `AppDbContext` type not found
- Playwright API tests — fail at runtime: probe endpoints return 404 (not implemented)

---

### GREEN Phase (DEV Team - Next Steps)

**Recommended execution order:**

1. Create Domain exceptions → compile middleware tests (still RED at runtime)
2. Create `AppDbContext` + add `EFCore.NamingConventions` → GREEN for AppDbContext tests
3. Update `ExceptionHandlingMiddleware` constructor + dispatch logic → GREEN for middleware tests
4. Run migrations → AC1 validated end-to-end
5. Add test probe endpoints → GREEN for all Playwright API tests

---

### REFACTOR Phase (After All Tests Pass)

1. Verify all 33 tests pass: `dotnet test` + `pnpm playwright test`
2. Remove test probe endpoints from production code (move to a `TestProbesController` gated by `IsDevelopment()` or remove entirely after E2E coverage)
3. Confirm no `[Column]` or `[Table]` attribute usages in Infrastructure (all names via convention)
4. Run `dotnet build SiesaAgents.sln` — must compile with 0 errors
5. Run `dotnet test` — all unit tests pass
6. Verify empty migration: `Migrations/` folder has `InitialCreate` with no `CreateTable` calls

---

## Knowledge Base References Applied

- **Given-When-Then pattern** — all test descriptions map directly to AC wording
- **No hard waits** — Playwright tests use `request` context (no browser, no waits needed)
- **data-testid** — not applicable (pure backend story)
- **network-first intercepts** — not applicable (unit tests use `DefaultHttpContext`; API tests use direct HTTP)
- **xUnit Arrange/Act/Assert** — consistent pattern across all 18 unit tests

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-05-29
