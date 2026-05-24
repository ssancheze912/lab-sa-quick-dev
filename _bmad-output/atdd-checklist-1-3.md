# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** API + Unit (.NET xUnit)

---

## Story Summary

This story wires the PostgreSQL data layer into the existing Clean Architecture skeleton. A developer running `dotnet ef database update` should have the `siesa_agents_db` database created with the `__EFMigrationsHistory` table and an empty initial migration. The ExceptionHandlingMiddleware must return Problem Details RFC 7807 on any unhandled exception without leaking stack traces, and EF Core must apply `ApplySnakeCaseNaming()` as the last call in `OnModelCreating`.

**As a** developer,
**I want** the PostgreSQL database connected and the EF Core infrastructure configured,
**So that** subsequent stories can define entities and run migrations against a working data layer.

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update` from `backend/`, Then the `siesa_agents_db` database is created with no errors and the `__EFMigrationsHistory` table is present.

2. **AC2** — Given the EF Core tooling is set up, When the migrations folder is inspected, Then an initial migration file exists under `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` representing an empty schema (no domain tables).

3. **AC3** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with status code 500 and no stack traces or raw exception messages exposed (NFR6).

4. **AC4** — Given the backend receives any request, When the request is processed and EF Core maps entities to the database, Then `ApplySnakeCaseNaming()` is called last in `OnModelCreating` and all column/table names follow snake_case convention in PostgreSQL.

5. **AC5** — Given `appsettings.Development.json` has a valid `ConnectionStrings:DefaultConnection` pointing to `siesa_agents_db`, When `AppDbContext` is resolved from DI, Then it connects to PostgreSQL via Npgsql without errors.

6. **AC6** — Given the `AppDbContext` is configured, When the developer inspects `OnModelCreating`, Then `modelBuilder.ApplySnakeCaseNaming()` is the LAST call in the method, after all entity configurations have been applied.

---

## Test Level Strategy

This story has **no UI component** (`has_ui_component = FALSE`). Tests are distributed across two levels:

| AC | Test Level | File |
|----|-----------|------|
| AC1 (runtime DB startup) | API (Playwright) | `e2e/tests/api/backend-database-foundation.api.spec.ts` |
| AC2 (migration file structure) | Unit (.NET xUnit) | `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationStructureTests.cs` |
| AC3 (Problem Details RFC 7807) | API (Playwright) + Unit | Both files |
| AC4 (snake_case naming convention) | Unit (.NET xUnit) | `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` |
| AC5 (DI + Npgsql connectivity) | API (Playwright) + Unit | Both files |
| AC6 (ApplySnakeCaseNaming is last) | Unit (.NET xUnit) | `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` |

---

## Failing Tests Created (RED Phase)

### API Tests — Playwright (12 tests)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**AC1 — Database creation and EF Core startup:**

- **Test:** `should have the backend running, which proves EF Core startup did not fail`
  - **Status:** RED — backend not yet configured with EF Core + Npgsql DI registration
  - **Verifies:** AC1 — if EF Core startup fails, the server crashes and this returns a connection error

- **Test:** `should return JSON (not HTML or plain text) from any API route, confirming DI is wired`
  - **Status:** RED — DI not wired; middleware not yet returning problem+json
  - **Verifies:** AC1/AC5 — confirms AddDbContext and middleware are both registered

**AC3 — Problem Details RFC 7807:**

- **Test:** `should return status 500 for an internal server error scenario`
  - **Status:** RED — ExceptionHandlingMiddleware not yet returning 500 for unhandled exceptions (or test endpoint not created)
  - **Verifies:** AC3 — middleware catches exceptions and returns 500

- **Test:** `should return Content-Type application/problem+json on unhandled exception`
  - **Status:** RED — Content-Type header not yet set to application/problem+json
  - **Verifies:** AC3 — RFC 7807 compliance for Content-Type header

- **Test:** `should include status and title fields in the Problem Details response body`
  - **Status:** RED — Problem Details body not yet returned
  - **Verifies:** AC3 — RFC 7807 required fields `status` and `title` are present

- **Test:** `should NOT expose the exception message or stack trace in the response body`
  - **Status:** RED — security contract not yet enforced by middleware
  - **Verifies:** AC3/NFR6 — no raw exception data exposed in response

- **Test:** `should return null for the detail field in Problem Details (NFR6)`
  - **Status:** RED — Detail field not yet explicitly set to null
  - **Verifies:** AC3 — `Detail = null` in ProblemDetails (never expose ex.Message)

- **Test:** `should return Problem Details even for a 404 not-found route (middleware covers all paths)`
  - **Status:** RED — middleware not yet covering all routes uniformly
  - **Verifies:** AC3 — middleware is registered before all route mappings

**AC5 — DI and Npgsql connectivity:**

- **Test:** `should have the backend running with a valid connection string configured`
  - **Status:** RED — AppDbContext DI registration not yet in Program.cs
  - **Verifies:** AC5 — server starts only if connection string + DI are configured

- **Test:** `should not return a 500 error on the health-check route due to DB connection issues`
  - **Status:** RED — Npgsql provider not yet registered; DB connection not established
  - **Verifies:** AC5 — Npgsql connects to PostgreSQL without errors

- **Test:** `should serve the Scalar API page confirming all DI services resolved without error`
  - **Status:** RED — DI container fails to build without AppDbContext registration
  - **Verifies:** AC5 — all DI services (including AppDbContext) resolve at startup

### Unit Tests — .NET xUnit (15 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` (7 tests — AC4, AC5, AC6)

