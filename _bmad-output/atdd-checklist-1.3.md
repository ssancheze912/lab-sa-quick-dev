# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-09
**Author:** SiesaTeam
**Primary Test Level:** API Integration (xUnit + WebApplicationFactory&lt;Program&gt;)
**Story file:** `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`

---

## Story Summary

Story 1.3 wires up the EF Core 10 + Npgsql infrastructure for the backend. It creates an empty `AppDbContext` (no domain entities yet), registers it in DI, scaffolds the design-time factory required by `dotnet ef`, generates an empty `InitialCreate` migration, and adds a dev-only `/api/v1/test-error` endpoint so the RFC 7807 Problem Details middleware (already created in Story 1.1) can be verified end-to-end.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured
**So that** subsequent stories (Epic 2 / Epic 3) can define entities and run migrations against a working data layer.

---

## Acceptance Criteria

1. **AC #1** — `dotnet ef database update` creates `siesa_agents_db` and the `__ef_migrations_history` table with snake_case columns; `Migrations/` folder + initial empty migration + `AppDbContextModelSnapshot.cs` exist.
2. **AC #2** — `dotnet build SiesaAgents.sln` exits 0 with zero warnings; `AppDbContext` is registered in DI via `AddDbContext<AppDbContext>` + `UseNpgsql(...)` using `ConnectionStrings:DefaultConnection`.
3. **AC #3** — Unhandled exceptions return `500` with `application/problem+json` body containing RFC 7807 `status`, `title`, `type`, `instance` — and NEVER `stackTrace`, `exception`, `innerException`, or raw `ex.Message`. A dev-only `GET /api/v1/test-error` endpoint exists for verification (NFR6).
4. **AC #4** — `modelBuilder.ApplySnakeCaseNaming()` is the LAST statement inside `OnModelCreating` (after `base.OnModelCreating` and `ApplyConfigurationsFromAssembly`).
5. **AC #5** — Integration tests pass: TC-E1-P0-05 (Problem Details), TC-E1-P1-05 (DbContext + migrations + Npgsql provider + zero entity types), TC-E1-P2-04 (snake_case naming wired into OnModelCreating).
6. **AC #6** — Connection string is read from `appsettings.Development.json` via `Configuration.GetConnectionString("DefaultConnection")` (NOT hardcoded). Production `appsettings.json` has no real credentials.
7. **AC #7** — `IDesignTimeDbContextFactory<AppDbContext>` is present so `dotnet ef migrations add` works without the API host running. This story MUST NOT create `ClienteEntity` / `ContactoEntity`.

---

## Test Level Selection Rationale

Story 1.3 is **backend infrastructure-only**. There is no UI surface, no user-facing flow, no DOM, no SPA route to exercise. Therefore:

- **E2E (Playwright):** Not applicable. There is nothing to exercise from a browser.
- **Component (Vitest + RTL):** Not applicable. No React component is added in this story.
- **API Integration (xUnit + `WebApplicationFactory<Program>`):** Primary level. Verifies DI registration, middleware behavior, migration scaffolding, and OnModelCreating wiring.
- **Unit (xUnit pure):** Not used here because every meaningful contract crosses the EF Core relational pipeline or the ASP.NET host — they need a live `WebApplicationFactory` or `DbContextOptionsBuilder` to be meaningful.

Decision: **`primary_level = API Integration`**.

---

## Sandbox Limitations (RED-phase verification)

> The dev sandbox in this run does NOT have the .NET 10 SDK or a local PostgreSQL daemon. Tests cannot be executed (`dotnet test` is not invokable). RED-phase verification is therefore **static** — the tests reference types, extension methods, and HTTP endpoints that do not yet exist in the codebase, which guarantees compile or runtime failure once the SDK is available. The story's Task 7 includes the explicit `dotnet test` step the dev / CI runner must execute.

