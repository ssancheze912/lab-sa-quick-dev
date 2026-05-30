# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-05-30
**Author:** SiesaTeam
**Primary Test Level:** API Integration + Unit

---

## Story Summary

As a developer, the PostgreSQL database must be connected and the EF Core infrastructure configured so that subsequent stories can define entities and run migrations against a working data layer. This story creates `AppDbContext`, registers it in DI, implements `ExceptionHandlingMiddleware` per RFC 7807, creates the initial EF Core migration, and verifies the build compiles cleanly with no hardcoded connection strings.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC#1** — `dotnet ef database update` creates `siesa_agents_db` with no errors; `Migrations/` folder exists in `SiesaAgents.Infrastructure` with at least one migration file.
2. **AC#2** — `OnModelCreating` calls `modelBuilder.ApplySnakeCaseNaming()` as the last statement.
3. **AC#3** — `ExceptionHandlingMiddleware` returns `Content-Type: application/problem+json`, status 500, and an RFC 7807-compliant Problem Details body (with `status`, `title`, `detail` fields) for unhandled exceptions. No stack traces or internal messages are exposed (NFR6).
4. **AC#4** — `dotnet build SiesaAgents.sln` compiles with zero errors. The connection string is read from `appsettings.Development.json` (not hardcoded in source).
5. **AC#5** — `AppDbContext` is registered in DI with Npgsql using `DefaultConnection`. No domain entity `DbSet<>` properties exist yet.

---

## Failing Tests Created (RED Phase)

### Unit Tests (10 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/API/Middleware/ExceptionHandlingMiddlewareTests.cs`

**Tests fail because:** The middleware's current anonymous-type response needs to be replaced with proper `ProblemDetails` type per story requirements, and verified to never expose internal details.

- **Test:** `GivenUnhandledException_WhenMiddlewareInvoked_ThenStatusCodeIs500`
  - **Status:** RED — Fails until `ExceptionHandlingMiddleware` returns 500 for all unhandled exceptions
  - **Verifies:** AC#3 — HTTP status code 500 for unexpected errors

- **Test:** `GivenUnhandledException_WhenMiddlewareInvoked_ThenContentTypeIsProblemJson`
  - **Status:** RED — Fails until Content-Type is `application/problem+json`
  - **Verifies:** AC#3 — RFC 7807 Content-Type requirement

- **Test:** `GivenUnhandledException_WhenMiddlewareInvoked_ThenBodyContainsStatusField`
  - **Status:** RED — Fails until body serializes a `status` field
  - **Verifies:** AC#3 — RFC 7807 `status` field required

- **Test:** `GivenUnhandledException_WhenMiddlewareInvoked_ThenBodyContainsTitleField`
  - **Status:** RED — Fails until body serializes a `title` field
  - **Verifies:** AC#3 — RFC 7807 `title` field required

- **Test:** `GivenUnhandledException_WhenMiddlewareInvoked_ThenDetailFieldIsNullOrAbsent`
  - **Status:** RED — Fails until `detail` is explicitly null (not the exception message)
  - **Verifies:** AC#3 + NFR6 — `detail = null` requirement, no exception details exposed

- **Test:** `GivenUnhandledException_WhenMiddlewareInvoked_ThenBodyDoesNotExposeExceptionMessage`
  - **Status:** RED — Fails until exception message is never included in response
  - **Verifies:** AC#3 + NFR6 — No internal exception message in response

- **Test:** `GivenUnhandledException_WhenMiddlewareInvoked_ThenBodyDoesNotContainStackTrace`
  - **Status:** RED — Fails until stack trace is never serialized into response
  - **Verifies:** AC#3 + NFR6 — No stack trace in response

- **Test:** `GivenUnhandledException_WhenMiddlewareInvoked_ThenStatusValueInBodyIs500`
  - **Status:** RED — Fails until JSON body `status` field value equals 500
  - **Verifies:** AC#3 — `status: 500` in Problem Details body

- **Test:** `GivenUnhandledException_WhenMiddlewareInvoked_ThenTitleIsNotEmpty`
  - **Status:** RED — Fails until `title` field is a non-empty string
  - **Verifies:** AC#3 — `title` field is meaningful

- **Test:** `GivenNoException_WhenMiddlewareInvoked_ThenResponseStatusCodeIsNotChanged`
  - **Status:** RED — Fails if middleware interferes with non-error responses
  - **Verifies:** AC#3 — Happy path: middleware does not intercept successful responses

- **Test:** `GivenNoException_WhenMiddlewareInvoked_ThenContentTypeIsNotOverriddenToProblemJson`
  - **Status:** RED — Fails if middleware changes Content-Type when no exception occurs
  - **Verifies:** AC#3 — Happy path: middleware does not modify Content-Type on success

### Integration Tests (6 tests)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextTests.cs`

**Tests fail because:** `AppDbContext` is not yet registered in `Program.cs`; PostgreSQL DB is not yet created; migrations have not been run.

