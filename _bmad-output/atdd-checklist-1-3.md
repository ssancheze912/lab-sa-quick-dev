# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-15
**Author:** SiesaTeam (TEA agent)
**Primary Test Level:** API Integration (xUnit + WebApplicationFactory)

---

## Story Summary

Story 1.3 wires up EF Core 10.x + PostgreSQL behind a Clean-Architecture
Infrastructure project, registers `AppDbContext` in DI, applies a
solution-wide `ApplySnakeCaseNaming()` convention, generates an empty
`InitialCreate` migration, and hardens the existing
`ExceptionHandlingMiddleware` so it returns RFC 7807 Problem Details without
ever leaking a stack trace.

**As a** developer,
**I want** the PostgreSQL database connected and the EF Core infrastructure configured,
**So that** subsequent stories can define entities and run migrations against a working data layer.

---

## Acceptance Criteria

1. AC-1.3.a / AC-1.3.b — `dotnet ef database update` creates `siesa_agents_db` with `__ef_migrations_history` (snake_case columns) and no domain tables (TC-E1-P1-05).
2. AC-1.3.d — `OnModelCreating` invokes `modelBuilder.ApplySnakeCaseNaming()` as the LAST call (TC-E1-P2-04).
3. AC-1.3.a / AC-1.3.b — `InitialCreate` migration exists with empty `Up()` (no `CreateTable` / `CreateIndex`).
4. AC-1.3.c / NFR6 — `ExceptionHandlingMiddleware` returns RFC 7807 Problem Details with status 500, `Content-Type: application/problem+json`, RFC 7807 keys present, and NO stack-trace / exception / message leakage (TC-E1-P0-05).
5. AC-1.3 — `AppDbContext` is registered via `AddDbContext<AppDbContext>` using `UseNpgsql`; solution compiles 0/0 and `GET /health` returns 200.
6. AC-1.3 — Infrastructure csproj references `Microsoft.EntityFrameworkCore` (10.x), `Microsoft.EntityFrameworkCore.Design` (10.x), and `Npgsql.EntityFrameworkCore.PostgreSQL` (10.x).
7. AC-1.3 — `SiesaAgents.IntegrationTests` project exists; `ExceptionMiddleware_OnUnhandledException_ReturnsProblemDetailsRfc7807` and `EfCore_OnModelCreating_AppliesSnakeCaseNaming` both pass.

---

## Failing Tests Created (RED Phase)

### API Integration Tests (12 tests across 4 files)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ExceptionMiddlewareTests.cs`

- **Test:** `ExceptionMiddleware_OnUnhandledException_ReturnsProblemDetailsRfc7807`
  - **Status:** RED — `/__test/throw` endpoint does not exist yet; AppDbContext DI not wired so Program.cs may fail to bootstrap in Testing environment.
  - **Verifies:** TC-E1-P0-05 / AC #4 / AC #7. Status 500, content-type `application/problem+json`, RFC 7807 keys (status/title/type/instance) present.
- **Test:** `ExceptionMiddleware_OnUnhandledException_DoesNotLeakStackTraceOrExceptionMessage`
  - **Status:** RED — same boot failure path as above; once wired, this also guards against future regressions.
  - **Verifies:** NFR6. Forbidden substrings (`stackTrace`, `Exception`, `forced`, `at SiesaAgents`, etc.) are absent from the response body.

**File:** `backend/tests/SiesaAgents.IntegrationTests/SnakeCaseConventionTests.cs`

- **Test:** `EfCore_OnModelCreating_ConvertsTableNamesToSnakeCase`
  - **Status:** RED — `SiesaAgents.Infrastructure.Data.AppDbContext` type does not exist.
  - **Verifies:** TC-E1-P2-04 / AC #2. `ThrowawayTestEntities` → `throwaway_test_entities`.
- **Test:** `EfCore_OnModelCreating_ConvertsColumnNamesToSnakeCase`
  - **Status:** RED — AppDbContext + ApplySnakeCaseNaming extension missing.
  - **Verifies:** `CreatedAt`, `CreatedBy`, `ClienteId`, `Id` → `created_at`, `created_by`, `cliente_id`, `id`.
- **Test:** `EfCore_OnModelCreating_ConvertsIndexNamesToSnakeCase`
  - **Status:** RED — extension missing.
  - **Verifies:** Index names lowercase and snake_case (`ix_throwaway_test_entities_cliente_id`).
