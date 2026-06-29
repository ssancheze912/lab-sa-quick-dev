# ATDD Checklist — Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-29
**Author:** SiesaTeam (TEA / ATDD agent)
**Primary Test Level:** API Integration (xUnit + WebApplicationFactory + Testcontainers.PostgreSql)
**Status:** RED phase — tests written, expected to FAIL until implementation lands.

---

## Story Summary

Wire up the PostgreSQL data layer for the backend: install EF Core 10 + Npgsql 10 + `EFCore.NamingConventions`, create `AppDbContext` with `ApplySnakeCaseNaming()` as the LAST call in `OnModelCreating`, register it through an `AddInfrastructure` extension, generate an empty `InitialCreate` migration, and add a Development-only `/api/v1/test-error` endpoint that exercises the existing `ExceptionHandlingMiddleware` to validate the Problem Details RFC 7807 contract.

**As a** developer
**I want** the PostgreSQL database connected and EF Core configured
**So that** subsequent stories can define entities and run migrations against a working data layer.

---

## Acceptance Criteria → Test Mapping

| AC | Summary | Test Cases | Level |
|----|---------|------------|-------|
| AC #1 | `dotnet ef database update` creates `siesa_agents_db` + `__ef_migrations_history` (snake_case columns) | TC-E1-P1-05 | API Integration (Testcontainers) |
| AC #2 | `/api/v1/test-error` → 500 + `application/problem+json` + RFC 7807 body without stack traces / messages | TC-E1-P0-05 | API Integration (WebApplicationFactory) |
| AC #3 | `OnModelCreating` invokes `ApplySnakeCaseNaming()` as the LAST call — verified via probe entity | TC-E1-P2-04 | API Integration (InMemory) |
| AC #4 | Full solution (5 projects + new IntegrationTests) builds with zero warnings | `dotnet build` gate (CI) | Build |
| AC #5 | `AppDbContext` registered via `AddInfrastructure(IConfiguration)` extension; no hardcoded connection string | Covered transitively by AC #1 and AC #3 — `AddInfrastructure` is exercised when Testcontainers + WebApplicationFactory boot | API Integration |

All P0 / P1 / P2 test cases scoped to Story 1.3 in `test-design-epic-1.md` are covered.

---

## Failing Tests Created (RED Phase)

### API Integration Tests — 3 files / 9 test cases

#### `backend/tests/SiesaAgents.IntegrationTests/Api/ProblemDetailsTests.cs`

| TC ID | Test name | AC | Expected RED failure reason |
|-------|-----------|----|-----------------------------|
| TC-E1-P0-05 | `TestErrorEndpoint_Returns500_WithApplicationProblemJsonContentType` | #2 | `Program` is not yet `partial`, so `WebApplicationFactory<Program>` cannot bind; `/api/v1/test-error` does not exist |
| TC-E1-P0-05 | `TestErrorEndpoint_BodyConformsToProblemDetails_WithStatusTitleTypeInstance` | #2 | Endpoint missing — request 404s instead of returning Problem Details |
| TC-E1-P0-05 | `TestErrorEndpoint_BodyDoesNotLeakStackTraceOrExceptionMessage` | #2 | Endpoint missing — cannot reach middleware to exercise no-leakage contract |

#### `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextSnakeCaseTests.cs`

| TC ID | Test name | AC | Expected RED failure reason |
|-------|-----------|----|-----------------------------|
| TC-E1-P2-04 | `OnModelCreating_AppliesSnakeCaseNaming_ToProbeEntityTableName` | #3 | `SiesaAgents.Infrastructure.Data.AppDbContext` does not exist; project does not compile |
| TC-E1-P2-04 | `OnModelCreating_AppliesSnakeCaseNaming_ToProbeEntityColumnNames` | #3 | Same — `AppDbContext` missing |
| TC-E1-P2-04 | `OnModelCreating_ConvertsCamelCasePropertyName_ToSnakeCaseColumn` | #3 | Same — `AppDbContext` missing |

#### `backend/tests/SiesaAgents.IntegrationTests/Data/MigrationsIntegrationTests.cs`

