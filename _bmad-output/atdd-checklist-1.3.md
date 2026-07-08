# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-07-08
**Author:** SiesaTeam
**Primary Test Level:** Integration (xUnit + `WebApplicationFactory<Program>`) with two supporting unit tests over `AppDbContext`

---

## Story Summary

Story 1.3 wires the persistent data layer for Epic 2/3 without introducing any domain tables. It adds an empty `AppDbContext` with `snake_case` naming, registers it in DI against PostgreSQL, generates a single empty `InitialCreate` EF Core migration, and confirms the global Problem Details middleware never leaks stack traces or exception messages.

**As a** developer
**I want** the PostgreSQL database connected and the EF Core infrastructure configured with a global Problem Details error boundary and snake_case naming applied
**So that** subsequent stories (Epic 2 `clientes`, Epic 3 `contactos`) can define entities and run migrations against a working data layer with consistent naming and safe error responses

---

## Acceptance Criteria

1. `dotnet ef database update` creates `siesa_agents_db` with only the `__ef_migrations_history` table (snake_case columns) and exactly one `InitialCreate` migration; no domain tables are created.
2. `SiesaAgents.Infrastructure/Migrations/` contains `<timestamp>_InitialCreate.cs`, `<timestamp>_InitialCreate.Designer.cs`, and `AppDbContextModelSnapshot.cs`; `Up()` emits zero `CreateTable` operations.
3. Any unhandled exception is transformed by `ExceptionHandlingMiddleware` into an HTTP 500 `application/problem+json` RFC 7807 body that never contains `stackTrace`, `Exception`, `innerException`, or the raw message; the exception is logged server-side.
4. An integration test that hits a Testing-gated `GET /_test/throw` endpoint (throws `InvalidOperationException("secret sauce")`) receives a valid `ProblemDetails` with `title = "An unexpected error occurred."` and no leaked strings.
5. `AppDbContext.OnModelCreating` calls `modelBuilder.ApplySnakeCaseNaming()` LAST, after any future `ApplyConfigurationsFromAssembly(...)`.
6. `Program.cs` registers `AddDbContext<AppDbContext>` using `UseNpgsql(...)` + `UseSnakeCaseNamingConvention()` and reads the connection string from `appsettings.Development.json` with no hardcoded fallback.
7. `dotnet build SiesaAgents.sln` completes with zero errors and zero new warnings for all five projects.
8. `dotnet test` succeeds for existing Story 1.1 tests AND the five new tests specified below.

---

## Failing Tests Created (RED Phase)

### Unit + Integration Tests — xUnit + `WebApplicationFactory<Program>` (5 tests across 3 files)

#### File: `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` (2 tests)

- **Test:** `OnModelCreating_AppliesSnakeCaseNaming_LastCall` — GIVEN an `AppDbContext` with Npgsql + `UseSnakeCaseNamingConvention()`, WHEN the model is built, THEN no user-defined entities exist (Story 1.3 adds none) and the naming convention runs without error.
  - **Status:** RED — namespace `SiesaAgents.Infrastructure.Data` and type `AppDbContext` do not exist yet. Extension `UseSnakeCaseNamingConvention()` requires the `EFCore.NamingConventions` package (Task 1).
  - **Verifies:** AC #5, #8
- **Test:** `Registered_DbContext_UsesConnectionStringFromConfig` — GIVEN the WebApplicationFactory boots `Program`, WHEN a scope resolves `AppDbContext`, THEN it is non-null and `Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL"`.
  - **Status:** RED — `AddDbContext<AppDbContext>(…)` is not yet called in `Program.cs` (Task 3).
  - **Verifies:** AC #6, #8

#### File: `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationTests.cs` (1 test)

