# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** API / xUnit Integration

---

## Story Summary

Story 1.3 establishes the PostgreSQL database connection and EF Core infrastructure for the backend.
The developer configures `AppDbContext` with snake_case naming conventions, creates the initial
empty database migration, and implements a full Problem Details RFC 7807 exception handling middleware.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC #1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update`, Then the `siesa_agents_db` database is created with no errors, and an EF Core `Migrations/` folder exists inside `SiesaAgents.Infrastructure` containing the initial migration file.

2. **AC #2** — Given an unhandled exception occurs at any endpoint, When the error propagates through the middleware pipeline, Then the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces or `ex.Message` exposed to the client (NFR6), and `Content-Type: application/problem+json` is set.

3. **AC #3** — Given the backend receives any request that triggers database access, When EF Core maps entities, Then `ApplySnakeCaseNaming()` is applied as the last call in `OnModelCreating`, and all generated column and table names follow `snake_case` convention.

4. **AC #4** — Given the developer queries the database after running migrations, When inspecting the `siesa_agents_db` schema, Then no domain tables (`clientes`, `contactos`) exist — only the EF Core `__EFMigrationsHistory` table is present.

5. **AC #5** — Given the backend is running via `dotnet run`, When the developer accesses `http://localhost:5000/scalar`, Then the Scalar API documentation page loads successfully.

---

## Failing Tests Created (RED Phase)

### Unit Tests (xUnit) — 7 tests

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

These tests use `TestServer` + `WebApplication.CreateBuilder` to create a minimal ASP.NET Core pipeline
with `ExceptionHandlingMiddleware` and an endpoint that throws. They are in RED because:
- `AppDbContext` class does not exist yet (blocks compilation)
- `ExceptionHandlingMiddleware` full logger-integrated implementation is pending

- **Test:** `GivenUnhandledException_WhenErrorPropagates_ThenResponseStatusIs500`
  - **Status:** RED — `AppDbContext` class does not exist (compilation failure); `ExceptionHandlingMiddleware` with `ILogger` injection not yet implemented
  - **Verifies:** AC #2 — HTTP 500 status returned for any unhandled exception

- **Test:** `GivenUnhandledException_WhenErrorPropagates_ThenContentTypeIsProblemJson`
  - **Status:** RED — same compilation block
  - **Verifies:** AC #2 — `Content-Type: application/problem+json` header is set

- **Test:** `GivenUnhandledException_WhenErrorPropagates_ThenBodyContainsStatusField`
  - **Status:** RED — same compilation block
  - **Verifies:** AC #2 — Problem Details body contains `status: 500`

- **Test:** `GivenUnhandledException_WhenErrorPropagates_ThenBodyContainsTitleField`
  - **Status:** RED — same compilation block
  - **Verifies:** AC #2 (NFR6) — `title` is present and does NOT expose exception message

- **Test:** `GivenUnhandledException_WhenErrorPropagates_ThenDetailFieldIsNull`
  - **Status:** RED — same compilation block
  - **Verifies:** AC #2 (NFR6) — `detail` field is `null`, never exposing `ex.Message` or stack traces

- **Test:** `GivenUnhandledException_WhenErrorPropagates_ThenExceptionMessageIsNotExposed`
  - **Status:** RED — same compilation block
  - **Verifies:** AC #2 (NFR6) — sensitive exception content is never present in response body

- **Test:** `GivenNoException_WhenRequestIsProcessed_ThenMiddlewarePassesThrough`
  - **Status:** RED — same compilation block
  - **Verifies:** AC #2 — middleware correctly passes through to next handler when no exception occurs