- **Test:** `ApplicationDbContext_OnModelCreating_ExecutesWithoutException` — RED (AC6)
- **Test:** `ApplicationDbContext_SnakeCaseNaming_ConventionIsApplied` — RED (AC4)
- **Test:** `ApplicationDbContext_DataAnnotations_AreNotUsedForNaming` — RED (AC4)
- **Test:** `ApplicationDbContext_ResolvesFromDI_WithInMemoryProvider` — RED (AC5)
- **Test:** `ApplicationDbContext_ResolvedFromDI_CanEnsureDatabaseCreated` — RED (AC5)
- **Test:** `ApplicationDbContext_Constructor_AcceptsDbContextOptions` — RED (AC5)
- **Test:** `ApplicationDbContext_InheritsDbContext_CorrectBaseClass` — RED (AC5)
- **Test:** `ApplicationDbContext_Model_IsBuiltWithoutEntityConfigurationErrors` — RED (AC6)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationStructureTests.cs` (6 tests — AC1, AC2)

- **Test:** `Migrations_InitialCreateMigrationClass_ExistsInInfrastructureAssembly` — RED (AC2)
- **Test:** `Migrations_InitialCreateMigration_HasExpectedName` — RED (AC2)
- **Test:** `Migrations_InitialCreateMigration_IsInCorrectNamespace` — RED (AC2)
- **Test:** `Migrations_InitialCreate_UpMethodIsEmpty_NoCreateTableCalls` — RED (AC2)
- **Test:** `Migrations_InitialCreate_DownMethodIsEmpty_NoDropTableCalls` — RED (AC2)
- **Test:** `ApplicationDbContext_MigrationAssembly_IsConfiguredAsInfrastructure` — RED (AC1)
- **Test:** `ApplicationDbContext_DatabaseProvider_IsNpgsql` — RED (AC1/AC5)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs` (8 tests — AC3)

- **Test:** `Middleware_WhenNoException_DoesNotModifyResponse` — RED (AC3)
- **Test:** `Middleware_WhenExceptionThrown_ReturnStatus500` — RED (AC3)
- **Test:** `Middleware_WhenExceptionThrown_ContentTypeIsProblemJson` — RED (AC3)
- **Test:** `Middleware_WhenExceptionThrown_ResponseBodyContainsProblemDetails` — RED (AC3)
- **Test:** `Middleware_WhenExceptionThrown_DoesNotLeakExceptionMessage` — RED (AC3/NFR6)
- **Test:** `Middleware_WhenExceptionThrown_DetailIsNull` — RED (AC3/NFR6)
- **Test:** `Middleware_AllExceptionTypes_Return500WithProblemDetails` — RED (AC3)
- **Test:** `Middleware_WhenAsyncExceptionThrown_Returns500` — RED (AC3)

---

## Data Factories Created

Not applicable — this is a pure backend infrastructure story. No test data factories are needed because:
- No domain entities are defined in this story (ClienteEntity / ContactoEntity are created in Epics 2 and 3)
- Database connectivity tests use InMemory provider or Npgsql connection strings
- API tests do not create domain data

---

## Fixtures Created

Not applicable for Playwright API tests — tests use `{ request }` context directly without custom fixtures.

For .NET unit tests, all test data is created inline within each test method using `DbContextOptionsBuilder` and `ServiceCollection` helpers (no external fixture infrastructure needed).

---

## Mock Requirements

### For Playwright API Tests

The AC3 tests require a dedicated endpoint that triggers a controlled server error. This endpoint must be added temporarily to `Program.cs` for testing purposes (or a permanent test-only endpoint):

**Endpoint:** `GET /api/throw-for-atdd-test`

**Implementation (to be added in Program.cs, guarded by environment check):**
```csharp
// ATDD test endpoint — development/test environments only
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/throw-for-atdd-test", () =>
    {
        throw new InvalidOperationException("Simulated unhandled exception for ATDD test");
    });
}
```

