# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-05-31
**Author:** SiesaTeam
**Primary Test Level:** API + Unit (xUnit)

---

## Story Summary

Configures the PostgreSQL database connection and EF Core infrastructure so that subsequent stories can define entities and run migrations against a working data layer. The story establishes `AppDbContext` with `ApplySnakeCaseNaming()`, registers it in DI, verifies the `ExceptionHandlingMiddleware` returns RFC 7807 Problem Details, and produces an empty initial EF Core migration.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update` from `backend/`, Then the `siesa_agents_db` database is created with no errors and the EF Core `__EFMigrationsHistory` table exists.

2. **AC2** — Given the EF Core migrations folder does not yet exist, When the developer runs `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`, Then the `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created with the initial migration files and an empty `Up()` method.

3. **AC3** — Given an unhandled exception occurs in the backend, When the error reaches the `ExceptionHandlingMiddleware`, Then the HTTP response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with `Content-Type: application/problem+json` and no stack traces exposed (NFR6).

4. **AC4** — Given the backend receives any request that triggers `OnModelCreating`, When EF Core builds the model, Then `ApplySnakeCaseNaming()` is called last in `OnModelCreating` so all future column and table names follow snake_case automatically.

5. **AC5** — Given the `AppDbContext` is registered in DI, When the application starts, Then the connection string is read from `appsettings.Development.json` under `ConnectionStrings:DefaultConnection` and `AppDbContext` is registered via `AddDbContext<AppDbContext>` in `Program.cs`.

6. **AC6** — Given the backend solution is built after this story, When `dotnet build SiesaAgents.sln` is executed, Then all projects compile with zero errors and zero warnings.

---

## Failing Tests Created (RED Phase)

### API Tests (7 tests)

**File:** `e2e/api/backend-database-foundation.api.spec.ts`

- **Test:** `GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response status is 500`
  - **Status:** RED — `GET /__throw-test` returns 404 (endpoint not yet implemented)
  - **Verifies:** AC3 — middleware intercepts unhandled exceptions and returns HTTP 500

- **Test:** `GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN Content-Type is application/problem+json`
  - **Status:** RED — `GET /__throw-test` returns 404 with wrong Content-Type
  - **Verifies:** AC3 — RFC 7807 requires `Content-Type: application/problem+json`

- **Test:** `GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response body contains RFC 7807 "status" field equal to 500`
  - **Status:** RED — body does not contain `{ "status": 500 }` until middleware is verified
  - **Verifies:** AC3 — Problem Details `status` field is 500

- **Test:** `GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response body "title" is "An unexpected error occurred."`
  - **Status:** RED — `title` field absent or wrong value until middleware verified
  - **Verifies:** AC3 — NFR6 standard title text

- **Test:** `GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response body does not expose stack trace (detail is null or absent)`
  - **Status:** RED — `detail` field may contain exception message if middleware is not patched
  - **Verifies:** AC3 + NFR6 — no stack traces or exception messages exposed

- **Test:** `GIVEN an unhandled exception occurs WHEN the error reaches ExceptionHandlingMiddleware THEN response body does not contain exception message in any field`
  - **Status:** RED — raw body may include exception text until middleware is verified
  - **Verifies:** AC3 + NFR6 — complete suppression of internal error details

- **Test:** `GIVEN PostgreSQL is running WHEN the backend starts and receives a health-check request THEN it responds with HTTP 200`
  - **Status:** RED — `GET /health` returns 404 (health endpoint not yet implemented)
  - **Verifies:** AC1 — DB connectivity: backend starts and connects to `siesa_agents_db`

### Unit Tests / xUnit (5 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `GivenValidOptions_WhenConstructingAppDbContext_ThenInstanceIsNotNull`
  - **Status:** RED — `AppDbContext` class does not exist yet in `SiesaAgents.Infrastructure.Data`; project will not compile
  - **Verifies:** AC5 — constructor accepts `DbContextOptions<AppDbContext>` without throwing

- **Test:** `GivenAppDbContext_WhenOnModelCreatingIsTriggered_ThenApplySnakeCaseNamingDoesNotThrow`
  - **Status:** RED — `AppDbContext` class does not exist; `ApplySnakeCaseNaming()` not called
  - **Verifies:** AC4 — `ApplySnakeCaseNaming()` is the last call in `OnModelCreating` and does not throw