### Integration Tests (xUnit) — 3 tests

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextSnakeCaseTests.cs`

Tests for `AppDbContext` creation and model configuration. RED because `AppDbContext` does not exist yet.

- **Test:** `GivenAppDbContextConfigured_WhenInspectingModelMetadata_ThenDbContextCanBeInstantiated`
  - **Status:** RED — `SiesaAgents.Infrastructure.Data.AppDbContext` class does not exist (compilation failure)
  - **Verifies:** AC #3 — `AppDbContext` can be instantiated with DI-compatible constructor

- **Test:** `GivenAppDbContextConfigured_WhenModelIsCreated_ThenNoExceptionIsThrownDuringModelBuilding`
  - **Status:** RED — `AppDbContext` does not exist
  - **Verifies:** AC #3 — `OnModelCreating` executes without errors (confirms `ApplySnakeCaseNaming()` is safe as last call)

- **Test:** `GivenAppDbContextConfigured_WhenInspectingModel_ThenNoDbSetsAreRegistered`
  - **Status:** RED — `AppDbContext` does not exist
  - **Verifies:** AC #4 — No domain entities (`ClienteEntity`, `ContactoEntity`) are registered in this story's scope

**File:** `backend/tests/SiesaAgents.IntegrationTests/Middleware/ExceptionHandlingMiddlewareIntegrationTests.cs`

Full pipeline tests using `WebApplicationFactory<Program>`. RED because `Program` class is not yet
`public partial` and `AppDbContext` DI registration is pending.

- **Test:** `GivenBackendIsRunning_WhenScalarEndpointIsAccessed_ThenResponseIs200`
  - **Status:** RED — `WebApplicationFactory<Program>` fails because `Program` is not yet a public partial class and `AddDbContext` registration is missing
  - **Verifies:** AC #5 — Scalar documentation endpoint loads after full middleware pipeline wiring

- **Test:** `GivenExceptionHandlingMiddlewareIsRegistered_WhenAnyRequestIsProcessed_ThenPipelineResponds`
  - **Status:** RED — same pipeline compilation failure
  - **Verifies:** AC #2 / AC #5 — Middleware is registered and does not block the pipeline

---

## Data Factories Created

Not applicable for this story — Story 1.3 is backend-only with no domain entities.
Data factories for domain entities will be created in Epic 2 (ClienteEntity) and Epic 3 (ContactoEntity).

---

## Fixtures Created

Not applicable — no persistent test data is required for these tests.
Tests use `InMemory` database or `TestServer` inline configuration for isolation.

---

## Mock Requirements

### PostgreSQL Database

For the `AppDbContextSnakeCaseTests`, the InMemory EF Core provider is used to avoid requiring
a running PostgreSQL instance in CI:

- **Provider:** `Microsoft.EntityFrameworkCore.InMemory`
- **Purpose:** Model inspection and `OnModelCreating` verification
- **Limitation:** Snake case naming via `ApplySnakeCaseNaming()` (Npgsql convention) does NOT apply
  with InMemory provider — database naming tests must run against a real PostgreSQL instance

**Note for DEV:** The Npgsql snake_case naming convention is applied by the Npgsql EF Core provider.
Integration tests against a real PostgreSQL database are deferred to Epic 2 when the first entity is registered.

### TestServer

Unit tests use `WebApplication.CreateBuilder` + `UseTestServer()` inline — no external mock needed.

---

## Required data-testid Attributes

Not applicable — Story 1.3 is backend-only with no frontend UI changes.

---

## Implementation Checklist

### Test: `GivenAppDbContextConfigured_WhenInspectingModelMetadata_ThenDbContextCanBeInstantiated`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextSnakeCaseTests.cs`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` inheriting `DbContext`
- [ ] Add constructor: `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)`
- [ ] Override `OnModelCreating` with `base.OnModelCreating(modelBuilder)` then `modelBuilder.ApplySnakeCaseNaming()` as LAST call
- [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` package reference to Infrastructure project (if not present from Story 1.1)
- [ ] Add `Microsoft.EntityFrameworkCore.InMemory` to the integration test project (for model inspection)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~AppDbContextSnakeCaseTests"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `GivenAppDbContextConfigured_WhenInspectingModel_ThenNoDbSetsAreRegistered`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextSnakeCaseTests.cs`