The tests below are committed to the repo, ready for the GREEN phase. When the dev agent runs `dotnet test backend/SiesaAgents.sln` against a working .NET 10 SDK + local Postgres, every test will fail until Tasks 1–6 of the story are implemented — exactly as required.

---

## Failing Tests Created (RED Phase)

### API Integration Tests (10 tests, 5 files)

**Project:** `backend/tests/SiesaAgents.IntegrationTests/` (xUnit, net10.0)
**csproj:** `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`

Packages: `Microsoft.NET.Test.Sdk 17.11.1`, `xunit 2.9.2`, `xunit.runner.visualstudio 2.8.2`, `coverlet.collector 6.0.2`, `Microsoft.AspNetCore.Mvc.Testing 10.0.0`, `Microsoft.EntityFrameworkCore 10.0.0`, `Npgsql.EntityFrameworkCore.PostgreSQL 10.0.0`.
ProjectReferences: API, Application, Domain, Infrastructure.

#### File: `backend/tests/SiesaAgents.IntegrationTests/SiesaAgentsWebApplicationFactory.cs`

Test-host factory targeting `WebApplicationFactory<Program>`. Forces `Development` environment so the throw-test endpoint is mapped and `appsettings.Development.json` (with `ConnectionStrings:DefaultConnection`) is loaded.

#### File: `backend/tests/SiesaAgents.IntegrationTests/ExceptionHandlingMiddlewareTests.cs` (3 tests) — TC-E1-P0-05 / AC #3

- **Test:** `TestError_Returns500_WithProblemJsonContentType`
  - **Status:** RED — `/api/v1/test-error` endpoint not registered yet → 404 instead of 500.
  - **Verifies:** GIVEN API running in Development WHEN GET `/api/v1/test-error` THEN status 500 + Content-Type `application/problem+json`.

- **Test:** `TestError_Body_ContainsRfc7807MandatoryFields`
  - **Status:** RED — endpoint absent → no body to assert on; compile error if `public partial class Program;` is missing.
  - **Verifies:** GIVEN an unhandled exception WHEN middleware writes the body THEN JSON has `status`, `title`, `type`, `instance` (RFC 7807 §3.1).

- **Test:** `TestError_Body_DoesNotLeakStackTraceOrExceptionDetails`
  - **Status:** RED — endpoint absent.
  - **Verifies:** Body does NOT contain `stackTrace`, `"exception"`, `innerException`, or the raw `ex.Message` string `"internal test"` (NFR6).

#### File: `backend/tests/SiesaAgents.IntegrationTests/AppDbContextTests.cs` (5 tests) — TC-E1-P1-05 + TC-E1-P2-04 / AC #1, #2, #4, #5, #7

- **Test:** `AppDbContext_IsRegisteredInDi`
  - **Status:** RED — `SiesaAgents.Infrastructure.Data.AppDbContext` does not yet exist → compile error.
  - **Verifies:** AC #2 — `AddInfrastructure(...)` registered `AppDbContext` in the API host DI.

- **Test:** `AppDbContext_UsesNpgsqlProvider`
  - **Status:** RED — context not registered.
  - **Verifies:** AC #2 — `Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL"`.

- **Test:** `AppDbContext_HasAtLeastOneMigration`
  - **Status:** RED — `Migrations/` folder + `InitialCreate` not yet generated → `Database.GetMigrations()` returns empty.
  - **Verifies:** AC #1, AC #7 — initial migration is committed to the assembly.

- **Test:** `AppDbContext_Model_ContainsZeroEntityTypes`
  - **Status:** RED — context absent. Once implemented, guards against entity leakage into the empty initial migration.
  - **Verifies:** AC #1, AC #7 — Story 1.3 must NOT add `DbSet<ClienteEntity>` / `DbSet<ContactoEntity>` or any other entity (those belong to Epic 2/3).