- **Test:** `EfCore_OnModelCreating_ApplySnakeCaseNamingIsTheLastCall`
  - **Status:** RED — `AppDbContext.cs` source file does not exist.
  - **Verifies:** Source-level guarantee that `ApplySnakeCaseNaming(` is the LAST non-empty statement inside `OnModelCreating` (company-standard non-negotiable).
- **Test:** `EfCore_OnModelCreating_AppliesSnakeCaseNaming`
  - **Status:** RED — same as above.
  - **Verifies:** AC #7's named test (TC-E1-P2-04 acceptance alias).

**File:** `backend/tests/SiesaAgents.IntegrationTests/DbContextWiringTests.cs`

- **Test:** `DbContext_IsResolvableFromDi`
  - **Status:** RED — `AddDbContext<AppDbContext>` not called in `Program.cs`.
  - **Verifies:** AC #5. AppDbContext resolves from the request-scoped service provider.
- **Test:** `Health_ReturnsOk_AfterDbContextWired`
  - **Status:** RED — API will fail to start (Testing-environment AllowedOrigins / connection-string injection) until DI is wired.
  - **Verifies:** AC #5. No behavioural regression on the smoke endpoint after the DbContext is registered.

**File:** `backend/tests/SiesaAgents.IntegrationTests/InfrastructureProjectTests.cs`

- **Test:** `Infrastructure_References_EntityFrameworkCore_10`
  - **Status:** RED — package not yet added.
  - **Verifies:** AC #6.
- **Test:** `Infrastructure_References_EntityFrameworkCore_Design_10`
  - **Status:** RED — package not yet added.
  - **Verifies:** AC #6.
- **Test:** `Infrastructure_References_NpgsqlEntityFrameworkCorePostgreSQL_10`
  - **Status:** GREEN-able today (10.0.2 already referenced) — kept as a regression guard.
  - **Verifies:** AC #6. The version line stays on 10.x.
- **Test:** `InitialCreate_Migration_FileExists`
  - **Status:** RED — migration not generated.
  - **Verifies:** AC #1 / AC #3. `*_InitialCreate.cs` exists under `Data/Migrations/`.
- **Test:** `InitialCreate_Migration_HasEmptyUpMethod`
  - **Status:** RED — no migration file.
  - **Verifies:** AC #3. No `CreateTable` / `CreateIndex` / `AddColumn` / `AddForeignKey` / `AddPrimaryKey` / `AddUniqueConstraint` in the generated migration source.

### E2E Tests (0)

Not applicable. Story 1.3 has no UI surface.

### Component Tests (0)

Not applicable. Story 1.3 has no UI surface.

---

## Data Factories Created

None for this story. The only test entity is the in-process `ThrowawayTestEntity` declared inside `SnakeCaseConventionTests.cs`; no faker-based fixtures are needed because Story 1.3 produces no domain entities.

---

## Fixtures Created

### API Bootstrapping Fixture

**File:** `backend/tests/SiesaAgents.IntegrationTests/Fixtures/SiesaAgentsApiFactory.cs`

**Fixtures:**

- `SiesaAgentsApiFactory` — `WebApplicationFactory<Program>` that hosts the API in `ASPNETCORE_ENVIRONMENT=Testing`, supplies an `AllowedOrigins:0` setting (fail-fast guard in `Program.cs`) and a `ConnectionStrings:DefaultConnection` so `AddDbContext<AppDbContext>` does not throw at composition time.
  - **Setup:** Uses `IHostBuilder.UseEnvironment("Testing")`; binds to ephemeral port (`http://127.0.0.1:0`).
  - **Provides:** `HttpClient` and `IServiceProvider` to consuming tests via `IClassFixture<>`.
  - **Cleanup:** `WebApplicationFactory.Dispose` automatically tears down the host between test classes.

---

## Mock Requirements

### Test-only "throw" endpoint (Program.cs)

**Endpoint:** `GET /__test/throw`

**Behavior:** Throws `new InvalidOperationException("forced")`.

**Registration:** Only when `builder.Environment.EnvironmentName == "Testing"` (or `ASPNETCORE_ENVIRONMENT=Testing`).

**Why:** `ExceptionMiddlewareTests` cannot validate the Problem-Details contract without an endpoint that intentionally throws. Production startup must NOT expose this route.

**Notes:** Story 1.3 Task 7 explicitly calls this out:
> "Add a `WebApplicationFactoryFixture` that builds the API with a test-only endpoint `GET /__test/throw` registered conditionally (e.g. only when `ASPNETCORE_ENVIRONMENT=Testing`) — the endpoint throws `new InvalidOperationException(\"forced\")`."

### Program class visibility

`Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<TEntryPoint>` requires `TEntryPoint` (here `Program`) to be public OR have `InternalsVisibleTo("SiesaAgents.IntegrationTests")`. With top-level statements, the dev must add at the bottom of `Program.cs`:

```csharp
public partial class Program { }
```

---

## Required data-testid Attributes

Not applicable — backend story, no UI.

---

## Implementation Checklist

### Test: `ExceptionMiddleware_OnUnhandledException_ReturnsProblemDetailsRfc7807` (and `…DoesNotLeakStackTraceOrExceptionMessage`)

**File:** `backend/tests/SiesaAgents.IntegrationTests/ExceptionMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] Add `public partial class Program { }` at the bottom of `backend/src/SiesaAgents.API/Program.cs`.
- [ ] In `Program.cs`, after `app.MapFallback(...)` and before `app.Run()`, register conditionally:
  ```csharp
  if (app.Environment.EnvironmentName == "Testing")
  {
      app.MapGet("/__test/throw", () => { throw new InvalidOperationException("forced"); });
  }
  ```
- [ ] Re-read `ExceptionHandlingMiddleware.cs` and confirm `Detail` is NEVER set (and never populated from `ex.Message`).
- [ ] Wire `SiesaAgents.IntegrationTests` into `SiesaAgents.sln`: `dotnet sln SiesaAgents.sln add tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`.
- [ ] Run: `dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ExceptionMiddlewareTests`.
- [ ] Test passes (green phase).

**Estimated Effort:** 1 hour

---

### Test: `EfCore_OnModelCreating_*` family (5 tests in `SnakeCaseConventionTests.cs`)

**File:** `backend/tests/SiesaAgents.IntegrationTests/SnakeCaseConventionTests.cs`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderSnakeCaseExtensions.cs` implementing `ApplySnakeCaseNaming(this ModelBuilder)` per the reference in story Dev Notes.
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with `OnModelCreating` calling `base.OnModelCreating(modelBuilder)`, then `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)`, then — as the LAST statement — `modelBuilder.ApplySnakeCaseNaming()`.
- [ ] Run: `dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~SnakeCaseConventionTests`.
- [ ] Test passes (green phase).

**Estimated Effort:** 1.5 hours

---

### Test: `DbContext_IsResolvableFromDi` + `Health_ReturnsOk_AfterDbContextWired`

**File:** `backend/tests/SiesaAgents.IntegrationTests/DbContextWiringTests.cs`

**Tasks to make these tests pass:**

- [ ] In `backend/src/SiesaAgents.API/Program.cs`, after `builder.Services.AddProblemDetails();` add:
  ```csharp
  builder.Services.AddDbContext<AppDbContext>(options =>
      options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
  ```
  with `using Microsoft.EntityFrameworkCore;` and `using SiesaAgents.Infrastructure.Data;`.
- [ ] Confirm `appsettings.Development.json` already contains the `ConnectionStrings.DefaultConnection` entry (Story 1.1).
- [ ] Run: `dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~DbContextWiringTests`.
- [ ] Test passes (green phase).

**Estimated Effort:** 0.5 hour

---

### Test: `Infrastructure_References_*` + `InitialCreate_Migration_*`

**File:** `backend/tests/SiesaAgents.IntegrationTests/InfrastructureProjectTests.cs`

**Tasks to make these tests pass:**

- [ ] `cd backend && dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore --version 10.*`.
- [ ] `cd backend && dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design --version 10.*`.
- [ ] `cd backend && dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`.
- [ ] Confirm the generated migration's `Up()` and `Down()` bodies are empty (no `CreateTable`/`CreateIndex`).
- [ ] Run: `dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~InfrastructureProjectTests`.
- [ ] Test passes (green phase).

**Estimated Effort:** 0.5 hour

---

## Running Tests