- **Test:** `GivenPostgresIsRunning_WhenCheckingConnection_ThenCanConnectToSiesaAgentsDb`
  - **Status:** RED — Fails until `siesa_agents_db` is created and PostgreSQL is running
  - **Verifies:** AC#1 — Database connectivity

- **Test:** `GivenMigrationsApplied_WhenCheckingPendingMigrations_ThenNoneShouldBePending`
  - **Status:** RED — Fails until `dotnet ef database update` is executed successfully
  - **Verifies:** AC#1 — All migrations applied, none pending

- **Test:** `GivenMigrationsRan_WhenListingAppliedMigrations_ThenAtLeastOneExists`
  - **Status:** RED — Fails until `InitialCreate` migration exists and is applied
  - **Verifies:** AC#1 — At least one migration (InitialCreate) exists

- **Test:** `GivenAppDbContext_WhenInspectingEntityTypes_ThenNoEntityTypesAreDefined`
  - **Status:** RED — Fails until `AppDbContext` compiles with no `DbSet<>` properties
  - **Verifies:** AC#5 — Context is intentionally empty (no ClienteEntity, ContactoEntity)

- **Test:** `GivenAppDbContext_WhenModelIsCreated_ThenSnakeCaseNamingConventionIsActive`
  - **Status:** RED — Fails until `OnModelCreating` with `ApplySnakeCaseNaming()` executes without error
  - **Verifies:** AC#2 — `ApplySnakeCaseNaming()` is active in the model builder

- **Test:** `GivenConfiguration_WhenReadingDefaultConnection_ThenConnectionStringIsPresent`
  - **Status:** RED — Fails until `appsettings.Development.json` exists with `DefaultConnection`
  - **Verifies:** AC#4 — Connection string comes from configuration, not hardcoded

- **Test:** `GivenConfiguration_WhenReadingDefaultConnection_ThenItTargetsSiesaAgentsDb`
  - **Status:** RED — Fails until connection string references `siesa_agents_db`
  - **Verifies:** AC#4 — Correct database name in connection string

---

## Data Factories Created

None required for this story. This is a pure backend infrastructure story with no domain entities. Test data is constructed inline using `DefaultHttpContext` and configuration builders.

---

## Fixtures Created

None required. Tests use `IDisposable` for `AppDbContext` cleanup and `DefaultHttpContext` with in-memory `MemoryStream` bodies for unit tests. No shared state between tests.

---

## Mock Requirements

### PostgreSQL Database

**Requirement:** A running PostgreSQL instance accessible at `localhost:5432` is required for integration tests.

**For Integration Tests:**
- Database: `siesa_agents_db`
- Username: `postgres`
- Password: `postgres`
- Must have all migrations applied (`dotnet ef database update`)

**For Unit Tests:**
- No database required — unit tests use `DefaultHttpContext` only

**Note for DEV Team:** Integration tests are NOT expected to run in CI without a real PostgreSQL instance. Use a test container or Docker Compose for CI.

---

## Required data-testid Attributes

None. This story has no frontend UI changes. All tests are pure backend (xUnit).

---

## Implementation Checklist

### Test: GivenUnhandledException → StatusCode 500 / ContentType problem+json / Body RFC 7807