- **Test:** `OnModelCreating_AppliesSnakeCaseNamingWithoutThrowing` — TC-E1-P2-04
  - **Status:** RED — `ApplySnakeCaseNaming()` extension call not yet present in `OnModelCreating`; the extension method either ships from `EFCore.NamingConventions` v9.0.0 or from an in-house `SnakeCaseNamingExtensions` (Story Task 1 picks one). Compile error until present.
  - **Verifies:** AC #4 — `modelBuilder.ApplySnakeCaseNaming()` is wired and runs without throwing when the model materializes (no DB connection required).

#### File: `backend/tests/SiesaAgents.IntegrationTests/AddInfrastructureDiTests.cs` (2 tests) — AC #2, AC #6

- **Test:** `AddInfrastructure_RegistersAppDbContext_WhenConnectionStringIsPresent`
  - **Status:** RED — `SiesaAgents.Infrastructure.DependencyInjection.AddInfrastructure` extension does not yet exist → compile error.
  - **Verifies:** AC #2 — the extension wires `AddDbContext<AppDbContext>` + `UseNpgsql(...)` with the supplied configuration.

- **Test:** `AddInfrastructure_Throws_WhenConnectionStringIsMissing`
  - **Status:** RED — extension absent; once present, it must throw `InvalidOperationException` on missing key (fail-fast contract).
  - **Verifies:** AC #6 — connection string must come from configuration; missing key is a hard error, not silently swallowed.

#### File: `backend/tests/SiesaAgents.IntegrationTests/AppDbContextFactoryTests.cs` (1 test) — AC #7

- **Test:** `IDesignTimeDbContextFactory_IsImplementedInInfrastructureAssembly`
  - **Status:** RED — `SiesaAgents.Infrastructure.Data.AppDbContextFactory` does not yet exist; reflective scan returns 0 matching types.
  - **Verifies:** AC #7 — exactly one concrete public type in the Infrastructure assembly implements `IDesignTimeDbContextFactory<AppDbContext>` so `dotnet ef` tooling works without booting the API host.

#### File: `backend/tests/SiesaAgents.IntegrationTests/Usings.cs`

Global usings for: `Xunit`, `System`, `System.Collections.Generic`, `System.Linq`, `System.Net`, `System.Net.Http`, `System.Text.Json`, `System.Threading.Tasks`, `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.EntityFrameworkCore`, `Microsoft.Extensions.DependencyInjection`.

### E2E Tests (0)

Not applicable. No UI in this story.

### Component Tests (0)

Not applicable. No React component in this story.

---

## Test → AC Coverage Matrix

| AC  | Test                                                                 | File                                  | Test Case ID    |
| --- | -------------------------------------------------------------------- | ------------------------------------- | --------------- |
| #1  | `AppDbContext_HasAtLeastOneMigration`                                | `AppDbContextTests.cs`                | TC-E1-P1-05     |
| #1  | `AppDbContext_Model_ContainsZeroEntityTypes`                         | `AppDbContextTests.cs`                | TC-E1-P1-05     |
| #2  | `AppDbContext_IsRegisteredInDi`                                      | `AppDbContextTests.cs`                | TC-E1-P1-05     |
| #2  | `AppDbContext_UsesNpgsqlProvider`                                    | `AppDbContextTests.cs`                | TC-E1-P1-05     |
| #2  | `AddInfrastructure_RegistersAppDbContext_WhenConnectionStringIsPresent` | `AddInfrastructureDiTests.cs`      | TC-E1-P1-05     |
| #3  | `TestError_Returns500_WithProblemJsonContentType`                    | `ExceptionHandlingMiddlewareTests.cs` | TC-E1-P0-05     |
| #3  | `TestError_Body_ContainsRfc7807MandatoryFields`                      | `ExceptionHandlingMiddlewareTests.cs` | TC-E1-P0-05     |
| #3  | `TestError_Body_DoesNotLeakStackTraceOrExceptionDetails`             | `ExceptionHandlingMiddlewareTests.cs` | TC-E1-P0-05     |
| #4  | `OnModelCreating_AppliesSnakeCaseNamingWithoutThrowing`              | `AppDbContextTests.cs`                | TC-E1-P2-04     |
| #5  | (covered by all of the above — AC #5 lists the same three test IDs)  | n/a                                   | TC-E1-P0-05 / P1-05 / P2-04 |
| #6  | `AddInfrastructure_Throws_WhenConnectionStringIsMissing`             | `AddInfrastructureDiTests.cs`        | TC-E1-P1-05     |
| #7  | `IDesignTimeDbContextFactory_IsImplementedInInfrastructureAssembly`  | `AppDbContextFactoryTests.cs`         | TC-E1-P1-05     |
| #7  | `AppDbContext_Model_ContainsZeroEntityTypes`                         | `AppDbContextTests.cs`                | TC-E1-P1-05     |