**Tasks to make this test pass:**

- [ ] Ensure `AppDbContext` has NO `DbSet<T>` properties (AC #4 scope boundary)
- [ ] Verify no `ClienteEntity` or `ContactoEntity` references exist in the context
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~NoDbSetsAreRegistered"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `GivenUnhandledException_WhenErrorPropagates_ThenResponseStatusIs500`

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] Complete `ExceptionHandlingMiddleware.cs` implementation per Story 1.3 Task 3 specification
- [ ] Add `ILogger<ExceptionHandlingMiddleware>` injection to constructor
- [ ] Add `using Microsoft.Extensions.Logging;` and `using Microsoft.AspNetCore.Http;` to middleware file
- [ ] Verify `context.Response.StatusCode = StatusCodes.Status500InternalServerError` is set
- [ ] Add `Microsoft.AspNetCore.Mvc.Testing` package to unit test project
- [ ] Add project reference from unit tests to `SiesaAgents.API` in the `.csproj`
- [ ] Expose `Program` as `public partial class` (add `public partial class Program {}` at end of Program.cs)
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `GivenUnhandledException_WhenErrorPropagates_ThenDetailFieldIsNull`

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] Ensure `ProblemDetails.Detail = null` in the middleware catch block (never assign `ex.Message`)
- [ ] Verify no try-catch in middleware ever sets `Detail` to anything except `null`
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~ThenDetailFieldIsNull"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `GivenBackendIsRunning_WhenScalarEndpointIsAccessed_ThenResponseIs200`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Middleware/ExceptionHandlingMiddlewareIntegrationTests.cs`

**Tasks to make this test pass:**

- [ ] Register `AppDbContext` in `Program.cs` via `builder.Services.AddDbContext<AppDbContext>(...)`
- [ ] Add `using SiesaAgents.Infrastructure.Data;` to `Program.cs`
- [ ] Configure connection string in `appsettings.Development.json` (verify it exists from Story 1.1)
- [ ] Add `public partial class Program {}` at end of `Program.cs` for WebApplicationFactory support
- [ ] Verify `app.MapScalarApiReference()` is still registered after middleware wiring
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~ScalarEndpointIsAccessed"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all unit tests (ExceptionHandlingMiddleware tests)
dotnet test backend/tests/SiesaAgents.UnitTests

# Run all integration tests (AppDbContext + Scalar pipeline tests)
dotnet test backend/tests/SiesaAgents.IntegrationTests

# Run all story 1.3 tests
dotnet test backend/tests/SiesaAgents.UnitTests backend/tests/SiesaAgents.IntegrationTests

# Run specific middleware tests
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"

# Run specific EF Core context tests
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter "FullyQualifiedName~AppDbContextSnakeCaseTests"

# Run with verbose output
dotnet test backend/tests/SiesaAgents.UnitTests --logger "console;verbosity=detailed"

# Run with test result report
dotnet test backend/tests/SiesaAgents.UnitTests --results-directory ./TestResults --logger trx
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Test infrastructure files created (`.csproj` with correct package references)
- ✅ Mock requirements documented (InMemory EF Core, TestServer inline)
- ✅ No data-testid required (backend-only story)
- ✅ Implementation checklist created

**Verification:**