- **Test:** `GivenAppDbContext_WhenOnModelCreatingIsTriggered_ThenDatabaseIsCreatedSuccessfully`
  - **Status:** RED — `AppDbContext` class does not exist; `EnsureCreated()` cannot be called
  - **Verifies:** AC4 — `OnModelCreating` completes without errors and database is created

- **Test:** `GivenConfigurationWithConnectionString_WhenAppDbContextIsRegisteredInDI_ThenItCanBeResolved`
  - **Status:** RED — `AppDbContext` does not exist; DI registration pattern cannot be tested
  - **Verifies:** AC5 — `AddDbContext<AppDbContext>` with `GetConnectionString("DefaultConnection")` works

- **Test:** `GivenDIRegistration_WhenResolvingAppDbContext_ThenConnectionStringIsDefaultConnection`
  - **Status:** RED — `AppDbContext` does not exist; connection string retrieval cannot be verified
  - **Verifies:** AC5 — resolved context's connection string matches `ConnectionStrings:DefaultConnection`

- **Test:** `GivenAppDbContext_WhenOnModelCreatingScansAssembly_ThenApplyConfigurationsFromAssemblyDoesNotThrow`
  - **Status:** RED — `AppDbContext` does not exist; `ApplyConfigurationsFromAssembly` cannot be verified
  - **Verifies:** AC4 — `ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())` called without error

---

## Data Factories Created

This story is entirely backend with no user-facing data entities. No new Playwright data factories are required for Story 1.3. The existing `e2e/helpers/data.helper.ts` (buildCliente, buildContacto) is not used by these tests.

---

## Fixtures Created

No new Playwright fixtures are required for Story 1.3. The API tests use Playwright's built-in `request` context directly (no auth, no data setup needed).

**Existing fixture used:** `e2e/fixtures/base.fixture.ts` — not used by API tests for this story.

---

## Mock Requirements

### Backend `/__throw-test` Endpoint (DEV must create)

The API tests for AC3 require a test-only endpoint that intentionally throws an unhandled exception to trigger `ExceptionHandlingMiddleware`.

**Endpoint:** `GET /__throw-test`

**DEV Implementation:**

```csharp
// In Program.cs — add BEFORE app.Run(), guarded for non-production environments
app.MapGet("/__throw-test", () =>
{
    throw new InvalidOperationException("Simulated unhandled exception for ATDD test");
});
```

**Expected behavior:**
- `ExceptionHandlingMiddleware` must catch this and return:
  - HTTP 500
  - `Content-Type: application/problem+json`
  - Body: `{ "status": 500, "title": "An unexpected error occurred.", "detail": null }`

### Backend `/health` Endpoint (DEV must create)

**Endpoint:** `GET /health`

**DEV Implementation:**

```csharp
// In Program.cs — health check endpoint that verifies DB connectivity
app.MapGet("/health", async (AppDbContext db) =>
{
    await db.Database.CanConnectAsync();
    return Results.Ok(new { status = "healthy" });
});
```

**Expected Response:**
```json
{ "status": "healthy" }
```

---

## Required data-testid Attributes

This story is entirely backend (`has_ui_component = FALSE`). No `data-testid` attributes are required.

---

## Implementation Checklist

### Test: ExceptionHandlingMiddleware — all 6 AC3 tests

**File:** `e2e/api/backend-database-foundation.api.spec.ts`

Tasks to make these tests pass:

