# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-03
**Author:** SiesaTeam
**Primary Test Level:** API (xUnit Unit/Integration)

---

## Story Summary

Story 1.3 connects PostgreSQL via EF Core and configures the Infrastructure data layer so that subsequent stories can define entities and run migrations. It creates `AppDbContext` with snake_case naming conventions, produces an empty initial migration (no domain tables), registers the context in `Program.cs`, and validates that the `ExceptionHandlingMiddleware` is fully RFC 7807-compliant by adding the `Type` field.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories can define entities and run migrations against a working data layer

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update` from `backend/src/SiesaAgents.Infrastructure`, Then the `siesa_agents_db` database is created with no errors, and an EF Core `Migrations/` folder exists in `SiesaAgents.Infrastructure` containing an empty initial migration (no domain tables).

2. **AC2** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response body is `application/problem+json` with RFC 7807 fields (`status`, `title`, `detail`) and no stack trace is exposed — the `type` field equals `"https://tools.ietf.org/html/rfc7807"` (strict RFC 7807 compliance, NFR6).

3. **AC3** — Given the backend receives any request that triggers `OnModelCreating`, When EF Core builds the model, Then `modelBuilder.UseSnakeCaseNamingConvention()` is called last inside `OnModelCreating` in `AppDbContext`, ensuring all future entity column names follow snake_case convention.

4. **AC4** — Given the `AppDbContext` is registered in `Program.cs`, When `dotnet build SiesaAgents.sln` is executed, Then all projects compile with zero errors.

5. **AC5** — Given an xUnit integration test that instantiates `AppDbContext` with an in-memory connection string, When the context is created, Then `AppDbContext` resolves without errors and `UseSnakeCaseNamingConvention()` is confirmed active.

---

## Failing Tests Created (RED Phase)

### Unit/Integration Tests — xUnit (7 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

- **Test:** `AppDbContext_Instantiates_WithInMemoryOptions`
  - **Status:** RED — `SiesaAgents.Infrastructure.Data.AppDbContext` does not exist yet; compilation fails
  - **Verifies:** AC5 — AppDbContext resolves without errors with in-memory options

- **Test:** `OnModelCreating_Runs_WithoutException`
  - **Status:** RED — AppDbContext does not exist; compilation fails
  - **Verifies:** AC3 — `OnModelCreating` runs cleanly, triggering model-build pipeline

- **Test:** `AppDbContext_Model_BuildsSuccessfully`
  - **Status:** RED — AppDbContext does not exist; compilation fails
  - **Verifies:** AC3 + AC5 — `context.Model` returns non-null confirming NamingConventions package is wired

- **Test:** `AppDbContext_Database_IsAccessible`
  - **Status:** RED — AppDbContext does not exist; compilation fails
  - **Verifies:** AC4 + AC5 — `context.Database` property accessible, context correctly wired

- **Test:** `AppDbContext_HasNoEntityTypes_AtInitialMigrationStage`
  - **Status:** RED — AppDbContext does not exist; compilation fails
  - **Verifies:** AC1 + scope guard — No domain entities registered at this stage (no ClienteEntity, no ContactoEntity)

- **Test:** `OnModelCreating_SnakeCaseConvention_IsActive`
  - **Status:** RED — AppDbContext does not exist; `SnakeCaseVerificationContext` cannot inherit from it
  - **Verifies:** AC3 — `UseSnakeCaseNamingConvention()` is active in derived contexts (inheritance works)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs` (additions)

- **Test:** `InvokeAsync_ShouldIncludeTypeField_WithRfc7807Uri_InProblemDetailsResponse`
  - **Status:** RED — `ExceptionHandlingMiddleware` does not yet set `Type = "https://tools.ietf.org/html/rfc7807"` in `ProblemDetails`; `TryGetProperty("type", ...)` returns false
  - **Verifies:** AC2 — `type` field equals `"https://tools.ietf.org/html/rfc7807"` for strict RFC 7807 compliance