All seven acceptance criteria are covered. All three named test-design IDs (TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04) have at least one corresponding xUnit test.

---

## Data Factories Created

**None for this story.** Story 1.3 has zero domain entities — there is no `ClienteEntity` or `ContactoEntity` to fake. Factories arrive with their entities in Epic 2 (Story 2.1) and Epic 3 (Story 3.1).

---

## Fixtures Created

**`SiesaAgentsWebApplicationFactory`** — extends `WebApplicationFactory<Program>` and sets the environment to `Development` so:

- The throw-test endpoint `/api/v1/test-error` is mapped (registered behind `if (app.Environment.IsDevelopment())`).
- `appsettings.Development.json` is loaded (provides the connection string).

No auto-cleanup is needed — each test instantiates its own factory inside a `using` / `await using` block; the host is disposed at scope exit.

---

## Mock Requirements

**None.** All tests run against the real `WebApplicationFactory<Program>`. The throw-test endpoint is itself the "mock" of an unhandled-exception scenario; it is registered only in `Development` (per AC #3) and never reaches Production.

Tests that need a relational provider but no DB connection use:

```csharp
new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql("Host=fake;Database=fake;Username=fake;Password=fake")
    .UseSnakeCaseNamingConvention()
```

EF Core builds the model lazily and only opens a connection on actual query execution — this is the documented pattern for testing OnModelCreating without Docker / Testcontainers.

---

## Required data-testid Attributes

**None.** Backend-only story. No DOM, no React, no UI selectors.

---

## Implementation Checklist (RED → GREEN)

### Test 1: `TestError_Returns500_WithProblemJsonContentType` (AC #3)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] Append `public partial class Program;` at the bottom of `backend/src/SiesaAgents.API/Program.cs` so `WebApplicationFactory<Program>` can find the entry-point class (minimal API generates it as `internal partial`).
- [ ] Inside `Program.cs`, after `var app = builder.Build();`, register the dev-only endpoint:
  ```csharp
  if (app.Environment.IsDevelopment())
  {
      app.MapGet("/api/v1/test-error", () =>
      {
          throw new InvalidOperationException("internal test");
      });
  }
  ```
- [ ] Ensure `app.UseMiddleware<ExceptionHandlingMiddleware>();` runs BEFORE the endpoint mapping (already true in Story 1.1).
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ExceptionHandlingMiddlewareTests.TestError_Returns500_WithProblemJsonContentType`
- [ ] Test passes (green phase).

**Estimated effort:** 0.25h

---

### Test 2: `TestError_Body_ContainsRfc7807MandatoryFields` (AC #3)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] Already implemented in Story 1.1 — `ExceptionHandlingMiddleware` writes `ProblemDetails { Status, Title, Type, Instance }`. Confirm nothing has regressed.
- [ ] If the JSON omits `instance` (because `ProblemDetails.Instance` was null), set it to `context.Request.Path` (already in the current implementation).
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ExceptionHandlingMiddlewareTests.TestError_Body_ContainsRfc7807MandatoryFields`
- [ ] Test passes (green phase).

**Estimated effort:** 0.1h (mostly verification — code is already there)

---

### Test 3: `TestError_Body_DoesNotLeakStackTraceOrExceptionDetails` (NFR6, AC #3)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ExceptionHandlingMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] In `ExceptionHandlingMiddleware.InvokeAsync`, confirm `ProblemDetails.Detail` is NOT set from `ex.Message` (currently is not — keep that way).
- [ ] Do NOT add any `Extensions["stackTrace"]` or `Extensions["exception"]` for diagnostic purposes — those are FORBIDDEN in production responses by NFR6.
- [ ] Log the full exception via `logger.LogError(ex, ...)` (already done) — server-side only.
- [ ] Run the test.
- [ ] Test passes (green phase).

**Estimated effort:** 0.1h

---

### Test 4: `AppDbContext_IsRegisteredInDi` (AC #2)

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Add packages to `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`: `Microsoft.EntityFrameworkCore` 10.0.0, `Microsoft.EntityFrameworkCore.Design` 10.0.0 (with `<PrivateAssets>all</PrivateAssets>`), `EFCore.NamingConventions` 9.0.0 (or fall-back to an in-house extension under `Data/Extensions/`).
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` per the snippet in Story Task 2 (empty `DbSet<>`-less context that calls `base.OnModelCreating`, `ApplyConfigurationsFromAssembly`, and `ApplySnakeCaseNaming()` last).
- [ ] Create `backend/src/SiesaAgents.Infrastructure/DependencyInjection.cs` with the `AddInfrastructure(this IServiceCollection, IConfiguration)` extension that calls `services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString).UseSnakeCaseNamingConvention())`.
- [ ] In `backend/src/SiesaAgents.API/Program.cs`, add `builder.Services.AddInfrastructure(builder.Configuration);` BEFORE `var app = builder.Build();`.
- [ ] Run the test.
- [ ] Test passes (green phase).

**Estimated effort:** 0.75h

---

### Test 5: `AppDbContext_UsesNpgsqlProvider` (AC #2)

Same prerequisites as Test 4. No extra implementation work — `UseNpgsql(...)` in `AddInfrastructure` makes it pass.

**Estimated effort:** included in Test 4

---

### Test 6: `AppDbContext_HasAtLeastOneMigration` (AC #1, AC #7)

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] After Tests 4 & 5's DI scaffold is in place, run from `backend/`:
  ```
  dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Migrations
  ```
- [ ] Verify the three generated files in `backend/src/SiesaAgents.Infrastructure/Migrations/`: `<timestamp>_InitialCreate.cs` (EMPTY `Up`/`Down`), `<timestamp>_InitialCreate.Designer.cs`, `AppDbContextModelSnapshot.cs`.
- [ ] If the .NET 10 SDK is unavailable in the sandbox, author the migration files by hand using the EF Core 10 template and document the deferral.
- [ ] Commit all three files to the repo.
- [ ] Run the test.
- [ ] Test passes (green phase).

**Estimated effort:** 0.5h (assuming SDK + Postgres available) / 1.0h (manual authoring fallback)

---

### Test 7: `AppDbContext_Model_ContainsZeroEntityTypes` (AC #1, AC #7 — scope guard)

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Do NOT add ANY `DbSet<>` property to `AppDbContext` in this story.
- [ ] Do NOT add ANY `IEntityTypeConfiguration<>` class to `SiesaAgents.Infrastructure/Data/Configurations/` in this story (the folder may exist but stays empty).
- [ ] Do NOT call `modelBuilder.Entity<...>()` anywhere in `OnModelCreating`.
- [ ] Run the test.
- [ ] Test passes (green phase).

**This test is the scope guard for the entire story.** If a developer accidentally adds `DbSet<ClienteEntity>` "to make Epic 2 easier", this test fails and the build fails. Keep it.

**Estimated effort:** 0h (preventive — costs only when violated)

---

### Test 8: `OnModelCreating_AppliesSnakeCaseNamingWithoutThrowing` (AC #4, TC-E1-P2-04)

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Decide which `ApplySnakeCaseNaming` implementation to use:
  - **Option A:** `EFCore.NamingConventions` 9.0.0 (preferred if it ships for EF Core 10). Call `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder`, and ALSO call `modelBuilder.ApplySnakeCaseNaming()` inside `OnModelCreating` (mandated by company standards — even if redundant, it's documentation in code).
  - **Option B:** In-house extension `SiesaAgents.Infrastructure.Data.Extensions.SnakeCaseNamingExtensions.ApplySnakeCaseNaming(this ModelBuilder)` that iterates `modelBuilder.Model.GetEntityTypes()` and rewrites all relational names via a `ToSnakeCase` helper.
- [ ] In `AppDbContext.OnModelCreating`, the last statement MUST be `modelBuilder.ApplySnakeCaseNaming();`.
- [ ] Run the test.
- [ ] Test passes (green phase).

**Estimated effort:** 0.5h (Option A) / 1.5h (Option B — manual implementation + unit tests for `ToSnakeCase`)

---

### Test 9: `AddInfrastructure_RegistersAppDbContext_WhenConnectionStringIsPresent` (AC #2)

Covered by Test 4's `DependencyInjection.cs`. No extra work.

**Estimated effort:** included in Test 4

---

### Test 10: `AddInfrastructure_Throws_WhenConnectionStringIsMissing` (AC #6)

**File:** `backend/tests/SiesaAgents.IntegrationTests/AddInfrastructureDiTests.cs`

**Tasks to make this test pass:**

- [ ] In `AddInfrastructure`, on a null/missing `ConnectionStrings:DefaultConnection`, throw `InvalidOperationException("Missing 'ConnectionStrings:DefaultConnection'.")` — fail fast.
- [ ] Do NOT fall back to a hardcoded connection string.
- [ ] Run the test.
- [ ] Test passes (green phase).

**Estimated effort:** 0h (covered by Test 4's implementation — just verify the throw is unconditional)

---

### Test 11: `IDesignTimeDbContextFactory_IsImplementedInInfrastructureAssembly` (AC #7)

**File:** `backend/tests/SiesaAgents.IntegrationTests/AppDbContextFactoryTests.cs`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContextFactory.cs` implementing `IDesignTimeDbContextFactory<AppDbContext>` per the snippet in Story Task 2.
- [ ] The factory must read `appsettings.Development.json` from the API project (build a `ConfigurationBuilder` rooted at `../SiesaAgents.API`).
- [ ] Run the test.
- [ ] Test passes (green phase).