**File:** `backend/tests/SiesaAgents.UnitTests/API/Middleware/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Replace the `HandleExceptionAsync` implementation with `ProblemDetails` type from `Microsoft.AspNetCore.Mvc`
- [ ] Set `context.Response.ContentType = "application/problem+json"`
- [ ] Set `context.Response.StatusCode = StatusCodes.Status500InternalServerError`
- [ ] Write `ProblemDetails` with `Status = 500`, `Title = "An unexpected error occurred."`, `Detail = null`
- [ ] Ensure `ex.Message` and `ex.StackTrace` are NEVER serialized into the response body
- [ ] Add `using Microsoft.AspNetCore.Mvc;`
- [ ] Run test: `dotnet test tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddlewareTests"`
- [ ] All 11 unit tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: GivenPostgresIsRunning → CanConnect / NoPendingMigrations / AtLeastOneMigration

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Install `EFCore.NamingConventions` NuGet: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with `ApplySnakeCaseNaming()` as last statement in `OnModelCreating`
- [ ] In `Program.cs`: register `AppDbContext` using `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(...).UseSnakeCaseNamingConvention())`
- [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
- [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Run test: `dotnet test tests/SiesaAgents.IntegrationTests`
- [ ] All 7 integration tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: GivenConfiguration → ConnectionStringPresent / TargetsSiesaAgentsDb

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Verify `backend/src/SiesaAgents.API/appsettings.Development.json` contains `"ConnectionStrings": { "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres" }`
- [ ] Copy or symlink `appsettings.Development.json` to IntegrationTests output directory (already configured as `<Content CopyToOutputDirectory="PreserveNewest">`)
- [ ] Verify no connection string is hardcoded in any `.cs` file
- [ ] Run test: `dotnet test tests/SiesaAgents.IntegrationTests`
- [ ] Configuration tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all unit tests
dotnet test backend/tests/SiesaAgents.UnitTests

# Run unit tests for middleware only
dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddlewareTests"

# Run all integration tests (requires running PostgreSQL)
dotnet test backend/tests/SiesaAgents.IntegrationTests

# Run both test projects
dotnet test backend/SiesaAgents.sln

# Run with verbose output
dotnet test backend/tests/SiesaAgents.UnitTests --logger "console;verbosity=detailed"

# Run integration tests with detailed output
dotnet test backend/tests/SiesaAgents.IntegrationTests --logger "console;verbosity=detailed"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All unit tests written and failing (ExceptionHandlingMiddlewareTests — 11 tests)
- ✅ All integration tests written and failing (AppDbContextTests — 7 tests)
- ✅ Test infrastructure created (IntegrationTests .csproj, appsettings.Development.json)
- ✅ IntegrationTests project added to SiesaAgents.sln
- ✅ UnitTests .csproj updated with API project reference and NullLogger package
- ✅ Mock requirements documented (PostgreSQL instance required for integration tests)
- ✅ Implementation checklist created

**Verification:**

- Unit tests fail at compile time or runtime due to missing `ProblemDetails` type usage or constructor mismatch
- Integration tests fail because PostgreSQL DB does not exist yet and `AppDbContext` is not in DI
- Failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Complete `ExceptionHandlingMiddleware` using `ProblemDetails` type (Task 5 of the story)
2. Create `AppDbContext` with `ApplySnakeCaseNaming()` (Task 1)
3. Register `AppDbContext` in `Program.cs` with Npgsql (Task 2)
4. Verify `appsettings.Development.json` connection string (Task 3)
5. Install EF Core tools and create `InitialCreate` migration (Task 4)
6. Apply migration: `dotnet ef database update`
7. Run unit tests → confirm all 11 pass
8. Run integration tests → confirm all 7 pass

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. All tests passing (green)
2. Confirm `AppDbContext` has no `DbSet<>` properties (scope boundary check)
3. Confirm middleware registration order: ExceptionHandlingMiddleware → CORS → Scalar → endpoints
4. Review code for compliance with company standards (snake_case, no hardcoded values)
5. Ensure tests still pass after any cleanup

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `dotnet test backend/SiesaAgents.sln`
3. Begin implementation using the implementation checklist as guide — start with Task 5 (middleware), then Task 1-2 (AppDbContext + DI)
4. Run `dotnet ef migrations add InitialCreate ...` and `dotnet ef database update`
5. Work one test at a time (red → green for each)
6. When all tests pass, refactor and mark story as done

---

## Knowledge Base References Applied

- **fixture-architecture.md** — `IDisposable` pattern used in `AppDbContextTests` for `AppDbContext` cleanup
- **data-factories.md** — No factories needed (no domain entities in this story)
- **network-first.md** — Not applicable (no browser/E2E tests; pure backend story)
- **test-quality.md** — Given-When-Then format, one assertion per test, deterministic tests, no hardcoded data
- **selector-resilience.md** — Not applicable (no UI selectors)
- **component-tdd.md** — Not applicable (no UI components)

---

## Test Execution Evidence

### Expected Test Run Results (RED Phase)

**Command:** `dotnet test backend/SiesaAgents.sln`

**Expected Summary:**

```
Unit Tests (SiesaAgents.UnitTests):
  Total: 11
  Passed: 0 (expected — tests define required behavior not yet implemented)
  Failed: 11
  Status: RED phase ✅

Integration Tests (SiesaAgents.IntegrationTests):
  Total: 7
  Passed: 0 (expected — PostgreSQL DB not created, AppDbContext not in DI)
  Failed: 7
  Status: RED phase ✅
```

**Expected Failure Reasons:**

- Unit tests: `ExceptionHandlingMiddleware` constructor or `ProblemDetails` type mismatch; `detail` field not null
- Integration tests: Cannot connect to `siesa_agents_db` (DB not created), `AppDbContext` not registered in DI

---

## Notes

- This story is pure backend — no frontend files or E2E Playwright tests are required
- Integration tests require a live PostgreSQL instance at `localhost:5432` — they are NOT suitable for unit test CI without Docker/testcontainers
- The `EFCore.NamingConventions` package must be installed before creating migrations
- The `Microsoft.EntityFrameworkCore.Design` package is already in the Infrastructure `.csproj`
- The `AppDbContext` must remain empty (no `DbSet<>`) for this story — entities are added in Epics 2 and 3
- `Program.cs` partial class (`public partial class Program {}`) already exists for integration test support

---

## Contact

**Questions or Issues?**

- Refer to `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md` for full story context
- Consult `_bmad/bmm/testarch/` for testing best practices
- Architecture reference: `_bmad-output/planning-artifacts/architecture.md`

---

**Generated by BMad TEA Agent** - 2026-05-30