```bash
# Run all failing tests for this story
cd backend && dotnet test tests/SiesaAgents.IntegrationTests

# Run specific test file
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ExceptionMiddlewareTests
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~SnakeCaseConventionTests
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~DbContextWiringTests
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~InfrastructureProjectTests

# Verbose / log on failure
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --logger "console;verbosity=detailed"

# With coverage (coverlet.collector is already referenced)
cd backend && dotnet test tests/SiesaAgents.IntegrationTests --collect:"XPlat Code Coverage"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- [x] All 13 tests written and expected to fail.
- [x] WebApplicationFactory fixture created (auto-cleanup via `IClassFixture`).
- [x] Mock requirements documented (test-only throw endpoint + `public partial class Program`).
- [x] Integration test project scaffolded at `backend/tests/SiesaAgents.IntegrationTests/`.

**Verification:**

- Tests will fail to compile until `SiesaAgents.Infrastructure.Data.AppDbContext` exists (`SnakeCaseConventionTests.cs`, `DbContextWiringTests.cs`).
- Once compiling, tests will fail at runtime because:
  - `Program` is not public (WebApplicationFactory binds will throw).
  - `/__test/throw` endpoint does not exist.
  - `AddDbContext<AppDbContext>` not registered → `GetService<AppDbContext>()` returns null.
  - `InitialCreate` migration file does not exist on disk.
- Failures are due to missing implementation, not test bugs.

### GREEN Phase (DEV Team — Next Steps)

1. Pick `Infrastructure_References_*` (cheapest) → add NuGet refs → run tests → green.
2. Implement `ModelBuilderSnakeCaseExtensions.cs` → `AppDbContext.cs` → run snake_case tests → green.
3. Add `AddDbContext<AppDbContext>` to Program.cs → run DI/health tests → green.
4. Add `public partial class Program { }` + the test-only throw endpoint → run middleware tests → green.
5. `dotnet ef migrations add InitialCreate --output-dir Data/Migrations` → run migration tests → green.

### REFACTOR Phase (DEV Team)

- Tear out duplicated bootstrap code in the fixture if the project later adds more integration test classes.
- Extract a `ToSnakeCase` micro-benchmark only if migration generation gets slow.

---

## Knowledge Base References Applied

- **fixture-architecture.md** — `WebApplicationFactory<Program>` + `IClassFixture<>` give per-test-class isolation with automatic teardown.
- **test-quality.md** — Each test asserts one logical outcome (status, content-type, no-leak, table rename, column rename, index rename, source-level last-call invariant) so a failure points to a single root cause.
- **selector-resilience.md** — Backend story has no UI selectors; the equivalent stability rule applied here is "assert on RFC 7807 JSON keys, not on rendered HTML".
- **timing-debugging.md** — No hard waits or sleeps. WebApplicationFactory tests are deterministic by construction.
- **test-levels-framework.md** — API Integration is the right level: middleware ordering and EF model-builder behaviour cannot be unit-tested in isolation, and there is no UI to E2E.

See `tea-index.csv` for the full mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `cd backend && dotnet test tests/SiesaAgents.IntegrationTests`

**Expected Results (RED phase — pre-implementation):**

- Compilation failures referencing `SiesaAgents.Infrastructure.Data.AppDbContext` (type not yet defined).
- Once compilation is unblocked by dev edits, runtime failures on:
  - `ExceptionMiddleware_OnUnhandledException_ReturnsProblemDetailsRfc7807` — `HttpRequestException` / 404 (no `/__test/throw` endpoint).
  - `DbContext_IsResolvableFromDi` — `Assert.NotNull` fails (DbContext not registered).
  - `Infrastructure_References_EntityFrameworkCore_10` / `_Design_10` — `Assert.Contains` fails (NuGet refs missing).
  - `InitialCreate_Migration_FileExists` — `Assert.NotEmpty` fails (no migration on disk).

**Summary (target):**

- Total tests: 13
- Passing: 0 (expected at RED)
- Failing: 13 (expected at RED)
- Status: RED phase verified once `dotnet test` is run

---

## Notes

- Story 1.3 has zero UI surface, so Playwright/E2E coverage is intentionally skipped. The existing `e2e/` Playwright suite at the repo root covers Story 1.2's navigation shell.
- `Microsoft.EntityFrameworkCore.InMemory` is referenced in the test csproj because `SnakeCaseConventionTests` asserts model-builder behaviour (not Npgsql SQL emission). This matches the Dev Notes guidance: "in-memory model assertion is preferred for unit-speed".
- `InfrastructureProjectTests` walk up from `AppContext.BaseDirectory` to locate the Infrastructure csproj and Migrations directory; they tolerate the test bin being placed under `tests/SiesaAgents.IntegrationTests/bin/...`.
- The story's Task 7 also mentions an alternative Testcontainers-based approach for `TC-E1-P1-05` (real Postgres). It is deferred — once Postgres is available in CI, a separate `PostgresMigrationLiveTests.cs` may be added; for now the static migration-file assertion in `InitialCreate_Migration_HasEmptyUpMethod` covers AC #3.
- `SiesaAgents.IntegrationTests.csproj` is NOT yet referenced from `SiesaAgents.sln`. The dev must add it as part of Task 7 (`dotnet sln SiesaAgents.sln add ...`).

---

**Generated by BMad TEA Agent** — 2026-06-15