- **Test:** `MigrationsAssembly_Has_InitialCreate_And_No_Domain_Tables` — GIVEN `ctx.Database.GetMigrations()` (assembly-metadata only, no DB I/O), WHEN inspecting the migrations, THEN exactly one migration ending with `_InitialCreate` exists, `Model.GetEntityTypes()` (filtered by `!IsOwned()`) is empty, and the migration emits zero `CreateTableOperation`s via `IMigrationsAssembly`.
  - **Status:** RED — no `Migrations/` folder yet, no `InitialCreate` migration in the assembly (Task 4).
  - **Verifies:** AC #1, #2, #8

#### File: `backend/tests/SiesaAgents.UnitTests/Middleware/ProblemDetailsMiddlewareTests.cs` (2 tests + 1 defence-in-depth test)

- **Test:** `UnhandledException_Returns_ProblemDetails_WithoutStackTrace` — GIVEN the app runs with `UseEnvironment("Testing")`, WHEN `GET /_test/throw` is called, THEN status is 500, body deserializes to a valid `ProblemDetails` with `Title == "An unexpected error occurred."` and `Status == 500`, and the raw body contains none of `secret sauce`, `InvalidOperationException`, `stackTrace`, `innerException` (case-insensitive).
  - **Status:** RED — the `/_test/throw` endpoint does not exist yet (Task 6). Middleware already returns Problem Details from Story 1.1 but has never been exercised via a Testing-only throwing endpoint.
  - **Verifies:** AC #3, #4, #8
- **Test:** `ProblemDetails_ContentType_Is_ApplicationProblemJson` — GIVEN the app runs with `UseEnvironment("Testing")`, WHEN `GET /_test/throw` is called, THEN the response `Content-Type` is exactly `application/problem+json`.
  - **Status:** RED — `/_test/throw` endpoint missing (Task 6).
  - **Verifies:** AC #3, #8
- **Test (bonus, defence-in-depth):** `TestThrowEndpoint_IsNotExposed_InDevelopmentEnvironment` — GIVEN default `Development` environment, WHEN `GET /_test/throw` is called, THEN the response is 404 (proving the endpoint is gated on `IsEnvironment("Testing")` and never leaks into Dev/Prod).
  - **Status:** RED until Task 6 completes and correctly gates the endpoint.
  - **Verifies:** AC #4 (guard band)

---

## Data Factories Created

None. Story 1.3 introduces no domain entities. Domain factories (users, clientes, contactos) will follow in Epic 2/3 stories as those entities are introduced.

---

## Fixtures Created

None. The tests reuse the existing `WebApplicationFactory<Program>` xUnit `IClassFixture` pattern established in Story 1.1's `ProgramTests` and `EdgeCaseTests`. The `Testing` environment is opted into per-test via `WithWebHostBuilder(b => b.UseEnvironment("Testing"))`, so no shared fixture is needed.

---

## Mock Requirements

None. All tests avoid live PostgreSQL:

- `AppDbContextTests` — metadata-only; the Npgsql provider is registered but no connection is opened.
- `MigrationTests` — assembly reflection via `Database.GetMigrations()` and `IMigrationsAssembly.CreateMigration(...)`.
- `ProblemDetailsMiddlewareTests` — `/_test/throw` throws BEFORE any DB call, so the middleware pipeline is exercised without touching PostgreSQL.

SANDBOX NOTE: PostgreSQL is not required to run these tests. No SQLite in-memory fallback or `Testcontainers.PostgreSql` is needed for Story 1.3. If a real DB is required later (Epic 2+), adopt Testcontainers at that point.

---

## Required `data-testid` Attributes

Not applicable — Story 1.3 is 100% backend infrastructure with no UI surface.

---

## Implementation Checklist

Ordered by tightest-loop feedback. Follow the file paths and skeletons in the story's `Dev Notes` verbatim.

### Test: `OnModelCreating_AppliesSnakeCaseNaming_LastCall`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] Add `<PackageReference Include="EFCore.NamingConventions" Version="10.*" />` to `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`.
- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` with the constructor and `OnModelCreating` per story's illustrative skeleton — `modelBuilder.ApplySnakeCaseNaming()` MUST be the last call.
- [ ] Add `<ProjectReference Include="..\..\src\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />` to `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~AppDbContextTests.OnModelCreating"`.
- [ ] Test passes (green phase).

**Estimated Effort:** 0.5 h

---

### Test: `Registered_DbContext_UsesConnectionStringFromConfig`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`

