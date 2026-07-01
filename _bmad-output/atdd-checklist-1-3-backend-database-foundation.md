# ATDD Checklist — Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-07-01
**Author:** SiesaTeam (TEA agent)
**Primary Test Level:** API / Integration (xUnit + `WebApplicationFactory<Program>` + real PostgreSQL)
**Status:** RED phase — tests written BEFORE implementation (must fail until Story 1.3 is implemented)

---

## Story Summary

Wire the PostgreSQL data layer for Siesa-Agents: install EF Core snake_case naming, create an `AppDbContext` with the company-standard naming convention, register it in DI, generate an EMPTY initial migration, and prove Problem Details RFC 7807 middleware still intercepts unhandled exceptions after Program.cs changes.

- **As a** developer,
- **I want** PostgreSQL connected and EF Core configured with global RFC 7807 error handling and snake_case naming,
- **So that** subsequent stories (Epic 2 Story 2.1 onwards) can define entities and run migrations against a working, standards-compliant data layer.

---

## Acceptance Criteria (mapped to tests)

| AC | Requirement | Test | File |
|----|-------------|------|------|
| 1 | `dotnet ef database update` applies a single empty `InitialCreate` migration | `MigrateAsync_OnFreshDatabase_AppliesInitialMigrationWithoutErrors`, `Migrations_OnlyOneInitialCreateMigrationExists` | `DatabaseMigrationTests.cs` |
| 2 | Only `__ef_migrations_history` (snake_case) exists; no `clientes` / `contactos` | `Migrate_OnlyEfMigrationsHistoryTableExists`, `Migrate_DomainTables_DoNotExist` | `DatabaseMigrationTests.cs` |
| 3 | Unhandled exceptions → RFC 7807 Problem Details (no stack trace leak); middleware ordering preserved after Story 1.3 changes | `ExceptionHandlingMiddleware_Ordering_PreservedAfterDbContextWiring` | `AppDbContextRegistrationTests.cs` |
| 4 | `ApplySnakeCaseNaming()` is the LAST call in `OnModelCreating`; no DbSets in this story | `Migrate_EfMigrationsHistory_HasSnakeCaseColumns`, `AppDbContext_Model_HasNoEntityTypes` | `DatabaseMigrationTests.cs` |
| 5 | `AppDbContext` DI-registered against `ConnectionStrings:DefaultConnection`; app still boots; `/scalar` still 200/3xx | `AppDbContext_IsResolvableFromDI`, `AppDbContext_UsesNpgsqlProvider`, `AppDbContext_ConnectionString_ComesFromDefaultConnection`, `ScalarEndpoint_StillReachableAfterDbContextRegistration` | `AppDbContextRegistrationTests.cs` |
| 6 | `__ef_migrations_history` has columns `migration_id`, `product_version` (snake_case) even for EF-internal tables | `Migrate_EfMigrationsHistory_HasSnakeCaseColumns` | `DatabaseMigrationTests.cs` |

---

## Failing Tests Created (RED Phase)

### API / Integration Tests (11 tests total)

#### File: `backend/tests/SiesaAgents.IntegrationTests/DatabaseMigrationTests.cs` (6 tests)

Uses a dedicated `siesa_agents_db_test` database, drop-and-recreate per test run. Skips gracefully with a clear message if PostgreSQL is not reachable at `localhost:5432` (postgres/postgres) — never silently PASSES when the DB is missing.

- **`MigrateAsync_OnFreshDatabase_AppliesInitialMigrationWithoutErrors`** [P1] — AC #1
  - **Status:** RED — will fail because `AppDbContext`, `EFCore.NamingConventions`, and the `InitialCreate` migration do not exist yet.
  - **Verifies:** `ctx.Database.MigrateAsync()` completes without exception and records the `InitialCreate` migration as applied.

- **`Migrations_OnlyOneInitialCreateMigrationExists`** [P1] — AC #1
  - **Status:** RED — no compiled migrations in the Infrastructure assembly yet.
  - **Verifies:** Exactly one migration is defined and it ends with `_InitialCreate`.

- **`Migrate_OnlyEfMigrationsHistoryTableExists`** [P1] — AC #2
  - **Status:** RED — the migrate call itself fails (AppDbContext missing).
  - **Verifies:** Querying `information_schema.tables` after migrate returns only `__ef_migrations_history`.

- **`Migrate_DomainTables_DoNotExist`** [P1] — AC #2
  - **Status:** RED — depends on migrate succeeding.
  - **Verifies:** Neither `clientes` (Epic 2 Story 2.1) nor `contactos` (Epic 3 Story 3.1) exist yet — scope guard against premature `DbSet<>` additions.

- **`Migrate_EfMigrationsHistory_HasSnakeCaseColumns`** [P2] — AC #4, AC #6
  - **Status:** RED — snake_case naming not yet installed.
  - **Verifies:** Columns of `__ef_migrations_history` include `migration_id` and `product_version` (snake_case) and specifically NOT the PascalCase defaults `MigrationId`, `ProductVersion`.