**Estimated effort:** 0.25h

---

## Running Tests

```bash
# From repo root, build first
cd backend && dotnet build SiesaAgents.sln

# Run all integration tests
dotnet test backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj

# Run a single test
dotnet test backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj \
    --filter "FullyQualifiedName~ExceptionHandlingMiddlewareTests.TestError_Returns500_WithProblemJsonContentType"

# Run a single class
dotnet test backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj \
    --filter "FullyQualifiedName~AppDbContextTests"

# Run everything in the solution (UnitTests + IntegrationTests)
dotnet test backend/SiesaAgents.sln

# Verbose output for debugging
dotnet test backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj -v normal
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All 10 integration tests written across 5 files
- All tests reference types / extensions / endpoints / migrations that DO NOT yet exist in the codebase
- `SiesaAgentsWebApplicationFactory` fixture created
- AC coverage matrix verified (all 7 ACs covered)
- Scope-guard test (`AppDbContext_Model_ContainsZeroEntityTypes`) included to prevent entity leakage from Epic 2/3 work-in-progress

**Verification (static, due to sandbox SDK absence):**

- Each test file has a `EXPECTED RED-PHASE FAILURE REASONS` XML doc comment listing exactly why the test will fail until implementation lands.
- Once .NET 10 SDK + Postgres are available, `dotnet test` will fail with: missing types (`AppDbContext`, `AddInfrastructure`, `AppDbContextFactory`), missing endpoint (404 on `/api/v1/test-error`), and missing migrations (`GetMigrations()` returns empty).

### GREEN Phase (DEV team responsibility)

1. Pick Task 1 from `1-3-backend-database-foundation.md` (add EF Core packages).
2. Pick Task 2 → AppDbContext + AppDbContextFactory.
3. Pick Task 3 → DependencyInjection.cs + Program.cs wiring.
4. Pick Task 4 → run `dotnet ef migrations add InitialCreate`.
5. Pick Task 5 → register dev-only `/api/v1/test-error`.
6. Run `dotnet test backend/tests/SiesaAgents.IntegrationTests/` after each task — tests turn green incrementally.

### REFACTOR Phase

- After all 10 tests pass, refactor freely (e.g., extract `ToSnakeCase` into a static helper, harden `AppDbContextFactory` against working-directory edge cases).
- The integration tests act as the safety net for Story 2.1 / Story 3.1 when they add the first real entities.

---

## Notes

- **Sandbox constraint:** .NET 10 SDK + PostgreSQL are not installed in the dev container. RED phase was verified statically (the test code references symbols and routes that do not exist). The dev runner / CI must execute `dotnet test` against the real toolchain — that step is encoded in story Task 7.
- **No E2E and no Component tests** — this is intentional. Story 1.3 is backend-only infrastructure. Adding Playwright or Vitest tests here would be ceremonial; they would either duplicate xUnit coverage or have nothing meaningful to assert.
- **Test for `Detail` field omission:** The story AC #3 says the body MUST contain `status`, `title`, `type`, `instance`. It does NOT mandate `detail`. The integration test asserts the four mandatory fields exist and that NO leakage strings appear — it does not assert `detail` is absent (RFC 7807 permits `detail` provided it does not leak internals).
- **`AppDbContext_Model_ContainsZeroEntityTypes` is the scope contract** — it is what mechanically prevents the dev agent from scope-creeping into Epic 2/3 during this story. Keep it loaded.
- **`OnModelCreating_AppliesSnakeCaseNamingWithoutThrowing`** is a sanity contract — it confirms the extension method is wired and runs. End-to-end snake_case verification against a real Postgres (`__ef_migrations_history.migration_id` / `product_version`) is the manual `psql` check encoded in story Task 7. When Epic 2/3 lands real entities, this test should be expanded to assert `entityType.GetTableName()` and column names against the snake_case regex.
- **Three test cases from `test-design-epic-1.md` are realized:**
  - **TC-E1-P0-05** → 3 xUnit tests in `ExceptionHandlingMiddlewareTests.cs`
  - **TC-E1-P1-05** → 4 xUnit tests in `AppDbContextTests.cs` + `AppDbContextFactoryTests.cs` + `AddInfrastructureDiTests.cs`
  - **TC-E1-P2-04** → 1 xUnit test in `AppDbContextTests.cs` (`OnModelCreating_AppliesSnakeCaseNamingWithoutThrowing`)

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then structure, deterministic tests (no network or DB), explicit assertions, atomic tests (one logical check per test). Applied to all 10 tests.
- **test-levels-framework.md** — API Integration selected because the contracts under test (DI registration, ASP.NET middleware response, EF Core model wiring) live above the unit boundary and below the UI boundary.
- **fixture-architecture.md** — `SiesaAgentsWebApplicationFactory` is the single composable fixture; each test instantiates it under `using` so disposal handles cleanup.
- **selector-resilience.md** — N/A (no DOM).
- **network-first.md** — N/A (no browser route interception).
- **data-factories.md** — N/A (no domain entities yet).

---

## Output File

`_bmad-output/atdd-checklist-1.3.md` (this document).

**Manual handoff:** Share this checklist with the dev workflow (`dev-story` / `quick-dev`). It is not auto-consumed.