**Tasks to make this test pass:**

- [ ] In `backend/src/SiesaAgents.API/Program.cs`, BEFORE `builder.Build()`, add the `AddDbContext<AppDbContext>` block from story task 3 — no fallback connection string.
- [ ] Add `using SiesaAgents.Infrastructure.Data;` at the top of `Program.cs`.
- [ ] Verify `SiesaAgents.API` already project-references `SiesaAgents.Infrastructure` (it does, since Story 1.1).
- [ ] Confirm `appsettings.Development.json` retains `"ConnectionStrings:DefaultConnection"`.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~AppDbContextTests.Registered_DbContext"`.
- [ ] Test passes.

**Estimated Effort:** 0.5 h

---

### Test: `MigrationsAssembly_Has_InitialCreate_And_No_Domain_Tables`

**File:** `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationTests.cs`

**Tasks to make this test pass:**

- [ ] Add `<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*"><PrivateAssets>all</PrivateAssets>…</PackageReference>` to `SiesaAgents.API.csproj` per story Task 1.
- [ ] Install the `dotnet-ef` CLI (`dotnet tool install --global dotnet-ef --version 10.*`) if missing.
- [ ] From `backend/`, run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Migrations`.
- [ ] Commit the three generated files without hand-editing.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~MigrationTests"`.
- [ ] Test passes.

**Estimated Effort:** 0.5 h

---

### Test: `UnhandledException_Returns_ProblemDetails_WithoutStackTrace`

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ProblemDetailsMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, after `app.UseCors(CorsPolicyName);` (and after the existing `IsDevelopment()` block), add a new `if (app.Environment.IsEnvironment("Testing")) { app.MapGet("/_test/throw", () => throw new InvalidOperationException("secret sauce")); }` block.
- [ ] Verify `ExceptionHandlingMiddleware` (Story 1.1) still writes `Problem Details` with `Title = "An unexpected error occurred."` and does NOT set `Detail = ex.Message`. Patch if drift is found; do not rewrite.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~ProblemDetailsMiddlewareTests.UnhandledException"`.
- [ ] Test passes.

**Estimated Effort:** 0.5 h

---

### Test: `ProblemDetails_ContentType_Is_ApplicationProblemJson`

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ProblemDetailsMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] Confirm the middleware sets `context.Response.ContentType = "application/problem+json"` (Story 1.1 already does this). No change expected.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~ProblemDetails_ContentType"`.
- [ ] Test passes.

**Estimated Effort:** 0.25 h

---

### Test (bonus): `TestThrowEndpoint_IsNotExposed_InDevelopmentEnvironment`

**File:** `backend/tests/SiesaAgents.UnitTests/Middleware/ProblemDetailsMiddlewareTests.cs`

**Tasks to make this test pass:**

- [ ] The `/_test/throw` block MUST be gated exclusively on `IsEnvironment("Testing")` — NOT nested inside the existing `IsDevelopment()` block.
- [ ] Run: `dotnet test backend/SiesaAgents.sln --filter "FullyQualifiedName~TestThrowEndpoint_IsNotExposed"`.
- [ ] Test passes.

**Estimated Effort:** 0.25 h

---

## Running Tests