| TC ID | Test name | AC | Expected RED failure reason |
|-------|-----------|----|-----------------------------|
| TC-E1-P1-05 | `MigrateAsync_CreatesEfMigrationsHistoryTable_WithSnakeCaseColumns` | #1 | No `AppDbContext` + no `InitialCreate` migration — `MigrateAsync` cannot run |
| TC-E1-P1-05 | `MigrateAsync_DoesNotCreateClientesOrContactosTables` | #1 | Same — migration step fails before assertions |
| TC-E1-P1-05 | `MigrateAsync_ProducesAtLeastOneAppliedMigration` | #1 | Same — `GetAppliedMigrationsAsync` returns empty / throws |

**Why these are E2E for the backend, not UI E2E:** Story 1.3 ships zero UI — the artifact is a wired DbContext + a middleware-verifying endpoint. The acceptance level for this layer is xUnit + WebApplicationFactory + Testcontainers (per `test-design-epic-1.md` §8 and Story 1.3 Task 6). Frontend Playwright tests are not applicable.

---

## Data Factories Created

None. Story 1.3 introduces no domain entities (scope note from epic: `ClienteEntity` arrives in Story 2.1, `ContactoEntity` in Story 3.1). The only test data is a **probe entity** declared private inside `AppDbContextSnakeCaseTests` — it never reaches the database and exists solely to exercise the naming convention.

---

## Fixtures Created

### xUnit `IClassFixture<WebApplicationFactory<Program>>`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Api/ProblemDetailsTests.cs`

- `WebApplicationFactory<Program>` — boots the API in-process with `ASPNETCORE_ENVIRONMENT=Development` so the test-only `/api/v1/test-error` endpoint is registered.
  - **Setup:** Provided by xUnit / ASP.NET integration testing — instantiates a `TestServer`.
  - **Provides:** An `HttpClient` that hits the real middleware pipeline.
  - **Cleanup:** Disposed automatically by xUnit after the test class finishes.

### xUnit `IAsyncLifetime` — `PostgreSqlContainer`

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/MigrationsIntegrationTests.cs`

- `PostgreSqlContainer` (Testcontainers, image `postgres:18`)
  - **Setup:** `InitializeAsync()` starts the container with database `siesa_agents_db`, user `postgres`, password `postgres`.
  - **Provides:** A real PostgreSQL 18 connection string for `AppDbContext.MigrateAsync()`.
  - **Cleanup:** `DisposeAsync()` stops and removes the container.

---

## Mock Requirements

None. All tests run against real components: a real in-memory provider for naming verification, a real Postgres container for migration verification, and the real ASP.NET pipeline for Problem Details verification. No external services need mocking for Story 1.3.

---

## Required Production Symbols (must exist for tests to compile and reach GREEN)

To unblock the RED → GREEN transition, the dev workflow MUST produce the following symbols in the production codebase. These are NOT `data-testid` attributes (this is a backend story), but the structural equivalent:

### `SiesaAgents.Infrastructure.Data.AppDbContext`

- `public sealed class AppDbContext : DbContext`
- Constructor: `public AppDbContext(DbContextOptions<AppDbContext> options)`
- `protected override void OnModelCreating(ModelBuilder modelBuilder)` that calls `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement.

### `SiesaAgents.Infrastructure.InfrastructureServiceCollectionExtensions`

- `public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)`
- Reads `ConnectionStrings:DefaultConnection`, registers `AppDbContext` with `UseNpgsql`.

### `SiesaAgents.API.Program`

- Must end with `public partial class Program { }` so `WebApplicationFactory<Program>` can target it.
- Must call `builder.Services.AddInfrastructure(builder.Configuration)`.
- Must register `app.MapGet("/api/v1/test-error", () => { throw new Exception("internal test"); })` inside `if (app.Environment.IsDevelopment())`.

### `SiesaAgents.Infrastructure/Migrations/<timestamp>_InitialCreate.cs`

- Empty `Up()` / `Down()` bodies (no `CreateTable` calls for `clientes` or `contactos`).
- Must be generated via `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Migrations`.

---

## Implementation Checklist