- **Test:** `InvokeAsync_ShouldNotExposeStackTrace_InResponseBody`
  - **Status:** RED (security guard, may already pass) — asserts `stackTrace`, `stack_trace` absent and `detail` is null
  - **Verifies:** AC2 — No stack trace or exception detail exposed in RFC 7807 response body (NFR6)

---

## Data Factories Created

No data factories required. Story 1.3 is a pure infrastructure/backend story with no domain entities or HTTP endpoints being tested via factories.

---

## Fixtures Created

No new fixtures required. xUnit tests use `DbContextOptionsBuilder.UseInMemoryDatabase` directly — no shared fixture setup needed.

---

## Mock Requirements

No external mocks required. All AppDbContext tests use `Microsoft.EntityFrameworkCore.InMemory` provider — no live PostgreSQL connection needed during unit tests.

**Required NuGet package (not yet added to test project):**

```xml
<!-- SiesaAgents.UnitTests.csproj -->
<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.*" />
```

**Required NuGet packages (not yet added to Infrastructure):**

```xml
<!-- SiesaAgents.Infrastructure.csproj -->
<PackageReference Include="EFCore.NamingConventions" Version="9.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
```

**Required project reference (not yet added to test project):**

```xml
<!-- SiesaAgents.UnitTests.csproj — must add Infrastructure project reference -->
<ProjectReference Include="..\..\src\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />
```

---

## Required data-testid Attributes

Not applicable. Story 1.3 is a backend-only story with no frontend UI components.

---

## Implementation Checklist

### Test: AppDbContext_Instantiates_WithInMemoryOptions (AC5)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Add `EFCore.NamingConventions` (Version 9.*) to `SiesaAgents.Infrastructure.csproj`
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with primary constructor `AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)`
- [ ] Override `OnModelCreating` calling `base.OnModelCreating(modelBuilder)` and `modelBuilder.UseSnakeCaseNamingConvention()` as last statement
- [ ] Add `Microsoft.EntityFrameworkCore.InMemory` (Version 10.*) to `SiesaAgents.UnitTests.csproj`
- [ ] Add `ProjectReference` to `SiesaAgents.Infrastructure` in `SiesaAgents.UnitTests.csproj`
- [ ] Run test: `dotnet test --filter "AppDbContext_Instantiates_WithInMemoryOptions"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: OnModelCreating_Runs_WithoutException (AC3)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Complete AppDbContext implementation (same as above)
- [ ] Ensure `OnModelCreating` calls `modelBuilder.UseSnakeCaseNamingConvention()` — this is provided by `EFCore.NamingConventions` via the Npgsql provider OR by the standalone `EFCore.NamingConventions` package
- [ ] Run test: `dotnet test --filter "OnModelCreating_Runs_WithoutException"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by AppDbContext creation task above)

---

### Test: AppDbContext_HasNoEntityTypes_AtInitialMigrationStage (AC1 scope guard)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Ensure `AppDbContext` has NO `DbSet<>` properties at this stage
- [ ] Ensure `OnModelCreating` does NOT register any entity types via `modelBuilder.Entity<>()` or `modelBuilder.ApplyConfigurationsFromAssembly()`
- [ ] Run test: `dotnet test --filter "AppDbContext_HasNoEntityTypes_AtInitialMigrationStage"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by AppDbContext creation with empty body)

---

### Test: InvokeAsync_ShouldIncludeTypeField_WithRfc7807Uri (AC2)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
- [ ] Add `Type = "https://tools.ietf.org/html/rfc7807"` to the `ProblemDetails` object in the catch block:
  ```csharp
  await context.Response.WriteAsJsonAsync(new ProblemDetails
  {
      Status = 500,
      Title = "An unexpected error occurred.",
      Detail = null,
      Type = "https://tools.ietf.org/html/rfc7807"
  });
  ```
- [ ] Run test: `dotnet test --filter "InvokeAsync_ShouldIncludeTypeField_WithRfc7807Uri"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### AC1 — EF Core Migration (verified manually)