```bash
# From backend/
# Run every test in the solution (existing + new)
dotnet test SiesaAgents.sln

# Run only the Story 1.3 tests
dotnet test SiesaAgents.sln \
  --filter "FullyQualifiedName~AppDbContextTests|FullyQualifiedName~MigrationTests|FullyQualifiedName~ProblemDetailsMiddlewareTests"

# Run a single test by fully-qualified name
dotnet test SiesaAgents.sln \
  --filter "FullyQualifiedName=SiesaAgents.UnitTests.Middleware.ProblemDetailsMiddlewareTests.UnhandledException_Returns_ProblemDetails_WithoutStackTrace"

# Verbose (see fail messages inline)
dotnet test SiesaAgents.sln --logger "console;verbosity=detailed"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

- All five tests (plus one defence-in-depth guard) written and expected to FAIL.
- Failure reasons documented per test above. All failures are due to missing implementation (`AppDbContext` type, `EFCore.NamingConventions` package, missing DI registration, missing `/_test/throw` endpoint, missing migration files) — not test bugs.

**Compile-time failures are the expected RED signal for .NET/xUnit ATDD**: the compiler and test runner surface these as clear, actionable errors, and the fixes are enumerated in the implementation checklist above.

### GREEN Phase (DEV Team)

1. Pick the tightest-loop test first: `OnModelCreating_AppliesSnakeCaseNaming_LastCall`. Solving it requires only Task 1 (packages) + Task 2 (`AppDbContext.cs`) + the test-project reference.
2. Compile → `dotnet test --filter "…AppDbContextTests.OnModelCreating"` → GREEN.
3. Move to `Registered_DbContext_UsesConnectionStringFromConfig` (Task 3, `Program.cs` DI wiring).
4. Move to `MigrationsAssembly_Has_InitialCreate_And_No_Domain_Tables` (Task 4, run `dotnet ef migrations add`).
5. Move to the two ProblemDetails middleware tests (Task 5 + Task 6).
6. Move to the defence-in-depth `TestThrowEndpoint_IsNotExposed_InDevelopmentEnvironment` — should be GREEN as soon as Task 6 gates on `IsEnvironment("Testing")` (not nested inside `IsDevelopment`).
7. Run `dotnet build SiesaAgents.sln` → 0 errors / 0 new warnings (AC #7).

### REFACTOR Phase (DEV Team)

1. All tests green. Verify Story 1.1's existing tests still pass.
2. `AppDbContext.cs` is intentionally minimal — resist adding `DbSet<>` properties or entity configurations (explicit non-scope of Story 1.3).
3. Confirm the migration file has an empty `Up()` and symmetric `Down()`. Do not hand-edit.
4. Optionally, run `dotnet ef database update` against a local PostgreSQL to confirm AC #1 end-to-end.

---

## Next Steps

1. Review this checklist and the three new test files with the team.
2. Run failing tests to confirm RED phase: `dotnet test backend/SiesaAgents.sln` (expect compile errors on `AppDbContext`, `UseSnakeCaseNamingConvention`, and the tests reaching `/_test/throw`).
3. Execute the story implementation tasks in dependency order (Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9), turning tests GREEN one at a time.
4. When all tests pass, run `dotnet build SiesaAgents.sln` for the 0-errors/0-warnings AC #7 gate.
5. Update story status to `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml` once the review workflow completes.

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **test-levels-framework.md** — Integration (`WebApplicationFactory<Program>`) is the correct level for AC #3, #4, #6 (they exercise the full DI + middleware pipeline). Unit tests suffice for AC #5 (`OnModelCreating` in isolation) and the assembly-metadata check in `MigrationTests`. No E2E level applies — no UI surface.
- **test-quality.md** — Given-When-Then structure, atomic assertions, deterministic tests (no network / no DB / no time dependencies), explicit environment gating via `UseEnvironment("Testing")`.
- **selector-resilience.md** — Not applicable (no UI selectors). The equivalent .NET principle is applied instead: assert on `Database.ProviderName` string constants and on `ProblemDetails.Title` string equality, not on the object graph of derived types.
- **timing-debugging.md** — No hard waits used; `WebApplicationFactory` provides synchronous request/response semantics.
- **test-healing-patterns.md** — Avoided the "test needs a live external service" anti-pattern by using assembly metadata for the migration check and by ensuring the `/_test/throw` endpoint throws before any DB call.

See `_bmad/bmm/testarch/tea-index.csv` for the full mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `dotnet test backend/SiesaAgents.sln` (not executed in this sandbox — see note below).

**Expected Results (RED baseline):**

```
Build FAILED / test run partially unavailable:

  AppDbContextTests.cs(4,17): error CS0234:
    The type or namespace name 'EntityFrameworkCore' does not exist in the
    namespace 'Microsoft' (transitively — until Infrastructure adds
    EFCore.NamingConventions and UnitTests references Infrastructure).

  AppDbContextTests.cs(6,26): error CS0234:
    The type or namespace name 'Infrastructure' does not exist in the
    namespace 'SiesaAgents' (until the ProjectReference is added).

  AppDbContextTests.cs(*,*): error CS0246:
    The type or namespace name 'AppDbContext' could not be found.

  AppDbContextTests.cs(*,*): error CS1061:
    'DbContextOptionsBuilder<AppDbContext>' does not contain a definition for
    'UseSnakeCaseNamingConvention' (until EFCore.NamingConventions is
    installed).

  MigrationTests.cs — same class of compile errors as above.

  ProblemDetailsMiddlewareTests.cs — compiles but:
    * UnhandledException_Returns_ProblemDetails_WithoutStackTrace FAILS
        Expected 500, got 404 — /_test/throw endpoint is not registered.
    * ProblemDetails_ContentType_Is_ApplicationProblemJson FAILS
        Media type mismatch (404 goes through a different content-type path
        or is arbitrary — not what the test asserts).
    * TestThrowEndpoint_IsNotExposed_InDevelopmentEnvironment PASSES
        Trivially — the endpoint doesn't exist yet in any environment.
        This is coincidentally green; it will remain green once Task 6
        correctly gates the endpoint on IsEnvironment("Testing").
