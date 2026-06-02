# ATDD Checklist — Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-02
**Author:** SiesaTeam (TEA — Test Architect, autonomous mode)
**Workflow:** `_bmad/bmm/testarch/atdd` v4.0 (BMad v6)
**Primary Test Level:** API Integration (xUnit + `WebApplicationFactory<Program>` + Testcontainers-Postgres) — backed by xUnit unit tests
**Story File:** `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md`
**Epic Source:** `_bmad-output/planning-artifacts/epics/epic-01-foundation.md` (Story 1.3)
**Test Design:** `_bmad-output/implementation-artifacts/test-design-epic-1.md`

---

## Story Summary

**As a** developer,
**I want** the PostgreSQL database connected and the EF Core infrastructure configured,
**So that** subsequent stories can define entities and run migrations against a working data layer.

Wires `AppDbContext` + `ApplySnakeCaseNaming()` extension inside `SiesaAgents.Infrastructure`, registers it in DI via `Program.cs`, generates an empty `InitialCreate` migration, hardens RFC 7807 Problem Details for unhandled exceptions (NFR6), and closes the Story 1.1 review item by removing the `Infrastructure → Application` project reference. No domain entities (`clientes`, `contactos`) in this story — those land in Epics 2 and 3.

---

## Acceptance Criteria Coverage

| AC | Description | Test ID(s) | Level | File(s) |
|----|-------------|------------|-------|---------|
| #1 | `dotnet ef database update` creates `siesa_agents_db` + `__ef_migrations_history` | TC-E1-P1-05 | API Integration (Db) | `MigrationCreatesDbTests.cs` |
| #2 | `InitialCreate` migration body is empty (no `CreateTable` for `clientes` / `contactos`) | TC-E1-P1-05 | API Integration (Db) | `MigrationCreatesDbTests.cs` |
| #3 | Unhandled exceptions return `500` + `application/problem+json` + RFC 7807 body, no `stackTrace` / `exception` / `Exception.Message` (NFR6) | TC-E1-P0-05 | API Integration | `ProblemDetailsTests.cs` |
| #4 | `ApplySnakeCaseNaming()` is the LAST call in `OnModelCreating`; `__ef_migrations_history` columns match `^[a-z0-9_]+$` | TC-E1-P2-04 + unit | API Integration (Db) + Unit | `MigrationCreatesDbTests.cs`, `ModelBuilderSnakeCaseExtensionsTests.cs`, `AppDbContextTests.cs` |
| #5 | `<Nullable>enable</Nullable>` clean build; `AddDbContext<AppDbContext>` wired once with `UseNpgsql(...DefaultConnection)` | DEV-owned + DI guard | API Integration | `EfCoreDiRegistrationTests.cs` |
| #6 | xUnit suite passes: AppDbContext shape + snake_case rule (unit) + Problem Details (integration, no DB) | (DEV) | Unit + API Integration | `AppDbContextTests.cs`, `ModelBuilderSnakeCaseExtensionsTests.cs`, `ProblemDetailsTests.cs` |
| #7 | `SiesaAgents.Infrastructure` references ONLY `SiesaAgents.Domain` (closes Story 1.1 `[AI-Review][HIGH]`) | Architecture guard | Unit | `InfrastructureProjectReferenceTests.cs` |

---

## Failing Tests Created (RED Phase)

> All test files compile-fail until DEV creates `SiesaAgents.Infrastructure.Data.AppDbContext` and `SiesaAgents.Infrastructure.Data.Extensions.ModelBuilderSnakeCaseExtensions`. This is the canonical ATDD entry point — the tests' refusal to build is itself the first RED signal. Once the production types exist, the tests will compile and then fail at runtime for the targeted reasons listed below.

### Unit Tests — xUnit (16 total)

**File 1 (PRE-EXISTING):** `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs`

Covers AC #4, AC #5, AC #6 (first bullet — AppDbContext derives from DbContext + accepts `DbContextOptions<AppDbContext>` ctor).

- `AppDbContext_DerivesFromDbContext`
  - Status: **RED** — `SiesaAgents.Infrastructure.Data.AppDbContext` does not yet exist (compile-fails until Task 2 lands).