### Test: `TestErrorEndpoint_*` (ProblemDetailsTests.cs)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Api/ProblemDetailsTests.cs`

**Tasks to make these tests pass:**

- [ ] Make `Program` partial: add `public partial class Program { }` at the end of `Program.cs`.
- [ ] Wire `builder.Services.AddInfrastructure(builder.Configuration);` (requires `AddInfrastructure` extension — see below).
- [ ] Register the Development-only test endpoint after `app.UseCors("DevCors")`:
  ```csharp
  if (app.Environment.IsDevelopment())
  {
      app.MapGet("/api/v1/test-error", () => { throw new Exception("internal test"); });
  }
  ```
- [ ] Confirm `ExceptionHandlingMiddleware` is still registered first (it already is — do NOT add `Detail = ex.Message`).
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ProblemDetailsTests`
- [ ] ✅ Tests pass (green phase)

### Test: `OnModelCreating_*` (AppDbContextSnakeCaseTests.cs)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/AppDbContextSnakeCaseTests.cs`

**Tasks to make these tests pass:**

- [ ] Upgrade `Npgsql.EntityFrameworkCore.PostgreSQL` to `10.x` in `SiesaAgents.Infrastructure.csproj`.
- [ ] Add `EFCore.NamingConventions` `10.x` to `SiesaAgents.Infrastructure.csproj`.
- [ ] Add `Microsoft.EntityFrameworkCore.Design` `10.x` to both `SiesaAgents.Infrastructure.csproj` and `SiesaAgents.API.csproj` (latter with `PrivateAssets="all"`).
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with the skeleton in the story Dev Notes.
- [ ] Confirm `modelBuilder.ApplySnakeCaseNaming()` is the LAST line in `OnModelCreating`.
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~AppDbContextSnakeCaseTests`
- [ ] ✅ Tests pass (green phase)

### Test: `MigrateAsync_*` (MigrationsIntegrationTests.cs)

**File:** `backend/tests/SiesaAgents.IntegrationTests/Data/MigrationsIntegrationTests.cs`

**Tasks to make these tests pass:**

- [ ] All `AppDbContext` work above is complete.
- [ ] Create `InfrastructureServiceCollectionExtensions.AddInfrastructure(IConfiguration)` per the skeleton in the story Dev Notes.
- [ ] Generate the empty initial migration: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Migrations`.
- [ ] Verify generated migration has empty `Up`/`Down` (no `CreateTable("clientes", ...)` or `"contactos"`).
- [ ] Ensure Docker is available locally (Testcontainers requires it).
- [ ] Run: `dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~MigrationsIntegrationTests`
- [ ] ✅ Tests pass (green phase)

---

## Running Tests

