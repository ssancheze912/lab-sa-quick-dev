# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** Unit (xUnit — backend standard)

---

## Story Summary

As a developer, I want the PostgreSQL database connected and the EF Core infrastructure configured, so that subsequent stories can define entities and run migrations against a working data layer.

This story establishes the database foundation: empty initial EF Core migration, DbContext registration in DI, snake_case naming conventions, and exception handling middleware that returns RFC 7807 Problem Details with no stack trace exposure.

**As a** developer
**I want** PostgreSQL connected with EF Core configured (snake_case, Npgsql, empty initial migration)
**So that** subsequent stories can safely define domain entities and run migrations

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update`, Then `siesa_agents_db` is created with no errors and a `__EFMigrationsHistory` table is present.

2. **AC2** — Given the backend solution is initialized, When the developer inspects the Infrastructure project, Then an EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/` containing an initial (empty) migration with no domain table definitions.

3. **AC3** — Given an unhandled exception occurs in the backend, When the error reaches the middleware, Then the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with `Content-Type: application/problem+json` and no stack traces exposed (NFR6).

4. **AC4** — Given the backend starts up, When the DbContext is configured, Then `ApplySnakeCaseNaming()` is called last in `OnModelCreating` so all future column and table names follow snake_case convention automatically — NO manual `[Column]` or `[Table]` attributes are used.

5. **AC5** — Given the `SiesaAgentsDbContext` is registered in DI, When `Program.cs` configures services, Then it reads the connection string from `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` and registers the DbContext with `AddDbContext<SiesaAgentsDbContext>` using the Npgsql provider.

---

## Test Level Selection Rationale

| AC | Test Level | Justification |
|----|-----------|---------------|
| AC1 | Manual / CLI verification | `dotnet ef database update` is a CLI operation; verified by presence of `__EFMigrationsHistory` table after running the command. Cannot be automated without a live PostgreSQL instance — documented as a manual verification step. |
| AC2 | Manual / file-system verification | Migration file existence is verified by file system inspection after `dotnet ef migrations add InitialCreate`. No automated test required. |
| AC3 | Unit (xUnit) | Middleware logic is pure C# — `DefaultHttpContext` is sufficient to test. No HTTP server needed. |
| AC4 | Unit (xUnit) | DbContext model building is testable via InMemory provider + model metadata inspection. |
| AC5 | Unit (xUnit) | DI registration and Npgsql provider configuration are verifiable via `ServiceCollection` and `DbContextOptions`. |

**Note on AC1 and AC2**: These are developer workflow validations (CLI commands and file existence). They are verified once during implementation via `dotnet ef migrations add` and `dotnet ef database update`. If a CI PostgreSQL service is available, AC1 can be validated via a health check integration test in a future story.

---

## Failing Tests Created (RED Phase)

### Unit Tests — AC4 + AC5 (7 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/SiesaAgentsDbContextTests.cs` (193 lines)

**Tests in RED phase — fail until implementation is complete:**

- **Test:** `SiesaAgentsDbContext_WhenInstantiatedWithInMemoryProvider_ShouldNotThrow`
  - **Status:** RED — compile error: `SiesaAgents.Infrastructure` not referenced in UnitTests.csproj; `Microsoft.EntityFrameworkCore.InMemory` package missing
  - **Verifies:** AC4 — DbContext instantiation succeeds (prerequisite for all model tests)

- **Test:** `SiesaAgentsDbContext_OnModelCreating_ShouldCompleteWithoutErrors`
  - **Status:** RED — compile error: same missing project reference and package
  - **Verifies:** AC4 — `OnModelCreating` assembly scan completes without exception

- **Test:** `SiesaAgentsDbContext_Model_ShouldHaveSnakeCaseNamingConventionApplied`
  - **Status:** RED — runtime failure: `EFCore.NamingConventions` package not installed in Infrastructure; `UseSnakeCaseNamingConvention()` not called in `OnModelCreating`
  - **Verifies:** AC4 — `UseSnakeCaseNamingConvention()` is applied and model metadata reflects it

- **Test:** `ServiceCollection_WhenDbContextRegistered_ShouldResolveSiesaAgentsDbContext`
  - **Status:** RED — compile error: missing project reference; runtime: `AddDbContext` not registered in any service registration
  - **Verifies:** AC5 — DbContext is resolvable from DI container when `AddDbContext` is used