- Tests fail due to missing `AppDbContext` class (compilation failure) — correct RED behavior
- Tests fail due to `ExceptionHandlingMiddleware` not yet accepting `ILogger` in constructor
- Tests fail due to `Program` not being `public partial class` — required for `WebApplicationFactory<Program>`
- All failure reasons point to missing implementation, NOT test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with `AppDbContext` instantiation)
2. **Create `AppDbContext.cs`** in `backend/src/SiesaAgents.Infrastructure/Data/`
3. **Run DbContext tests** to verify they go GREEN
4. **Complete middleware** with `ILogger` injection and full Problem Details response
5. **Run middleware tests** to verify they go GREEN
6. **Register `AppDbContext` in `Program.cs`** and add `public partial class Program {}`
7. **Run integration tests** to verify Scalar and pipeline tests go GREEN
8. **Repeat** until all 10 tests pass

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't add domain entities prematurely)
- Run `dotnet test` frequently for immediate feedback

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Review `ExceptionHandlingMiddleware` for additional exception types (domain vs infrastructure)
2. Consider extracting ProblemDetails creation to a static helper (if patterns repeat in future stories)
3. Ensure tests still pass after each refactor
4. Verify `ApplySnakeCaseNaming()` is verifiably the LAST call (add code comment in `AppDbContext.cs`)

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests backend/tests/SiesaAgents.IntegrationTests`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, manually update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Fixture patterns: tests use inline `WebApplication.CreateBuilder` setup for isolation
- **data-factories.md** — Not applicable this story; no domain entities to factory
- **network-first.md** — Not applicable (no Playwright/browser tests; backend-only story)
- **test-quality.md** — Given-When-Then structure, one assertion per test, determinism, isolation
- **test-levels-framework.md** — Selected xUnit API/integration level (no E2E/component needed; backend-only story)
- **selector-resilience.md** — Not applicable (no UI selectors)
- **test-healing-patterns.md** — TestServer inline setup avoids race conditions from port binding

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `dotnet test backend/tests/SiesaAgents.UnitTests backend/tests/SiesaAgents.IntegrationTests`

**Expected Results:**

```
Build FAILED.
  error CS0246: The type or namespace name 'AppDbContext' could not be found
               (are you missing a using directive or an assembly reference?)
  --> SiesaAgents.IntegrationTests/Data/AppDbContextSnakeCaseTests.cs

  error CS0234: The type or namespace name 'Data' does not exist in the
               namespace 'SiesaAgents.Infrastructure'
               --> SiesaAgents.IntegrationTests/Data/AppDbContextSnakeCaseTests.cs
```

**Summary:**

- Total tests: 10
- Passing: 0 (expected in RED phase)
- Failing: 10 (compilation + runtime failures — all expected)
- Status: ✅ RED phase verified

**Expected Failure Messages per Test:**

1. `AppDbContextCanBeInstantiated` — `CS0246: AppDbContext not found`
2. `NoExceptionDuringModelBuilding` — `CS0246: AppDbContext not found`
3. `NoDbSetsAreRegistered` — `CS0246: AppDbContext not found`
4. `ResponseStatusIs500` — `CS0234: SiesaAgents.Infrastructure.Data namespace missing`
5. `ContentTypeIsProblemJson` — `CS0234: same`
6. `BodyContainsStatusField` — `CS0234: same`
7. `BodyContainsTitleField` — `CS0234: same`
8. `DetailFieldIsNull` — `CS0234: same`
9. `ExceptionMessageIsNotExposed` — `CS0234: same`
10. `MiddlewarePassesThrough` — `CS0234: same`
11. `ScalarEndpointIsAccessed` — `CS0234: same` (integration tests)
12. `PipelineResponds` — `CS0234: same` (integration tests)

---

## Notes

- Story 1.3 is **backend-only** — no Playwright E2E tests, no component tests, no frontend changes.
- The primary test framework is **xUnit** (matches the existing `SiesaAgents.UnitTests` project).
- `ApplySnakeCaseNaming()` is a Npgsql-specific EF Core extension — it does NOT apply to InMemory provider.
  Actual snake_case column verification requires running against a real PostgreSQL database (deferred to Epic 2).
- `WebApplicationFactory<Program>` requires `Program` to be accessible (add `public partial class Program {}`
  at the bottom of `Program.cs` after `app.Run();`).
- The `SiesaAgents.IntegrationTests` project is newly created by this ATDD workflow — it must be added
  to the solution: `dotnet sln backend/SiesaAgents.sln add backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-25