- `AppDbContext_HasPublicConstructor_AcceptingDbContextOptions`
  - Status: **RED** — same.
- `AppDbContext_CanBeInstantiated_WithInMemoryProvider`
  - Status: **RED** — same; will then RED at runtime until ctor is `public`.
- `AppDbContext_OnModelCreating_AppliesSnakeCaseNamingAsLastStep`
  - Status: **RED** — `ApplySnakeCaseNaming` extension missing.
- `AppDbContext_DoesNotExposeDomainTables_ScopeNoteForEpic1`
  - Status: **RED** — RED at runtime until DbSets stay empty per Scope Note.

**File 2 (NEW):** `backend/tests/SiesaAgents.UnitTests/Data/Extensions/ModelBuilderSnakeCaseExtensionsTests.cs`

Covers AC #4 + AC #6 (second bullet — `ApplySnakeCaseNaming()` rule).

- `ToSnakeCase_ConvertsPascalCaseAndAcronymsToSnakeCase` (8 inline cases — `Cliente`, `ClienteEntity`, `CreatedAt`, `ClienteID`, `NIT`, `ID`, `id`, `""`)
  - Status: **RED** — `ModelBuilderSnakeCaseExtensions.ToSnakeCase(string)` not yet shipped.
- `ToSnakeCase_NullInput_ReturnsNull`
  - Status: **RED** — null guard branch not yet implemented.
- `ApplySnakeCaseNaming_RewritesPascalCaseTableAndColumnNames_OnSampleEntity`
  - Status: **RED** — extension method missing; `SampleEntity` probe context cannot run.
- `ApplySnakeCaseNaming_IsIdempotent_AlreadySnakeCaseNamesAreUnchanged`
  - Status: **RED** — same; confirms per-entity `SetTableName("clientes")` overrides are preserved (Epic 2 forward-compat).

**File 3 (NEW):** `backend/tests/SiesaAgents.UnitTests/Architecture/InfrastructureProjectReferenceTests.cs`

Covers AC #7 — Clean Architecture dependency direction.

- `Infrastructure_DoesNotReferenceApplication`
  - Status: **RED** — `SiesaAgents.Infrastructure.csproj` still has `<ProjectReference Include="..\SiesaAgents.Application..." />` (Story 1.1 leftover).
- `Infrastructure_DoesReferenceDomain`
  - Status: **GREEN-by-accident-today** but will stay green throughout the story (kept as a regression guard against accidental removal during Task 1).

### API Integration Tests — xUnit + `WebApplicationFactory<Program>` (10 total)

**File 4 (NEW):** `backend/tests/SiesaAgents.IntegrationTests/ProblemDetailsTests.cs` — `[Trait("Category","Api")]`

Covers AC #3 + AC #6 (third bullet) — TC-E1-P0-05 (Problem Details RFC 7807 / NFR6). **No DB required.**

- `TestErrorEndpoint_Returns500StatusCode`
  - Status: **RED** — `/api/v1/test-error` endpoint not yet mounted in `Program.cs` (Task 5).
- `TestErrorEndpoint_ReturnsApplicationProblemJsonContentType`
  - Status: **RED** — endpoint missing → 404 today (which has the right content-type, but middleware path needs the throw).
- `TestErrorEndpoint_BodyConformsToRfc7807_HasRequiredFields`
  - Status: **RED** — same.
- `TestErrorEndpoint_BodyDoesNotLeakStackTrace`
  - Status: **RED** — same; locks NFR6 once endpoint exists.
- `TestErrorEndpoint_BodyDoesNotLeakExceptionField`
  - Status: **RED** — same.
- `TestErrorEndpoint_BodyDoesNotLeakRawExceptionMessage`
  - Status: **RED** — same; pins on the sentinel string `"Forced failure for Problem Details smoke test."`.
- `TestErrorEndpoint_TypeMemberIsAbsoluteHttpUri`
  - Status: **RED** — same.
- `TestErrorEndpoint_InstanceMemberMatchesRequestPath`
  - Status: **RED** — same.