- **`AppDbContext_Model_HasNoEntityTypes`** [P2] — AC #4
  - **Status:** RED — `AppDbContext` class does not exist.
  - **Verifies:** No domain `EntityType` is declared in the EF model (rejects accidental `DbSet<ClienteEntity>` etc.).

#### File: `backend/tests/SiesaAgents.IntegrationTests/AppDbContextRegistrationTests.cs` (5 tests)

Reuses the existing `TestExceptionAppFactory` (from `ExceptionHandlingMiddlewareTests.cs`) to spin up `WebApplicationFactory<Program>` with `SIESA_TEST_ENDPOINTS=1`.

- **`AppDbContext_IsResolvableFromDI`** [P0] — AC #5
  - **Status:** RED — `AddDbContext<AppDbContext>` not yet in Program.cs.
  - **Verifies:** `ServiceProvider.GetService<AppDbContext>()` returns a non-null instance.

- **`AppDbContext_UsesNpgsqlProvider`** [P0] — AC #5
  - **Status:** RED — DbContext not resolvable.
  - **Verifies:** `ctx.Database.ProviderName` contains `Npgsql` (guards against accidental InMemory/Sqlite regressions).

- **`AppDbContext_ConnectionString_ComesFromDefaultConnection`** [P0] — AC #5
  - **Status:** RED — depends on DI registration.
  - **Verifies:** The effective connection string contains `siesa_agents_db`, proving configuration flowed from `appsettings.Development.json → GetConnectionString("DefaultConnection")` into `AddDbContext`.

- **`ScalarEndpoint_StillReachableAfterDbContextRegistration`** [P1] — AC #5 regression guard
  - **Status:** RED — the app may fail to start if the connection string is missing or DI wiring is wrong.
  - **Verifies:** `GET /scalar` still returns 200 or a 3xx redirect after Story 1.3 changes (Story 1.1 behavior preserved).

- **`ExceptionHandlingMiddleware_Ordering_PreservedAfterDbContextWiring`** [P0] — AC #3
  - **Status:** RED — startup will fail before this test can exercise the middleware, until DI wiring is complete.
  - **Verifies:** `GET /test-error` still returns `500` + `application/problem+json` + no `SECRET-INTERNAL-DETAIL` / `stackTrace` leakage after Program.cs changes.

---

## Data Factories Created

**None.** This story has no domain entities. No factories are needed. Test data (the migration itself) is generated by EF Core.

---

## Fixtures Created