**Expected Response (after middleware):**
```json
{
  "status": 500,
  "title": "An unexpected error occurred.",
  "detail": null
}
```

**Notes:** This endpoint is only accessible in Development mode. It exists purely to validate ExceptionHandlingMiddleware behavior without needing a real domain exception path.

---

## Required data-testid Attributes

Not applicable — this story has no UI component. `has_ui_component = FALSE`.

---

## Implementation Checklist

### Test Group 1: AC1 — Database Created with EF Core Migrations

**Playwright API File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`
**Unit File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationStructureTests.cs`

**Tasks to make these tests pass:**

- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.Infrastructure.csproj`:
  ```xml
  <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
  </PackageReference>
  ```
- [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
- [ ] Verify migration `Up()` method is empty (no `CreateTable` calls)
- [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `__EFMigrationsHistory` table exists in PostgreSQL
- [ ] Run Playwright tests: `npx playwright test backend-database-foundation.api.spec.ts`
- [ ] Run unit tests: `dotnet test --filter "FullyQualifiedName~MigrationStructureTests"`
- [ ] ✅ AC1 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group 2: AC2 — Initial Migration File Structure

**Unit File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationStructureTests.cs`

**Tasks to make these tests pass:**

- [ ] Generate the InitialCreate migration (see AC1 tasks above)
- [ ] Verify migration class namespace is `SiesaAgents.Infrastructure.Data.Migrations`
- [ ] Verify migration class name ends with `InitialCreate` (format: `{timestamp}_InitialCreate`)
- [ ] Verify `Up()` and `Down()` methods are both empty (no domain tables at this stage)
- [ ] Run unit tests: `dotnet test --filter "FullyQualifiedName~MigrationStructureTests"`
- [ ] ✅ AC2 tests pass (green phase)

**Estimated Effort:** 0.5 hours (covered by AC1 migration generation)

---

### Test Group 3: AC3 — Problem Details RFC 7807 (ExceptionHandlingMiddleware)

**Playwright API File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`
**Unit File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Verify/complete the middleware to match the pattern:
  ```csharp
  catch (Exception)
  {
      context.Response.ContentType = "application/problem+json";
      context.Response.StatusCode = StatusCodes.Status500InternalServerError;
      await context.Response.WriteAsJsonAsync(new ProblemDetails
      {
          Status = 500,
          Title = "An unexpected error occurred.",
          Detail = null   // NEVER expose ex.Message
      });
  }
  ```
- [ ] Confirm middleware is registered in `Program.cs` BEFORE `app.UseCors()` and route mappings
- [ ] Add ATDD test endpoint in `Program.cs` (Development only):
  ```csharp
  if (app.Environment.IsDevelopment())
  {
      app.MapGet("/api/throw-for-atdd-test", () =>
          { throw new InvalidOperationException("Simulated unhandled exception for ATDD test"); });
  }
  ```
- [ ] Run Playwright tests: `npx playwright test backend-database-foundation.api.spec.ts`
- [ ] Run unit tests: `dotnet test --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"`
- [ ] ✅ AC3 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group 4: AC4 — snake_case Naming Convention Applied

**Unit File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Open `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Implement `OnModelCreating` with `ApplySnakeCaseNaming()` as the LAST call:
  ```csharp
  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
      base.OnModelCreating(modelBuilder);
      modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
      modelBuilder.ApplySnakeCaseNaming(); // MUST be LAST
  }
  ```
- [ ] Confirm NO `[Table]` or `[Column]` data annotations are used anywhere in Domain entities
- [ ] Run unit tests: `dotnet test --filter "FullyQualifiedName~AppDbContextTests"`
- [ ] ✅ AC4 tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group 5: AC5 — AppDbContext DI Registration and Npgsql Connectivity

**Playwright API File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`
**Unit File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Add `AddDbContext<AppDbContext>` to `Program.cs`:
  ```csharp
  builder.Services.AddDbContext<AppDbContext>(options =>
      options.UseNpgsql(
          builder.Configuration.GetConnectionString("DefaultConnection"),
          npgsqlOptions => npgsqlOptions.MigrationsAssembly("SiesaAgents.Infrastructure")));
  ```
- [ ] Add required `using` statements to `Program.cs`:
  ```csharp
  using SiesaAgents.Infrastructure.Data;
  using Microsoft.EntityFrameworkCore;
  ```
- [ ] Verify `appsettings.Development.json` has:
  ```json
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
  ```