> **Compile-time RED precondition:** `Program` must be exposed as `public partial class Program { }` (or via `InternalsVisibleTo`) before `WebApplicationFactory<Program>` can reference it. Story Dev Notes specify the partial-class trick (canonical Microsoft pattern).

**File 5 (NEW):** `backend/tests/SiesaAgents.IntegrationTests/EfCoreDiRegistrationTests.cs` — `[Trait("Category","Api")]`

Covers AC #5 — DI wiring for `AddDbContext<AppDbContext>` + `UseNpgsql`.

- `AppDbContext_IsResolvableFromRootServiceProvider`
  - Status: **RED** — `Program.cs` has no `builder.Services.AddDbContext<AppDbContext>(...)` call yet (Task 3).
- `AppDbContext_IsConfiguredWithNpgsqlProvider`
  - Status: **RED** — same; asserts the provider is `Npgsql.EntityFrameworkCore.PostgreSQL` (not `InMemory` / `Sqlite`).

### Db Integration Tests — xUnit + Testcontainers-Postgres (3 total)

**File 6 (NEW):** `backend/tests/SiesaAgents.IntegrationTests/MigrationCreatesDbTests.cs` — `[Trait("Category","Db")]`

QA-owned, skipped by default (`dotnet test --filter "Category!=Db"`). Covers AC #1, AC #2, AC #4 — TC-E1-P1-05 + TC-E1-P2-04.

- `Migrate_CreatesDatabase_And_EfMigrationsHistoryTable`
  - Status: **RED** — `AppDbContext` + `InitialCreate` migration not yet present (Tasks 2 + 4).
- `Migrate_DoesNotCreateDomainTables_PerScopeNote`
  - Status: **RED** — same; locks the Scope Note (no `clientes`, no `contactos`).
- `EfMigrationsHistory_AllColumnNamesAreLowerSnakeCase`
  - Status: **RED** — same; verifies `migration_id` + `product_version` after `ApplySnakeCaseNaming()` rewrites EF's defaults.

---

## Test Files Summary

| File | Project | Tests | AC(s) | Trace ID(s) |
|------|---------|-------|-------|-------------|
| `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs` | UnitTests | 5 | #4, #5, #6 | (DEV unit) |
| `backend/tests/SiesaAgents.UnitTests/Data/Extensions/ModelBuilderSnakeCaseExtensionsTests.cs` | UnitTests | 4 (10 cases via Theory) | #4, #6 | TC-E1-P2-04 (unit half) |
| `backend/tests/SiesaAgents.UnitTests/Architecture/InfrastructureProjectReferenceTests.cs` | UnitTests | 2 | #7 | (Story 1.1 AI-Review[HIGH] close) |
| `backend/tests/SiesaAgents.IntegrationTests/ProblemDetailsTests.cs` | IntegrationTests | 8 | #3, #6 | TC-E1-P0-05 |
| `backend/tests/SiesaAgents.IntegrationTests/EfCoreDiRegistrationTests.cs` | IntegrationTests | 2 | #5 | (DEV integration) |
| `backend/tests/SiesaAgents.IntegrationTests/MigrationCreatesDbTests.cs` | IntegrationTests (Db) | 3 | #1, #2, #4 | TC-E1-P1-05, TC-E1-P2-04 |
| **Total** | — | **24 tests** | All ACs | 3 P0/P1/P2 traces |

---

## Data Factories Created

**None.** This story is pure infrastructure plumbing — no domain entities exist yet (`clientes` / `contactos` land in Epics 2 / 3). The throwaway `SampleEntity` inside `ModelBuilderSnakeCaseExtensionsTests.cs` is a test-only probe, intentionally not a shared factory.

---

## Fixtures Created

**None new at the fixture layer.** xUnit's `IClassFixture<WebApplicationFactory<Program>>` and `IAsyncLifetime` on `MigrationCreatesDbTests` provide setup/teardown directly (canonical xUnit + Microsoft.AspNetCore.Mvc.Testing patterns). Testcontainers-Postgres is initialized per-test-class and disposed automatically.