- **Test:** `ServiceCollection_WhenDbContextRegistered_ShouldBeRegisteredAsScopedService`
  - **Status:** RED — compile error: missing project reference
  - **Verifies:** AC5 — `AddDbContext` registers DbContext with `ServiceLifetime.Scoped` (EF Core default)

- **Test:** `DbContextOptions_WhenConfiguredWithNpgsql_ShouldHaveNpgsqlProviderRegistered`
  - **Status:** RED — compile error: missing project reference; runtime: `UseNpgsql()` extension not available without `Npgsql.EntityFrameworkCore.PostgreSQL` in test project (or via Infrastructure reference)
  - **Verifies:** AC5 — Npgsql provider is used (not InMemory or SQLite)

### Unit Tests — AC3 (5 tests)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs` (155 lines)

**Tests in RED phase — fail until AC3 implementation is verified:**

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_ShouldSetStatusCode500`
  - **Status:** RED — compile error: `SiesaAgents.API` project not referenced in UnitTests.csproj
  - **Verifies:** AC3 — HTTP 500 status code returned on unhandled exception

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_ShouldSetContentTypeApplicationProblemJson`
  - **Status:** RED — compile error: same missing project reference
  - **Verifies:** AC3 — `Content-Type: application/problem+json` header is set

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_ShouldWriteProblemDetailsBody`
  - **Status:** RED — compile error: same missing project reference
  - **Verifies:** AC3 — Response body is valid RFC 7807 ProblemDetails with `Status = 500` and non-null `Title`

- **Test:** `ExceptionHandlingMiddleware_WhenExceptionThrown_ShouldNotExposeStackTraceInDetail`
  - **Status:** RED — compile error: same missing project reference
  - **Verifies:** AC3 + NFR6 — `Detail = null`; exception message NOT present in response body

- **Test:** `ExceptionHandlingMiddleware_WhenNoExceptionThrown_ShouldPassThroughToNextDelegate`
  - **Status:** RED — compile error: same missing project reference
  - **Verifies:** AC3 (happy path) — Next delegate is called when no exception occurs

---

## Data Factories Created

Not applicable for this story. The backend unit tests in this story use `DefaultHttpContext` for middleware tests and `DbContextOptionsBuilder` for EF Core tests. No domain entities are created — the initial migration is intentionally empty.

---

## Fixtures Created

Not applicable. All tests are self-contained unit tests using the Arrange/Act/Assert pattern. No database fixtures required because:
- Middleware tests use `DefaultHttpContext` (in-memory only)
- DbContext tests use `UseInMemoryDatabase` with unique Guid-named databases (isolation guaranteed)

---

## Mock Requirements

No external service mocks required for this story.

The only external dependency is PostgreSQL (AC1, AC2), which is handled via:
- `UseInMemoryDatabase` in unit tests (no real DB needed)
- Manual CLI execution for AC1/AC2 verification (developer runs `dotnet ef database update`)

---

## Required data-testid Attributes

Not applicable. Story 1.3 is a pure backend story with no frontend UI components. No `data-testid` attributes are required.

---

## Implementation Checklist

### Pre-condition: Add missing project references and packages

**Tasks to unblock test compilation:**

- [ ] Add `Microsoft.EntityFrameworkCore.InMemory` to `SiesaAgents.UnitTests.csproj`:
  ```bash
  dotnet add backend/tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory
  ```
- [ ] Add project reference from UnitTests to Infrastructure in `SiesaAgents.UnitTests.csproj`:
  ```xml
  <ProjectReference Include="..\..\src\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />
  ```
- [ ] Add project reference from UnitTests to API in `SiesaAgents.UnitTests.csproj`:
  ```xml
  <ProjectReference Include="..\..\src\SiesaAgents.API\SiesaAgents.API.csproj" />
  ```

---

### Test: `SiesaAgentsDbContext_Model_ShouldHaveSnakeCaseNamingConventionApplied` (AC4)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/SiesaAgentsDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Add `EFCore.NamingConventions` package to Infrastructure:
  ```bash
  dotnet add backend/src/SiesaAgents.Infrastructure package EFCore.NamingConventions
  ```
- [ ] Open `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs`
- [ ] Update `OnModelCreating` to add `modelBuilder.UseSnakeCaseNamingConvention()` as the LAST call:
  ```csharp
  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
      base.OnModelCreating(modelBuilder);
      modelBuilder.ApplyConfigurationsFromAssembly(typeof(SiesaAgentsDbContext).Assembly);
      modelBuilder.UseSnakeCaseNamingConvention(); // MUST be LAST
  }
  ```
- [ ] Verify no `[Column]`, `[Table]`, or `[Key]` data annotations are used anywhere in the project
- [ ] Run test: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "SiesaAgentsDbContextTests"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: DbContext DI registration tests (AC5)

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/SiesaAgentsDbContextTests.cs`