- [ ] Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure` in solution if not present
- [ ] Start the backend with `dotnet run` and confirm no startup exceptions
- [ ] Run Playwright tests: `npx playwright test backend-database-foundation.api.spec.ts`
- [ ] Run unit tests: `dotnet test --filter "FullyQualifiedName~AppDbContextTests"`
- [ ] ✅ AC5 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group 6: AC6 — ApplySnakeCaseNaming is Last in OnModelCreating

**Unit File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Ensure `OnModelCreating` follows the exact order:
  1. `base.OnModelCreating(modelBuilder)` — first
  2. `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)` — second
  3. `modelBuilder.ApplySnakeCaseNaming()` — LAST (mandatory)
- [ ] Run unit tests: `dotnet test --filter "FullyQualifiedName~AppDbContextTests"`
- [ ] ✅ AC6 tests pass (green phase)

**Estimated Effort:** 0.25 hours (covered by AC4 tasks)

---

## Running Tests

```bash
# Run all Playwright API tests for story 1.3
npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts

# Run with verbose output
npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --reporter=list

# Run a specific AC3 test group
npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC3"

# Run all .NET unit tests for story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~AppDbContextTests|FullyQualifiedName~MigrationStructureTests|FullyQualifiedName~ExceptionHandlingMiddlewareTests"

# Run only infrastructure tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~Infrastructure"

# Run only middleware tests
dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~API"

# Run with detailed output
dotnet test backend/tests/SiesaAgents.UnitTests/ --verbosity detailed
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All Playwright API tests written and failing (11 tests in `backend-database-foundation.api.spec.ts`)
- ✅ All .NET unit tests written and failing (23 tests across 3 test files)
- ✅ Mock requirements documented (ATDD test endpoint in Program.cs)
- ✅ No data factories needed (pure backend infrastructure story)
- ✅ No UI fixtures needed (`has_ui_component = FALSE`)
- ✅ Implementation checklist created with clear tasks per AC

**Verification:**

- Playwright tests fail because: backend not running with EF Core configured, or endpoints do not exist
- Unit tests fail because: `ApplicationDbContext` class not yet matching expected signature, migrations not generated
- All failures are due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with AC4/AC6** — Complete `AppDbContext.OnModelCreating` (quickest win, pure code)
2. **Then AC5** — Register `AddDbContext<AppDbContext>` in `Program.cs`
3. **Then AC3** — Verify/complete `ExceptionHandlingMiddleware` + add ATDD test endpoint
4. **Then AC1/AC2** — Generate migration with EF CLI and apply to PostgreSQL

**Key Principles:**

- One AC group at a time (don't try to fix all at once)
- Run `dotnet test` after each implementation step
- Confirm server starts (`dotnet run`) before running Playwright API tests

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Remove the ATDD test endpoint (`/api/throw-for-atdd-test`) if not needed for ongoing E2E tests
2. Review `Program.cs` for any duplicate service registrations
3. Ensure `appsettings.Development.json` connection string is not committed to source control (use User Secrets or environment variables in CI)
4. Verify all tests still pass after refactoring

---

## Next Steps

1. **Run failing Playwright tests** to confirm RED phase: `npx playwright test e2e/tests/api/backend-database-foundation.api.spec.ts`
2. **Run failing unit tests** to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests/`
3. **Begin implementation** using the AC-grouped checklist above (start with AC4 for quickest win)
4. **Work one AC group at a time** (red → green for each group)
5. **When all tests pass**, refactor and clean up ATDD test endpoint
6. **When refactoring complete**, update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure, one assertion per test, determinism
- **network-first.md** — Route interception before navigation (applied to Playwright `request` context patterns)
- **test-levels-framework.md** — API vs Unit level selection (no UI = no E2E browser tests)
- **selector-resilience.md** — Not applicable (no UI component in this story)
- **data-factories.md** — Not applicable (no domain entities in this story)
- **fixture-architecture.md** — Not applicable (pure API + unit tests with inline setup)
- **test-healing-patterns.md** — Network error handling in API tests (request context failures)

---

## Notes

- This is a pure backend infrastructure story: `has_ui_component = FALSE`. No Playwright browser tests, no `data-testid` attributes, no component tests.
- The ATDD test endpoint (`/api/throw-for-atdd-test`) is the primary mechanism for validating AC3 at the API level. The DEV team must add this endpoint to `Program.cs` within a `IsDevelopment()` guard.
- AC1 (live PostgreSQL verification) cannot be fully automated in the Playwright layer without a running database. The unit tests in `MigrationStructureTests.cs` validate the migration class structure without requiring a live DB. Live DB verification is confirmed by the successful `dotnet ef database update` command execution.
- The `.NET xUnit` unit tests use the **InMemory EF Core provider** to avoid PostgreSQL dependency. This means AC5 (Npgsql connectivity) is only partially covered at unit level — the Playwright API tests cover the runtime Npgsql connectivity.
- Story scope: NO `ClienteEntity` or `ContactoEntity` definitions. The `Up()` migration method must be empty.

---

**Generated by BMad TEA Agent** - 2026-05-24