---

## Mock Requirements

**None new.** The Problem Details integration test drives the real middleware end-to-end through the in-process test server. No external services to mock in this story.

---

## Required `data-testid` Attributes

**N/A — pure backend story.** No UI changes in Story 1.3 (frontend ships placeholder views from Story 1.2 unchanged).

---

## Implementation Checklist (Maps Failing Tests → Production Code)

### Test cluster: `AppDbContextTests.cs` + `ModelBuilderSnakeCaseExtensionsTests.cs` (AC #4, #5, #6)

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` per Dev Notes skeleton (primary ctor accepting `DbContextOptions<AppDbContext>`, no `DbSet<T>`, `ApplySnakeCaseNaming()` LAST in `OnModelCreating`).
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Extensions/ModelBuilderSnakeCaseExtensions.cs` per Dev Notes skeleton (public `ApplySnakeCaseNaming`, internal `ToSnakeCase` with the regex-free rule).
- [ ] Add `[assembly: InternalsVisibleTo("SiesaAgents.UnitTests")]` on `SiesaAgents.Infrastructure` so the test file can call `ToSnakeCase` directly.
- [ ] Run: `dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"`
- [ ] All 9 unit tests pass (green).

### Test cluster: `InfrastructureProjectReferenceTests.cs` (AC #7)

- [ ] Open `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`.
- [ ] DELETE the line `<ProjectReference Include="..\SiesaAgents.Application\SiesaAgents.Application.csproj" />` (closes Story 1.1 `[AI-Review][HIGH]`).
- [ ] Run: `dotnet build backend/SiesaAgents.slnx` — must exit 0 with 0 warnings.
- [ ] Run: `dotnet test --filter "FullyQualifiedName~InfrastructureProjectReferenceTests"`
- [ ] Both tests pass (green).

### Test cluster: `ProblemDetailsTests.cs` (AC #3, AC #6 — TC-E1-P0-05)

- [ ] At the bottom of `backend/src/SiesaAgents.API/Program.cs`, add `public partial class Program { }` so `WebApplicationFactory<Program>` can find it.
- [ ] Inside `Program.cs`, after `app.MapScalarApiReference();`, mount:

  ```csharp
  if (app.Environment.IsDevelopment())
  {
      app.MapGet("/api/v1/test-error", () =>
      {
          throw new InvalidOperationException("Forced failure for Problem Details smoke test.");
      });
  }
  ```
- [ ] Confirm `ExceptionHandlingMiddleware.cs` still uses `contentType: "application/problem+json"` and does NOT add `Detail = ex.Message`. (Story Dev Notes: current implementation already satisfies the contract.)
- [ ] Run: `dotnet test --filter "FullyQualifiedName~ProblemDetailsTests"`
- [ ] All 8 tests pass (green).

### Test cluster: `EfCoreDiRegistrationTests.cs` (AC #5)

- [ ] In `Program.cs`, after `builder.Services.AddCors(...)` and before `var app = builder.Build();`, add:

  ```csharp
  builder.Services.AddDbContext<AppDbContext>(options =>
      options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
  ```
- [ ] Add `using Microsoft.EntityFrameworkCore;` and `using SiesaAgents.Infrastructure.Data;` at the top of `Program.cs`.
- [ ] Add `Microsoft.EntityFrameworkCore.Design` (with `PrivateAssets="all"`) to `SiesaAgents.API.csproj`.
- [ ] Add a placeholder `ConnectionStrings:DefaultConnection` to `appsettings.json` so non-Dev environments still resolve (empty string acceptable — DO NOT commit real prod creds).
- [ ] Run: `dotnet test --filter "FullyQualifiedName~EfCoreDiRegistrationTests"`
- [ ] Both tests pass (green).

### Test cluster: `MigrationCreatesDbTests.cs` (AC #1, #2, #4 — TC-E1-P1-05 + TC-E1-P2-04)

- [ ] From `backend/`, run:

  ```bash
  dotnet ef migrations add InitialCreate \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API \
    --output-dir Data/Migrations
  ```