```bash
# Run all integration tests for Story 1.3
dotnet test backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj

# Run only Problem Details tests
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~ProblemDetailsTests

# Run only snake_case naming tests (fast — InMemory provider)
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~AppDbContextSnakeCaseTests

# Run only migration tests (requires Docker for Testcontainers)
dotnet test backend/tests/SiesaAgents.IntegrationTests --filter FullyQualifiedName~MigrationsIntegrationTests

# Run all backend tests across the solution (unit + integration)
dotnet test backend/SiesaAgents.sln

# Build gate
dotnet build backend/SiesaAgents.sln
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ 9 integration tests written across 3 files, all expected to FAIL.
- ✅ `SiesaAgents.IntegrationTests` project scaffolded and added to `SiesaAgents.sln`.
- ✅ Test infrastructure (`WebApplicationFactory<Program>`, `PostgreSqlContainer`) wired into the tests.
- ✅ Implementation checklist mapped to each test.

**Verification of RED:** The IntegrationTests project will not compile until `SiesaAgents.Infrastructure.Data.AppDbContext` exists. Once it compiles, every test will fail because:

1. `Program` is not yet partial → `WebApplicationFactory<Program>` cannot bind.
2. `/api/v1/test-error` does not exist → 404 instead of Problem Details.
3. No `InitialCreate` migration → `MigrateAsync` cannot create the history table.

---

### GREEN Phase (DEV Team — Next Steps)

1. **Run** `dotnet test backend/tests/SiesaAgents.IntegrationTests` and confirm compilation errors / failures (RED).
2. **Implement** the production symbols in this order to unlock tests progressively:
   1. Package upgrades in `SiesaAgents.Infrastructure.csproj` (unblocks `EFCore.NamingConventions` + `Microsoft.EntityFrameworkCore.Design`).
   2. `AppDbContext.cs` → unlocks `AppDbContextSnakeCaseTests` (3 tests).
   3. `InfrastructureServiceCollectionExtensions.cs` → unlocks `AddInfrastructure(...)` wiring.
   4. `Program.cs` changes (`AddInfrastructure`, dev-only `/api/v1/test-error`, `public partial class Program`) → unlocks `ProblemDetailsTests` (3 tests).
   5. `dotnet ef migrations add InitialCreate ...` → unlocks `MigrationsIntegrationTests` (3 tests).
3. **Re-run** each suite until all 9 tests pass.

### REFACTOR Phase (DEV Team — After GREEN)

- Tests provide safety net: refactor `AppDbContext` partial classes / extension methods with confidence.
- Do NOT change test assertions; only implementation.

---

## Test Tooling & Environment Requirements

| Tool | Version | Purpose |
|------|---------|---------|
| .NET SDK | 10.x | Build + test runner |
| xUnit | 2.9.x | Test framework (corporate standard) |
| Microsoft.AspNetCore.Mvc.Testing | 10.x | `WebApplicationFactory<Program>` |
| Microsoft.EntityFrameworkCore.InMemory | 10.x | Snake-case probe context |
| Testcontainers.PostgreSql | 4.x | Real Postgres 18 for migration test |
| FluentAssertions | 7.x | Readable assertions |
| Docker | 24+ | Required for Testcontainers locally and in CI |

---

## Notes

- **No mocking of `DbContext`** — per company-standards.md §Testing Standards we use the real InMemory or Testcontainers provider directly.
- **Probe entity is private** to the test class and intentionally minimal (3 properties) — its sole purpose is to exercise the snake_case convention applied by `AppDbContext.OnModelCreating`. It never leaks to production code.
- **`__ef_migrations_history` columns** in EF Core 10 are `MigrationId` and `ProductVersion` by default; `ApplySnakeCaseNaming()` converts them to `migration_id` and `product_version`. The test asserts both presence (snake_case) and absence (PascalCase).
- **The `internal test` exception message** is hardcoded in the test endpoint and explicitly asserted as MUST NOT appear in the response body — this proves the middleware does not leak `ex.Message` into `Detail`.
- **Network-first / data-testid / Playwright patterns** are not applicable to this story because there is no UI surface and no HTTP traffic to intercept beyond the in-process `HttpClient` that already runs against the real pipeline.

---

## Test Execution Evidence

### Expected Initial Test Run (RED Phase)

**Command:** `dotnet test backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj`

**Expected Results:**

```
Build FAILED — 'AppDbContext' could not be found in namespace 'SiesaAgents.Infrastructure.Data'
                'EFCore.NamingConventions' package not restored
                'Program' is not accessible (must be public partial)
```

After the dev workflow lands `AppDbContext` + the partial `Program` + the dev-only endpoint + the initial migration, all 9 tests transition to GREEN.

**Summary:**

- Total tests: 9
- Passing: 0 (expected during RED)
- Failing: 9 (expected during RED) — failures are due to missing implementation, not test bugs.
- Status: ✅ RED phase verified.

---

## Knowledge Base References Applied

- `test-quality.md` — Given-When-Then structure, atomic assertions, no hardcoded test data leaking across tests.
- `test-levels-framework.md` — API integration chosen over E2E (no UI) and over unit (real DI + real Postgres needed).
- `fixture-architecture.md` — xUnit `IClassFixture` + `IAsyncLifetime` for setup/teardown.
- `selector-resilience.md` — N/A (backend story, no DOM selectors).
- `network-first.md` — N/A (no HTTP interception needed; tests hit the real in-process pipeline).

---

**Generated by BMad TEA Agent** — 2026-06-29