**Tasks to make these tests pass:**

- [ ] Open `backend/src/SiesaAgents.API/Program.cs`
- [ ] Add required usings:
  ```csharp
  using Microsoft.EntityFrameworkCore;
  using SiesaAgents.Infrastructure.Data;
  ```
- [ ] Register DbContext BEFORE `var app = builder.Build();`:
  ```csharp
  builder.Services.AddDbContext<SiesaAgentsDbContext>(options =>
      options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
  ```
- [ ] Verify `SiesaAgents.API.csproj` references `SiesaAgents.Infrastructure.csproj` (already present)
- [ ] Add `Microsoft.EntityFrameworkCore.Design` to API project (required for EF CLI tooling):
  ```bash
  dotnet add backend/src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design
  ```
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "DbContextDependencyInjectionTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: ExceptionHandlingMiddleware tests (AC3)

**File:** `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make these tests pass:**

- [ ] Verify `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` sets:
  - `context.Response.ContentType = "application/problem+json"`
  - `context.Response.StatusCode = 500`
  - `ProblemDetails { Status = 500, Title = "An unexpected error occurred.", Detail = null }`
- [ ] Verify `app.UseMiddleware<ExceptionHandlingMiddleware>()` is the FIRST middleware in `Program.cs` (before `UseCors`)
- [ ] Run tests: `dotnet test backend/tests/SiesaAgents.UnitTests --filter "ExceptionHandlingMiddlewareTests"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.25 hours (verification only — middleware already implemented)

---

### Manual Verification: AC1 + AC2 (Migration + Database)

**Tasks (executed by developer — not automated):**

- [ ] Ensure PostgreSQL is running locally (`Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`)
- [ ] Install EF CLI if not present: `dotnet tool install --global dotnet-ef`
- [ ] Create initial empty migration (from `backend/` directory):
  ```bash
  dotnet ef migrations add InitialCreate \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API
  ```