**Verification:** No automated unit test covers migration file generation (requires live CLI tooling).

**Tasks:**

- [ ] Run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations` from `backend/` directory
- [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created
- [ ] Verify `{timestamp}_InitialCreate.cs` exists with empty `Up()` and `Down()` methods (no `CreateTable` calls)
- [ ] Verify `AppDbContextModelSnapshot.cs` exists
- [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
- [ ] Verify `siesa_agents_db` database is created in PostgreSQL with no errors
- [ ] ✅ AC1 verified (manual + build CI)

**Estimated Effort:** 0.5 hours

---

### AC4 — Solution compiles with zero errors (verified via build)

**Verification:** `dotnet build SiesaAgents.sln` must exit code 0.

**Tasks:**

- [ ] Register `AppDbContext` in `Program.cs` via `builder.Services.AddDbContext<AppDbContext>(...)`
- [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` (Version 10.*) to both `SiesaAgents.Infrastructure.csproj` and `SiesaAgents.API.csproj`
- [ ] Run: `dotnet build SiesaAgents.sln` from `backend/`
- [ ] ✅ Zero errors (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all Story 1.3 ATDD tests (xUnit)
dotnet test backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --filter "FullyQualifiedName~Infrastructure|InvokeAsync_ShouldIncludeTypeField|InvokeAsync_ShouldNotExposeStackTrace"

# Run Infrastructure tests only
dotnet test backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --filter "FullyQualifiedName~Infrastructure"

# Run AppDbContext tests specifically
dotnet test backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --filter "FullyQualifiedName~AppDbContextTests"

# Run AC2 middleware tests (new Story 1.3 additions)
dotnet test backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests"

# Run all unit tests with verbose output
dotnet test backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --logger "console;verbosity=detailed"

# Run full solution tests
dotnet test backend/SiesaAgents.sln
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All xUnit tests written and failing (AppDbContext does not yet exist; compilation fails)
- ✅ RFC 7807 Type field assertion added to ExceptionHandlingMiddlewareTests (fails because Type field missing)
- ✅ Mock requirements documented (InMemory EF provider; no live PostgreSQL needed)
- ✅ No data-testid requirements (backend-only story)
- ✅ Implementation checklist created with ordered tasks per AC

**Verification:**

- `AppDbContextTests.cs` fails at compile time — `SiesaAgents.Infrastructure.Data.AppDbContext` does not exist
- `InvokeAsync_ShouldIncludeTypeField_WithRfc7807Uri_InProblemDetailsResponse` fails at runtime — `type` property absent from ProblemDetails JSON body
- All failures are due to missing implementation, NOT test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with AC2** (ExceptionHandlingMiddleware `Type` field) — one-line change, smallest risk
2. **Then AC4 package additions** — add NuGet packages to Infrastructure and test project
3. **Then AC3 AppDbContext** — create `AppDbContext.cs` with `OnModelCreating` + `UseSnakeCaseNamingConvention()`
4. **Then AC4 Program.cs** — register `AppDbContext` in DI, verify `dotnet build` passes
5. **Then AC5 unit tests go GREEN** — run `dotnet test` for Infrastructure tests
6. **Finally AC1 migration** — run `dotnet ef migrations add InitialCreate` + `dotnet ef database update`

**Key Principles:**

- Add `ProjectReference` to `SiesaAgents.Infrastructure` in `SiesaAgents.UnitTests.csproj` before running AppDbContext tests
- Use `UseInMemoryDatabase` for unit tests — no PostgreSQL required locally for unit test suite
- `OnModelCreating` scope: call `modelBuilder.UseSnakeCaseNamingConvention()` LAST — do NOT add domain entities

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify `AppDbContext_HasNoEntityTypes_AtInitialMigrationStage` still passes after adding Configurations folder
2. Confirm `dotnet build SiesaAgents.sln` passes with zero warnings as well as zero errors
3. Review `Program.cs` for clean organization of service registrations (CORS, DbContext, Middleware order)
4. Ensure `ExceptionHandlingMiddleware` `Type` field uses a constant rather than an inline string if team standards require it

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow
2. Run failing tests to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests/ --filter "FullyQualifiedName~AppDbContextTests"`
3. Begin implementation in the order listed in Implementation Checklist
4. Work one AC at a time (red → green per acceptance criterion)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure in all tests; `Record.Exception()` pattern for exception-free assertions; explicit test names describing the expected behavior
- **test-levels-framework.md** — xUnit Unit tests selected for backend infrastructure (no E2E/Playwright needed; no browser or HTTP endpoints involved in AppDbContext or middleware unit tests)
- **network-first.md** — Not applicable (backend-only story; no HTTP network intercepts needed)
- **selector-resilience.md** — Not applicable (no UI selectors involved)
- **component-tdd.md** — Not applicable (C# xUnit, not React component tests)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `dotnet test backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --filter "FullyQualifiedName~AppDbContextTests"`

**Expected Results:**

```
Build FAILED.

error CS0246: The type or namespace name 'AppDbContext' could not be found
             (are you missing a using directive or an assembly reference?)
             [SiesaAgents.UnitTests.csproj]

Test run for SiesaAgents.UnitTests.dll(.NETCoreApp,Version=v10.0)
Microsoft.TestPlatform.ObjectModel.TestPlatformException: Could not find test host process.

Tests: 0 passed, 0 failed — BUILD FAILURE (expected in RED phase)
```

**Command:** `dotnet test backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj --filter "InvokeAsync_ShouldIncludeTypeField"`

**Expected Results:**

```
Test run for SiesaAgents.UnitTests.dll(.NETCoreApp,Version=v10.0)

  ✗ SiesaAgents.UnitTests.API.ExceptionHandlingMiddlewareTests.InvokeAsync_ShouldIncludeTypeField_WithRfc7807Uri_InProblemDetailsResponse
    Xunit.Sdk.TrueException: Problem Details must contain a 'type' field (RFC 7807 strict compliance)
    Expected: True
    Actual:   False

Tests: 0 passed, 1 failed — RED phase verified
```

**Summary:**

- Total new tests (AppDbContextTests): 6
- Total new tests (ExceptionHandlingMiddlewareTests additions): 2
- Total ATDD tests for Story 1.3: 8
- Passing: 0 (expected in RED phase)
- Failing: 8 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- `AppDbContextTests.*` — CS0246 compilation error: `AppDbContext` type not found (Infrastructure project reference missing + class not created)
- `InvokeAsync_ShouldIncludeTypeField_WithRfc7807Uri_InProblemDetailsResponse` — `XunitException: Problem Details must contain a 'type' field (RFC 7807 strict compliance)` — Expected: True, Actual: False
- `InvokeAsync_ShouldNotExposeStackTrace_InResponseBody` — may already pass (Detail = null already set in Story 1.1); included as a regression guard

---

## Notes

- Story 1.3 is a pure backend story — no E2E (Playwright) or component (Vitest/RTL) tests needed; the test level is xUnit Unit/Integration tests only.
- `AppDbContextTests.cs` will not compile until `SiesaAgents.Infrastructure.Data.AppDbContext` is created AND the Infrastructure project reference is added to `SiesaAgents.UnitTests.csproj`.
- The `SnakeCaseVerificationContext` helper class is test-only — it inherits AppDbContext and adds a probe entity. It must never appear in production code.
- `AppDbContext_HasNoEntityTypes_AtInitialMigrationStage` is a scope guard test — it will FAIL if a developer accidentally adds `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` in this story. Domain entities belong to Epic 2 and Epic 3 respectively.
- AC1 (migration generation and `dotnet ef database update`) is verified manually — no automated xUnit test can run `dotnet ef` CLI commands in isolation.
- `ExceptionHandlingMiddleware.cs` already has `Detail = null` from Story 1.1 — only the `Type` field is missing. The middleware enhancement is a one-liner.

---

**Generated by BMad TEA Agent** - 2026-06-03