**Reused existing `TestExceptionAppFactory`** (from Story 1.1's `ExceptionHandlingMiddlewareTests.cs`) — sets `SIESA_TEST_ENDPOINTS=1` in `ConfigureWebHost` so the test-only throwing endpoints are registered.

`DatabaseMigrationTests` implements `IAsyncLifetime` and does its own setup/teardown:
- `InitializeAsync`: drops+recreates `siesa_agents_db_test` via an admin connection to the `postgres` DB.
- `DisposeAsync`: no-op (the next run's `InitializeAsync` will drop again).

---

## Mock Requirements

**None.** Tests exercise the real EF Core pipeline against a real PostgreSQL instance (Testcontainers-optional, local Postgres-default). No mocking of the database is used — that would defeat the purpose of AC #6.

---

## Required data-testid Attributes

**Not applicable.** This is a backend-only story — no frontend UI is added.

---

## Implementation Checklist (RED → GREEN Path)

### 1. Install EF Core snake_case naming (AC #2, #4, #6)

- [ ] `cd backend && dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
- [ ] `dotnet build SiesaAgents.sln` → 0 errors, 0 warnings

### 2. Install EF Core Design + CLI tooling (AC #1)

- [ ] `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
- [ ] `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design`
- [ ] `dotnet tool install --global dotnet-ef` (skip if already installed)
- [ ] `dotnet ef --version` runs successfully

### 3. Create `AppDbContext` (AC #4, #5)

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:
  - Namespace `SiesaAgents.Infrastructure.Data`
  - Primary constructor: `public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)`
  - Override `OnModelCreating`:
    1. `base.OnModelCreating(builder);`
    2. `builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);`
    3. snake_case call as the LAST line (see AC #4 — the exact idiomatic API depends on the installed `EFCore.NamingConventions` version; either `UseSnakeCaseNamingConvention()` in `AddDbContext` options OR the equivalent `ModelBuilder` extension in `OnModelCreating`).
  - **DO NOT** declare any `DbSet<>` (proven by `AppDbContext_Model_HasNoEntityTypes`).

### 4. Register `AppDbContext` in Program.cs (AC #3, #5)

- [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;`
- [ ] After `AddCors(...)` and BEFORE `builder.Build()`:
  ```csharp
  var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
      ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
  builder.Services.AddDbContext<AppDbContext>(options =>
      options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());
  ```
- [ ] Confirm middleware order untouched (ExceptionHandlingMiddleware FIRST — validated by `ExceptionHandlingMiddleware_Ordering_PreservedAfterDbContextWiring`).

### 5. Generate the empty initial migration (AC #1, #2)

- [ ] From `backend/`:
  ```
  dotnet ef migrations add InitialCreate \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API \
    --output-dir Data/Migrations
  ```
- [ ] Open the generated `Data/Migrations/<timestamp>_InitialCreate.cs`. Confirm both `Up` and `Down` bodies are EMPTY (no `CreateTable`).

### 6. Ensure local Postgres is running for the integration tests

- [ ] If not already up: `docker run --name siesa-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18-alpine`

### 7. Run the failing tests → expect all PASS after steps 1-5

- [ ] `cd backend && dotnet test SiesaAgents.sln` → all 11 tests in Story 1.3's ATDD suite PASS

---

## Running Tests

```bash
# Run every test in the solution (from backend/)
dotnet test SiesaAgents.sln

# Run only the Story 1.3 integration tests
dotnet test backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj

# Filter to Story 1.3 DB tests only
dotnet test --filter "FullyQualifiedName~DatabaseMigrationTests"
dotnet test --filter "FullyQualifiedName~AppDbContextRegistrationTests"

# Verbose (helpful for RED-phase diagnosis)
dotnet test --logger "console;verbosity=detailed"
```

---

## Red-Green-Refactor Workflow

### RED Phase (COMPLETE — this document)

- Tests are in place at `backend/tests/SiesaAgents.IntegrationTests/DatabaseMigrationTests.cs` and `AppDbContextRegistrationTests.cs`.
- csproj now references `SiesaAgents.Infrastructure` and adds `Microsoft.EntityFrameworkCore` + `Npgsql` package references so the test code compiles against the missing symbols.
- **Expected initial failures (compilation errors are acceptable RED signals):**
  1. `The type or namespace name 'AppDbContext' could not be found` — until Task 3 (Create AppDbContext).
  2. `AppDbContext_IsResolvableFromDI` throws `null` — until Task 4 (Program.cs DI registration).
  3. `MigrateAsync_...` throws `Npgsql: relation ... does not exist` / `No migrations found` — until Task 5 (create migration).
  4. `Migrate_EfMigrationsHistory_HasSnakeCaseColumns` finds `MigrationId`/`ProductVersion` — until Task 1 (install `EFCore.NamingConventions`) + snake_case call added.

### GREEN Phase (DEV team)

Execute the Implementation Checklist above in order. After each task, re-run the corresponding test slice and verify it moves from RED to GREEN. Target: all 11 tests PASS.

### REFACTOR Phase (DEV team)

- Verify `dotnet build SiesaAgents.sln` still exits with 0 errors / 0 warnings (AC #5).
- Confirm no `DbSet<>` was silently added (the `AppDbContext_Model_HasNoEntityTypes` test guards this).
- Extract test-DB bootstrap into a shared xUnit fixture if a second DB-touching test class arrives in Epic 2.

---

## Notes

- These tests deliberately do NOT auto-provision Docker Postgres — that responsibility is on Task 6 of the story. `IsPostgresReachableAsync` skips tests with a clear message instead of a silent PASS.
- The tests use `siesa_agents_db_test` (NOT the dev DB `siesa_agents_db`) so they never pollute local dev state.
- AC #3 (RFC 7807) is *re-verified* here in the context of Story 1.3 changes; the deeper suite `ExceptionHandlingMiddlewareTests.cs` from Story 1.1 remains untouched.
- The Given-When-Then structure is preserved in `//` comments in every test (xUnit doesn't have a native GWT DSL; comment-based GWT is the accepted BMAD convention for .NET tests).

---

## Test Execution Evidence

**Command:** `cd backend && dotnet test SiesaAgents.sln`

**Expected RED-phase result (before Story 1.3 implementation):**

```
Build FAILED.
  CS0246: The type or namespace name 'AppDbContext' could not be found ...
  (compilation errors in the two new .cs files — this IS the RED signal
   for a TDD-first backend test file; see Red-Green-Refactor above)
```

After Story 1.3 is fully implemented (Tasks 1-5), the expected GREEN result is:

```
Passed! - Failed: 0, Passed: 11 (Story 1.3 new tests), Skipped: 0
```

---

**Output File:** `_bmad-output/atdd-checklist-1-3-backend-database-foundation.md`
**Failing Test Files:**
- `backend/tests/SiesaAgents.IntegrationTests/DatabaseMigrationTests.cs`
- `backend/tests/SiesaAgents.IntegrationTests/AppDbContextRegistrationTests.cs`
**csproj Updates:**
- `backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj` (added Npgsql, Microsoft.EntityFrameworkCore, Infrastructure project reference)