- [ ] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` folder was created with:
  - `{timestamp}_InitialCreate.cs` — `Up()` and `Down()` methods are EMPTY (no domain tables)
  - `{timestamp}_InitialCreate.Designer.cs`
  - `SiesaAgentsDbContextModelSnapshot.cs`
- [ ] Apply migration to create the database:
  ```bash
  dotnet ef database update \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API
  ```
- [ ] Connect to PostgreSQL and verify:
  - Database `siesa_agents_db` exists
  - `__EFMigrationsHistory` table exists and contains exactly 1 row
  - No domain tables (`clientes`, `contactos`, etc.) exist — ONLY migration history
- [ ] ✅ AC1 and AC2 verified (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run ALL unit tests for story 1.3
dotnet test backend/tests/SiesaAgents.UnitTests

# Run only DbContext tests (AC4 + AC5)
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~SiesaAgents.UnitTests.Infrastructure"

# Run only ExceptionHandlingMiddleware tests (AC3)
dotnet test backend/tests/SiesaAgents.UnitTests --filter "FullyQualifiedName~SiesaAgents.UnitTests.API"

# Run with verbose output
dotnet test backend/tests/SiesaAgents.UnitTests --verbosity normal

# Run with coverage report
dotnet test backend/tests/SiesaAgents.UnitTests --collect:"XPlat Code Coverage"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (compile-time or runtime errors — not test bugs)
- ✅ Fixtures and factories: N/A for this backend-only story
- ✅ Mock requirements documented: none required
- ✅ data-testid requirements: N/A (no UI)
- ✅ Implementation checklist created with clear ordered tasks

**Verification:**

- Tests fail due to missing `ProjectReference` in UnitTests.csproj (compile-time RED)
- Runtime failures due to missing `EFCore.NamingConventions` package and missing `UseSnakeCaseNamingConvention()` call
- Failures are due to missing implementation — NOT test bugs

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Add missing project references and NuGet packages** (pre-condition — unblocks compilation)
2. **Add `EFCore.NamingConventions` + call `UseSnakeCaseNamingConvention()` in DbContext** (AC4)
3. **Register `AddDbContext<SiesaAgentsDbContext>` in Program.cs** (AC5)
4. **Verify ExceptionHandlingMiddleware** is correctly implemented (AC3 — verification only)
5. **Run `dotnet ef migrations add` + `dotnet ef database update`** (AC1, AC2 — manual)
6. **Run tests** after each step: `dotnet test backend/tests/SiesaAgents.UnitTests`

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Add packages → compile → run → fix → repeat
- Manual DB verification last (requires live PostgreSQL)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 11 unit tests pass
2. Confirm no `[Column]`, `[Table]`, or `[Key]` annotations anywhere in the solution
3. Ensure `UseMiddleware<ExceptionHandlingMiddleware>()` remains the FIRST middleware in `Program.cs`
4. Run `dotnet build` with no warnings (TreatWarningsAsErrors is enabled)
5. Confirm `dotnet test` coverage is >80% for new code in this story

---

## Next Steps

1. **Run failing tests** to confirm RED phase: `dotnet test backend/tests/SiesaAgents.UnitTests`
2. **Follow implementation checklist** top-to-bottom (pre-conditions first)
3. **Work one task at a time** — compile after each change
4. **Manual verification last** — requires live PostgreSQL (AC1, AC2)
5. **When all tests pass + DB verified**, mark story 1.3 status as `in-progress` → `done`

---

## Knowledge Base References Applied

- **test-quality.md** — Deterministic tests using `Guid.NewGuid()` for InMemory database names; isolation via fresh context per test
- **fixture-architecture.md** — Self-contained tests with no shared state; `using` blocks ensure DbContext disposal
- **test-levels-framework.md** — Unit tests selected over E2E/API because middleware and DbContext are pure C# with no HTTP server required
- **selector-resilience.md** — N/A (no UI tests in this story)
- **network-first.md** — N/A (no network interception in this story)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `dotnet test backend/tests/SiesaAgents.UnitTests`

**Expected failure output (before implementation):**

```
Build FAILED.
error CS0246: The type or namespace name 'SiesaAgents' could not be found
  (are you missing a using directive or an assembly reference?)
  → SiesaAgentsDbContextTests.cs
  → ExceptionHandlingMiddlewareTests.cs
```

**Root cause:** `SiesaAgents.Infrastructure` and `SiesaAgents.API` project references are missing from `SiesaAgents.UnitTests.csproj`. This is the expected RED state.

**Summary:**

- Total tests: 11 (6 DbContext/DI + 5 Middleware)
- Passing: 0 (expected)
- Failing/Not compiling: 11 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

1. `SiesaAgentsDbContextTests.cs(43,xx)` — CS0246: `SiesaAgents.Infrastructure.Data.SiesaAgentsDbContext` not found (missing project reference)
2. `ExceptionHandlingMiddlewareTests.cs(37,xx)` — CS0246: `SiesaAgents.API.Middleware.ExceptionHandlingMiddleware` not found (missing project reference)
3. After adding references — runtime: `InvalidOperationException: Unable to resolve service for type 'SiesaAgentsDbContext'` (DbContext not registered in DI)
4. After DI registration — runtime assertion failure: `model.FindAnnotation("Npgsql:NamingConventions") != null` → False (UseSnakeCaseNamingConvention not called)

---

## Notes

- **AC1 and AC2 are manual verification steps**: They require a live PostgreSQL instance and are verified once during the initial developer setup. Automating them in CI requires a PostgreSQL service container — planned for a future story or CI pipeline story.
- **ExceptionHandlingMiddleware is already implemented** per Story 1.1 dev notes. The 5 middleware tests serve as regression guards to ensure the implementation stays correct during refactoring.
- **No domain entities in this story**: The initial migration must be empty. `ClienteEntity` and `ContactoEntity` are created in Epic 2 and Epic 3 respectively. Any domain table in the `InitialCreate` migration is a blocker.
- **TreatWarningsAsErrors is enabled** in both API and Infrastructure `.csproj` files. Ensure no warnings are introduced when adding the `EFCore.NamingConventions` package.

---

## Contact

**Questions or Issues?**

- Refer to `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md` for full task breakdown
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices
- Check `_bmad-output/planning-artifacts/epics/epic-01-foundation.md` for epic-level acceptance criteria

---

**Generated by BMad TEA Agent** — 2026-05-24