- [ ] Verify generated `Data/Migrations/{timestamp}_InitialCreate.cs` `Up()` body is empty (no `CreateTable` for `clientes` / `contactos`).
- [ ] Verify `Data/Migrations/AppDbContextModelSnapshot.cs` is generated.
- [ ] (Optional, opt-in CI) Run: `dotnet test backend/SiesaAgents.slnx` (no `Category!=Db` filter) — requires Docker for Testcontainers-Postgres.
- [ ] All 3 Db tests pass (green).

---

## Running Tests

```bash
# Default loop — fast feedback, no DB required (24 - 3 Db tests = 21 tests run)
dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"

# Single test file
dotnet test backend/SiesaAgents.slnx \
  --filter "FullyQualifiedName~ProblemDetailsTests"

# Full suite including Testcontainers-Postgres (CI / QA)
dotnet test backend/SiesaAgents.slnx

# Verbose runtime output for debugging
dotnet test backend/SiesaAgents.slnx --filter "Category!=Db" --logger "console;verbosity=detailed"

# Coverage
dotnet test backend/SiesaAgents.slnx --filter "Category!=Db" --collect:"XPlat Code Coverage"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- [x] All 24 tests written across 6 files (5 NEW + 1 PRE-EXISTING from prior ATDD pass).
- [x] All tests fail at **compile time** today because `SiesaAgents.Infrastructure.Data.AppDbContext` and `SiesaAgents.Infrastructure.Data.Extensions.ModelBuilderSnakeCaseExtensions` do not yet exist. This is the canonical first RED signal for ATDD on a greenfield infrastructure layer.
- [x] After Task 2 lands, tests will transition to **runtime RED** until each cluster's production code is in place.
- [x] Trace IDs aligned with `test-design-epic-1.md` (TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04) and AC IDs (AC-1.3.a/b/c/d).

### GREEN Phase (DEV)

1. Pick one failing test cluster from the Implementation Checklist (recommended order: `InfrastructureProjectReferenceTests` → `AppDbContext` + snake_case → `EfCoreDiRegistration` → `ProblemDetails` → `MigrationCreatesDb`).
2. Implement minimal code per the corresponding checklist.
3. Run the targeted filter to verify green.
4. Move to the next cluster.

### REFACTOR Phase (DEV)

1. With all tests green, audit the snake_case extension for clarity (the `StringBuilder` loop is intentionally regex-free per Dev Notes — preserve that decision).
2. Confirm `Program.cs` still has the Story 1.1 middleware ordering invariant (`ExceptionHandlingMiddleware` first).
3. Re-run the full suite + `dotnet build` (0 warnings under `<Nullable>enable</Nullable>`).

---

## Test Execution Evidence (RED Verification)

**Command:** `dotnet build backend/SiesaAgents.slnx`

**Result (RED — compile failure, as expected):**

```
SiesaAgents.UnitTests/Data/AppDbContextTests.cs(2,19): error CS0234: The type or namespace name 'Infrastructure' does not exist in the namespace 'SiesaAgents'
SiesaAgents.UnitTests/Data/Extensions/ModelBuilderSnakeCaseExtensionsTests.cs(2,19): error CS0234: The type or namespace name 'Infrastructure' does not exist in the namespace 'SiesaAgents'
SiesaAgents.IntegrationTests/EfCoreDiRegistrationTests.cs(3,19): error CS0234: The type or namespace name 'Infrastructure' does not exist in the namespace 'SiesaAgents'
SiesaAgents.IntegrationTests/MigrationCreatesDbTests.cs(3,19): error CS0234: ...
SiesaAgents.IntegrationTests/MigrationCreatesDbTests.cs(42,30): error CS0246: The type or namespace name 'AppDbContext' could not be found
SiesaAgents.IntegrationTests/MigrationCreatesDbTests.cs(111,68): error CS0246: ...