- [ ] Read `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (created in Story 1.1)
- [ ] Verify middleware sets `Content-Type: application/problem+json`
- [ ] Verify middleware returns `{ "status": 500, "title": "An unexpected error occurred.", "detail": null }`
- [ ] Ensure `detail` field is `null` or omitted — NEVER set to `ex.Message` or `ex.StackTrace` (NFR6)
- [ ] Verify middleware is registered BEFORE routing in `Program.cs`
- [ ] Add `/__throw-test` endpoint in `Program.cs` (test-only route that throws `InvalidOperationException`)
- [ ] Run tests: `npx playwright test e2e/api/backend-database-foundation.api.spec.ts`
- [ ] Verify all 6 middleware tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test: Database Connectivity — AC1 test

**File:** `e2e/api/backend-database-foundation.api.spec.ts`

Tasks to make this test pass:

- [ ] Install `EFCore.NamingConventions` package: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
- [ ] Install `Microsoft.EntityFrameworkCore.Design` in Infrastructure: `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
- [ ] Install `Microsoft.EntityFrameworkCore.Design` in API: `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` per Dev Notes pattern
- [ ] Register `AppDbContext` in `Program.cs` using `AddDbContext<AppDbContext>` with `UseNpgsql`
- [ ] Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure` if not present
- [ ] Verify `appsettings.Development.json` has `ConnectionStrings:DefaultConnection = "Host=localhost;Database=siesa_agents_db;..."`
- [ ] Add `/health` endpoint in `Program.cs` that calls `db.Database.CanConnectAsync()`
- [ ] Run `dotnet ef database update` to create `siesa_agents_db` with `__EFMigrationsHistory`
- [ ] Run test: `npx playwright test e2e/api/backend-database-foundation.api.spec.ts --grep "health"`
- [ ] Verify test passes (green phase)

**Estimated Effort:** 2 hours

---

### Tests: AppDbContext Unit Tests — AC4, AC5 (6 xUnit tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

Tasks to make these tests pass:

- [ ] Install `Microsoft.EntityFrameworkCore.InMemory` in UnitTests project (already added to `.csproj` by ATDD workflow)
- [ ] Add `ProjectReference` to `SiesaAgents.Infrastructure` in `SiesaAgents.UnitTests.csproj` (already added by ATDD workflow)
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:
  - Inherits from `DbContext`
  - Constructor: `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}`
  - Override `OnModelCreating`:
    1. Call `base.OnModelCreating(modelBuilder)`
    2. Call `modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly())`
    3. Call `modelBuilder.ApplySnakeCaseNaming()` LAST
  - No `DbSet<>` properties in this story
- [ ] Run xUnit tests: `dotnet test backend/tests/SiesaAgents.UnitTests/`
- [ ] Verify all 6 unit tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: Migration Files — AC2 (manual verification)

AC2 requires running CLI commands. No automated test covers this directly (migration file existence is verified by inspection after `dotnet ef migrations add`).

Tasks:

- [ ] Run from `backend/`: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
- [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` contains `{timestamp}_InitialCreate.cs`, `{timestamp}_InitialCreate.Designer.cs`, `AppDbContextModelSnapshot.cs`
- [ ] Verify `Up()` method in `{timestamp}_InitialCreate.cs` is empty (no domain tables)
- [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `siesa_agents_db` database exists and `__EFMigrationsHistory` table is present

**Estimated Effort:** 0.5 hours

---

### Test: Build Validation — AC6 (manual verification)

- [ ] Run `dotnet build SiesaAgents.sln` from `backend/`
- [ ] Confirm: `Build succeeded. 0 Warning(s), 0 Error(s)`

**Estimated Effort:** 0.25 hours

---

## Running Tests

```bash
# Run all API acceptance tests for Story 1.3
npx playwright test e2e/api/backend-database-foundation.api.spec.ts

# Run in headed mode (see browser — not applicable for API-only tests)
npx playwright test e2e/api/backend-database-foundation.api.spec.ts --headed

# Debug specific test
npx playwright test e2e/api/backend-database-foundation.api.spec.ts --debug

# Run xUnit unit tests
dotnet test backend/tests/SiesaAgents.UnitTests/

# Run xUnit tests with verbose output
dotnet test backend/tests/SiesaAgents.UnitTests/ --logger "console;verbosity=normal"

# Run specific xUnit test class
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~AppDbContextTests"

# Run full backend build validation
dotnet build backend/SiesaAgents.sln
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All tests written and failing
- xUnit tests fail at compile time: `AppDbContext` does not exist in `SiesaAgents.Infrastructure.Data`
- API tests fail at runtime: `/__throw-test` returns 404; `/health` returns 404
- `SiesaAgents.UnitTests.csproj` updated to include `Microsoft.EntityFrameworkCore.InMemory` and `SiesaAgents.Infrastructure` reference
- No `data-testid` requirements (pure backend story)
- Mock/endpoint requirements documented for DEV team

**Verification:**
- xUnit: `dotnet test` fails with `CS0246: The type or namespace name 'AppDbContext' could not be found`
- Playwright API: tests fail with `Error: expected 500, got 404` and `Error: expected 200, got 404`
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

1. Pick the first failing xUnit test: `GivenValidOptions_WhenConstructingAppDbContext_ThenInstanceIsNotNull`
2. Create `AppDbContext.cs` in `SiesaAgents.Infrastructure/Data/` per Dev Notes pattern
3. Run `dotnet test --filter "GivenValidOptions_WhenConstructingAppDbContext"` — verify green
4. Continue with next xUnit test in order
5. After xUnit tests pass, add `/__throw-test` endpoint and verify AC3 API tests
6. Add `/health` endpoint and verify AC1 API test
7. Run `dotnet ef migrations add InitialCreate` and verify AC2 manually
8. Run `dotnet build SiesaAgents.sln` and verify AC6

**Key Principles:**
- One test at a time
- Minimal implementation (no domain entities in this story — scope note enforced)
- Run tests immediately after each change

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 13 tests pass (7 API + 6 xUnit)
2. Remove `/__throw-test` endpoint or guard it behind `IsDevelopment()` check
3. Ensure `AppDbContext` has no unused imports
4. Confirm `ApplySnakeCaseNaming()` is the absolute last call in `OnModelCreating`
5. Run `dotnet build SiesaAgents.sln` — confirm 0 warnings
6. Run full test suite — confirm nothing regressed

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase:
   - `dotnet test backend/tests/SiesaAgents.UnitTests/`
   - `npx playwright test e2e/api/backend-database-foundation.api.spec.ts`
3. Begin implementation using the implementation checklist above as the guide
4. Work one test at a time (red → green)
5. When all 13 tests pass, refactor for quality
6. When refactoring complete, update story status to `done`

---

## Knowledge Base References Applied

- **fixture-architecture.md** — No fixtures needed for this backend-only story; pattern reviewed for reference
- **data-factories.md** — No new factories needed; `data.helper.ts` exists for future entity stories
- **network-first.md** — API tests use `request` context directly (no page navigation); route interception not applicable
- **test-quality.md** — One assertion per test applied throughout; Given-When-Then structure enforced
- **test-levels-framework.md** — E2E tests excluded (no UI); API tests for middleware behavior; Unit tests for DI and model configuration
- **selector-resilience.md** — Not applicable (no UI selectors); `data-testid` section marked N/A

---

## Test Execution Evidence

**Initial state (RED phase):**

```
xUnit:
  dotnet test → CS0246 compile error: 'AppDbContext' not found in SiesaAgents.Infrastructure.Data
  Expected: 6 tests failing to compile

Playwright API:
  npx playwright test e2e/api/backend-database-foundation.api.spec.ts
  Expected:
    - 6 tests: GET /__throw-test → 404 (should be 500)
    - 1 test:  GET /health → 404 (should be 200)
  Total: 7 tests failing
```

**Summary:**
- Total tests: 13 (7 API + 6 xUnit)
- Passing: 0 (expected in RED phase)
- Failing: 13 (expected)
- Status: RED phase verified

---

## Notes

- This story is entirely backend (`has_ui_component = FALSE`). No E2E browser tests or component tests are created.
- AC2 (migration files) is validated manually via CLI commands; no automated test can verify file creation deterministically in CI without running EF tooling.
- The `/__throw-test` endpoint should be removed or guarded behind `app.Environment.IsDevelopment()` before production deployment.
- The `SiesaAgents.UnitTests.csproj` has been updated by this ATDD workflow to add `Microsoft.EntityFrameworkCore.InMemory` (v10.0.0) and the `SiesaAgents.Infrastructure` project reference.
- Story scope note enforced: no `ClienteEntity` or `ContactoEntity` in this story. Tests reflect the empty migration.

---

**Generated by BMad TEA Agent** — 2026-05-31