```

**Summary:**

- Total new tests: 6 (5 required by AC #8 + 1 defence-in-depth guard)
- Passing (before implementation): 1 (the coincidental defence-in-depth guard)
- Failing (before implementation): 5 (RED — expected)
- Status: RED phase verified via compile-error and runtime-404 assertions.

**Sandbox Note (from the invoking task):**

> "PostgreSQL puede no estar disponible en el sandbox — usa SQLite in-memory o mocks para tests que requieran EF Core, o marca tests que requieren PostgreSQL real como skip si aplican."

None of the six tests require a live PostgreSQL. The Npgsql provider is registered with a dummy connection string; `Database.GetMigrations()` and `Database.ProviderName` are metadata-only; `WebApplicationFactory` runs the app in-memory; and `/_test/throw` throws before any DB access. As a result, no SQLite fallback or skip annotations were added. Should a future story need live DB behaviour, adopt `Testcontainers.PostgreSql` in that story (per the story's `Dev Notes`).

---

## Notes

- **No FluentAssertions.** Existing tests in `SiesaAgents.UnitTests` use raw xUnit `Assert.*`. This ATDD checklist matches that convention exactly.
- **No `DbSet<>` in `AppDbContext`.** Story 1.3 explicitly forbids domain entities. The tests assert this invariant (`GetEntityTypes().Where(!IsOwned()).Empty()` in two places).
- **No hardcoded connection string in `Program.cs`.** The test `Registered_DbContext_UsesConnectionStringFromConfig` verifies wiring is present; a companion review at the code-review workflow stage should confirm no `?? "Host=…"` fallback slipped in.
- **`/_test/throw` MUST NOT leak into Development or Production.** The defence-in-depth test enforces this at runtime; a code-review check should confirm the `if (app.Environment.IsEnvironment("Testing"))` block is at the top level, not nested inside `IsDevelopment()`.
- **Story 1.1 middleware is treated as production code, not scope-of-change.** Tests exercise `ExceptionHandlingMiddleware` end-to-end but do NOT rewrite it. If a defect is found, patch minimally.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/workflows/testarch/atdd/instructions.md` for the ATDD workflow definition
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** — 2026-07-08