Build FAILED.
```

**Interpretation:**
- The errors target precisely the production types DEV must create (`SiesaAgents.Infrastructure.Data.AppDbContext`, `SiesaAgents.Infrastructure.Data.Extensions.ModelBuilderSnakeCaseExtensions`).
- No spurious failures: every error message names a Story 1.3 deliverable.
- `ProblemDetailsTests.cs`, `EfCoreDiRegistrationTests.cs`, and `InfrastructureProjectReferenceTests.cs` will compile as soon as the Infrastructure types exist, then fail at runtime for their targeted behavioral reasons.

**Expected runtime failure messages after Step 1 of DEV (creating the empty `AppDbContext`):**

- `AppDbContext_OnModelCreating_AppliesSnakeCaseNamingAsLastStep` → asserts on regex match → fails with `Assert.Matches() Failure` until Task 2 ships `ApplySnakeCaseNaming()`.
- `TestErrorEndpoint_Returns500StatusCode` → fails with `Assert.Equal() Failure — expected 500, got 404` until Task 5 mounts the endpoint.
- `AppDbContext_IsResolvableFromRootServiceProvider` → fails with `Assert.NotNull() Failure` until Task 3 calls `AddDbContext<AppDbContext>(...)`.
- `Migrate_CreatesDatabase_And_EfMigrationsHistoryTable` → fails with `Microsoft.EntityFrameworkCore.Migrations.MigrationsAssembly` exception until Task 4 generates `InitialCreate`.
- `Infrastructure_DoesNotReferenceApplication` → fails with `Assert.DoesNotContain() Failure — collection contains "SiesaAgents.Application"` until Task 1's csproj edit.

---

## Knowledge Base References Applied

- **test-quality.md** — Given-When-Then in every test, atomic single-assertion design (one assertion per behavioural fact).
- **test-levels-framework.md** — API Integration chosen as primary level (story is pure infrastructure plumbing); unit tests for pure rules (`ToSnakeCase`); Db-integration tests gated by trait so the default loop stays fast.
- **selector-resilience.md** — N/A for backend; substituted by reflection-based assembly assertions (most resilient form of "selector" for compiled C# tests).
- **timing-debugging.md** — All async tests `await` directly; no `Task.Delay`/`Thread.Sleep`.
- **fixture-architecture.md** — `IClassFixture<WebApplicationFactory<Program>>` and `IAsyncLifetime` (Testcontainers) used as the xUnit-idiomatic equivalents of Playwright fixtures.

---

## Notes / Special Considerations

- **Compile-RED is intentional.** The story creates entirely new types under `SiesaAgents.Infrastructure.Data.*`. ATDD here means "the test referencing the type to be created" — its first failure is the linker / compiler.
- **`InternalsVisibleTo` placement matters.** The story file mandates the attribute on `SiesaAgents.Infrastructure`, not on `Microsoft.EntityFrameworkCore`. The Theory test calls `ModelBuilderSnakeCaseExtensions.ToSnakeCase(...)` directly — if DEV chooses to make the helper `private` instead, the cleanest fix is to move the rule into the public surface or replace the direct call with a model-driven assertion (already covered by the two `ApplySnakeCaseNaming_*` `[Fact]`s in the same file).
- **Db-tagged tests require Docker.** Local devs without Docker run the default filter `--filter "Category!=Db"` and remain green. CI / QA opts in by removing the filter.
- **Story 1.1 cleanup is now testable.** The `InfrastructureProjectReferenceTests` is the first executable enforcement of Clean Architecture in this codebase — future stories should keep it green by convention.
- **No frontend churn.** The frontend continues to ship the placeholder views from Story 1.2.

---

## Next Steps for DEV

1. Run the failing compile to confirm the RED state: `dotnet build backend/SiesaAgents.slnx`.
2. Work the Implementation Checklist top-down (Task 1 → Task 7 mirror the test clusters above).
3. After each task, re-run the matching `--filter` to flip that cluster green.
4. Final gate: `dotnet build backend/SiesaAgents.slnx` (0 warnings) + `dotnet test backend/SiesaAgents.slnx --filter "Category!=Db"` (all green).
5. CI / QA picks up the `Db`-tagged suite via TestContainers-Postgres.

---

**Generated by BMad TEA Agent — 2026-06-02**
